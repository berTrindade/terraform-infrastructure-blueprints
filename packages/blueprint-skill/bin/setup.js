#!/usr/bin/env node

/**
 * Setup script for @bertrindade/blueprint-skill
 * 
 * This script:
 * 1. Detects installed AI agents (Cursor, Claude Desktop, etc.)
 * 2. Installs the skill to detected agents using symlinks (with copy fallback)
 * 3. Creates/updates AGENTS.md in the project root
 * 4. Provides MCP server configuration instructions
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir, platform } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get package root (packages/blueprint-skill)
const packageRoot = path.resolve(__dirname, '..');

// Get project root (where package is installed)
const projectRoot = process.cwd();

// Agent configurations (inspired by agent-skills)
const AGENTS = {
  cursor: {
    name: 'cursor',
    displayName: 'Cursor',
    skillsDir: '.cursor/skills',
    globalSkillsDir: path.join(homedir(), '.cursor', 'skills'),
  },
  'claude-desktop': {
    name: 'claude-desktop',
    displayName: 'Claude Desktop',
    skillsDir: '.claude/skills',
    globalSkillsDir: path.join(homedir(), '.claude', 'skills'),
  },
  'github-copilot': {
    name: 'github-copilot',
    displayName: 'GitHub Copilot',
    skillsDir: '.github/skills',
    globalSkillsDir: path.join(homedir(), '.copilot', 'skills'),
  },
};

/**
 * Sanitize skill name to prevent path traversal
 */
function sanitizeName(name) {
  let sanitized = name.replace(/[/\\]/g, '');
  sanitized = sanitized.replace(/[\0:]/g, '');
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  sanitized = sanitized.replace(/^\.+/, '');
  if (!sanitized || sanitized.length === 0) sanitized = 'unnamed-skill';
  return sanitized.substring(0, 255);
}

/**
 * Check if target path is safe (within base path)
 */
function isPathSafe(basePath, targetPath) {
  const normalizedBase = path.normalize(path.resolve(basePath));
  const normalizedTarget = path.normalize(path.resolve(targetPath));
  const sep = path.sep;
  return normalizedTarget.startsWith(normalizedBase + sep) || normalizedTarget === normalizedBase;
}

/**
 * Create symlink (with fallback to copy)
 */
async function createSymlink(target, linkPath) {
  try {
    // Remove existing link or directory
    try {
      const stats = fs.lstatSync(linkPath);
      if (stats.isSymbolicLink()) {
        const existingTarget = fs.readlinkSync(linkPath);
        if (path.resolve(existingTarget) === path.resolve(target)) {
          return true; // Already correctly linked
        }
        fs.unlinkSync(linkPath);
      } else {
        fs.rmSync(linkPath, { recursive: true, force: true });
      }
    } catch (err) {
      // Path doesn't exist, continue
    }

    // Create parent directory
    const linkDir = path.dirname(linkPath);
    fs.mkdirSync(linkDir, { recursive: true });

    // Create symlink
    const relativePath = path.relative(linkDir, target);
    const type = platform() === 'win32' ? 'junction' : undefined;
    fs.symlinkSync(relativePath, linkPath, type);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Copy directory recursively
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory does not exist: ${src}`);
  }
  
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Detect installed agents
 */
function detectInstalledAgents() {
  const detected = [];
  for (const [key, agent] of Object.entries(AGENTS)) {
    const localPath = path.join(projectRoot, agent.skillsDir);
    const globalPath = agent.globalSkillsDir;
    
    if (fs.existsSync(localPath) || fs.existsSync(globalPath)) {
      detected.push(key);
    }
  }
  return detected;
}

/**
 * Install skill for a specific agent
 */
function installSkillForAgent(agent, local = true) {
  const skillName = 'blueprint-guidance';
  const safeSkillName = sanitizeName(skillName);
  const targetDir = local 
    ? path.join(projectRoot, agent.skillsDir)
    : agent.globalSkillsDir;
  const skillTargetPath = path.join(targetDir, safeSkillName);

  // Security check
  if (!isPathSafe(targetDir, skillTargetPath)) {
    console.error(`❌ Security: Invalid skill destination path for ${agent.displayName}`);
    return false;
  }

  try {
    const skillSource = path.join(packageRoot, 'templates', '.cursor', 'skills', safeSkillName);
    
    if (!fs.existsSync(skillSource)) {
      console.warn(`⚠️  Skill template not found for ${agent.displayName}, skipping`);
      return false;
    }

    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Try symlink first (more efficient)
    const symlinkCreated = createSymlink(skillSource, skillTargetPath);
    
    if (!symlinkCreated) {
      // Fallback to copy
      if (fs.existsSync(skillTargetPath)) {
        fs.rmSync(skillTargetPath, { recursive: true, force: true });
      }
      copyDirectory(skillSource, skillTargetPath);
      console.log(`✅ Installed ${agent.displayName} skill (copy): ${skillTargetPath}`);
    } else {
      console.log(`✅ Installed ${agent.displayName} skill (symlink): ${skillTargetPath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to install skill for ${agent.displayName}:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

console.log('🚀 Setting up @bertrindade/blueprint-skill...\n');

// Detect installed agents
const detectedAgents = detectInstalledAgents();

if (detectedAgents.length === 0) {
  // No agents detected, install to Cursor by default (most common)
  console.log('ℹ️  No agents detected, installing to Cursor by default\n');
  const cursorAgent = AGENTS.cursor;
  installSkillForAgent(cursorAgent, true);
} else {
  // Install to all detected agents
  console.log(`📦 Detected agents: ${detectedAgents.map(key => AGENTS[key].displayName).join(', ')}\n`);
  
  let installedCount = 0;
  for (const agentKey of detectedAgents) {
    const agent = AGENTS[agentKey];
    if (installSkillForAgent(agent, true)) {
      installedCount++;
    }
  }
  
  if (installedCount === 0) {
    console.warn('⚠️  No skills were installed. Check that templates exist.');
  }
}

// Create/update AGENTS.md
const agentsSource = path.join(packageRoot, 'templates', 'AGENTS.md');
const agentsDest = path.join(projectRoot, 'AGENTS.md');

if (fs.existsSync(agentsSource)) {
  const agentsContent = fs.readFileSync(agentsSource, 'utf-8');
  
  if (fs.existsSync(agentsDest)) {
    const existingContent = fs.readFileSync(agentsDest, 'utf-8');
    
    // Check if AGENTS.md already has blueprint guidance
    if (existingContent.includes('Infrastructure Blueprint Guidance')) {
      console.log('ℹ️  AGENTS.md already contains blueprint guidance, skipping update');
      console.log('   (To update manually, see templates/AGENTS.md)');
    } else {
      // Append to existing AGENTS.md
      const updatedContent = existingContent + '\n\n' + agentsContent;
      fs.writeFileSync(agentsDest, updatedContent, 'utf-8');
      console.log('✅ Updated AGENTS.md with blueprint guidance');
    }
  } else {
    // Create new AGENTS.md
    fs.writeFileSync(agentsDest, agentsContent, 'utf-8');
    console.log('✅ Created AGENTS.md with blueprint guidance');
  }
} else {
  console.warn('⚠️  AGENTS.md template not found, skipping AGENTS.md creation');
}

console.log('\n📋 Next Steps:\n');
console.log('1. Configure MCP server for blueprint discovery:');
console.log('   See: https://github.com/berTrindade/terraform-infrastructure-blueprints/tree/main/mcp-server#quick-start\n');
if (detectedAgents.length > 0) {
  console.log(`2. Restart your AI assistant${detectedAgents.length > 1 ? 's' : ''} (${detectedAgents.map(key => AGENTS[key].displayName).join(', ')}) to activate the skill\n`);
} else {
  console.log('2. Restart Cursor to activate the skill\n');
}
console.log('3. Start using blueprint patterns in your Terraform code!\n');
console.log('✨ Setup complete!');
