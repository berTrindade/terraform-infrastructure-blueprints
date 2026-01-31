/**
 * Catalog service for generating blueprint catalog content
 */

import { execa } from "execa";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { BLUEPRINTS } from "../config/constants.js";
import { config } from "../config/config.js";
import { logger } from "../utils/logger.js";

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates fallback catalog content
 *
 * @returns Markdown content string
 */
function generateFallbackContent(): string {
  const blueprintTable = BLUEPRINTS.map(
    (b) => `| ${b.name} | ${b.description} | ${b.database} | ${b.pattern} | ${b.useCase} | ${b.origin || "TBD"} |`
  ).join("\n");

  return `# Terraform Infrastructure Blueprints

## Blueprint Catalog

| Blueprint | Description | Database | Pattern | Use Case | Origin |
|-----------|-------------|----------|---------|----------|--------|
${blueprintTable}

## Quick Start

\`\`\`bash
# Download a blueprint (use your preferred method - git clone, GitHub CLI, etc.)
git clone https://github.com/${config.github.repo}.git
cd terraform-infrastructure-blueprints/aws/{blueprint-name}

# Deploy
cd environments/dev
terraform init && terraform apply
\`\`\`

For full documentation, see the AGENTS.md file in the repository.
`;
}

/**
 * Fetches AGENTS.md content from local file or GitHub
 *
 * @returns Markdown content string
 */
export async function getAgentsMdContent(): Promise<string> {
  // Try local file first
  const localPaths = [
    path.join(process.cwd(), "AGENTS.md"),
    path.join(__dirname, "../../AGENTS.md"),
    path.join(__dirname, "../../../AGENTS.md"),
  ];

  for (const localPath of localPaths) {
    try {
      if (fs.existsSync(localPath)) {
        logger.info({
          operation: "get_agents_md_content",
          source: "local",
          path: localPath,
          outcome: "success",
        });
        return fs.readFileSync(localPath, "utf-8");
      }
    } catch (error) {
      // Continue to next path, don't log each failure
    }
  }

  // Try fetching from GitHub using gh CLI
  try {
    const sanitizedRepo = config.github.repo.replace(/[^a-zA-Z0-9\/-]/g, "");
    
    // Use execa for safer command execution with array arguments
    const { stdout: apiOutput } = await execa("gh", [
      "api",
      `repos/${sanitizedRepo}/contents/AGENTS.md`,
      "--jq",
      ".content"
    ], { 
      timeout: config.github.timeout,
      encoding: "utf8",
    });

    // Decode base64 content using Node.js Buffer (more secure than shell command)
    const content = Buffer.from(apiOutput.trim(), "base64").toString("utf-8");

    logger.info({
      operation: "get_agents_md_content",
      source: "github",
      repo: sanitizedRepo,
      outcome: "success",
    });
    return content;
  } catch (error) {
    logger.info({
      operation: "get_agents_md_content",
      source: "fallback",
      outcome: "success",
      error: {
        type: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      },
    });
    return generateFallbackContent();
  }
}
