#!/usr/bin/env node

/**
 * Setup script for @ustwo/blueprint-skill
 * 
 * This script:
 * 1. Copies the Cursor skill to .cursor/skills/blueprint-guidance/
 * 2. Creates/updates AGENTS.md in the project root
 * 3. Provides MCP server configuration instructions
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get package root (packages/blueprint-skill)
const packageRoot = path.resolve(__dirname, '..');

// Get project root (where package is installed)
const projectRoot = process.cwd();

// Paths
const skillSource = path.join(packageRoot, 'templates', '.cursor', 'skills', 'blueprint-guidance');
const skillDest = path.join(projectRoot, '.cursor', 'skills', 'blueprint-guidance');
const agentsSource = path.join(packageRoot, 'templates', 'AGENTS.md');
const agentsDest = path.join(projectRoot, 'AGENTS.md');

console.log('🚀 Setting up @ustwo/blueprint-skill...\n');

// Create .cursor/skills directory if it doesn't exist
const cursorSkillsDir = path.join(projectRoot, '.cursor', 'skills');
if (!fs.existsSync(cursorSkillsDir)) {
  fs.mkdirSync(cursorSkillsDir, { recursive: true });
  console.log('✅ Created .cursor/skills/ directory');
}

// Copy skill file
if (fs.existsSync(skillSource)) {
  if (!fs.existsSync(skillDest)) {
    fs.mkdirSync(skillDest, { recursive: true });
  }
  
  const skillFile = path.join(skillSource, 'SKILL.md');
  const skillDestFile = path.join(skillDest, 'SKILL.md');
  
  if (fs.existsSync(skillFile)) {
    fs.copyFileSync(skillFile, skillDestFile);
    console.log('✅ Installed Cursor skill: .cursor/skills/blueprint-guidance/SKILL.md');
  }
} else {
  console.warn('⚠️  Skill template not found, skipping skill installation');
}

// Create/update AGENTS.md
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
console.log('2. Restart Cursor to activate the skill\n');
console.log('3. Start using blueprint patterns in your Terraform code!\n');
console.log('✨ Setup complete!');
