/**
 * Extract pattern tool handler
 */

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getExtractionPattern } from "../services/blueprint-service.js";
import { getCloudProvider } from "../utils/cloud-provider.js";
import { readBlueprintFile } from "../services/file-service.js";
import { logger } from "../utils/logger.js";

/**
 * Extract pattern tool schema
 */
export const extractPatternSchema = {
  description: "Get guidance on extracting a capability from blueprints. Example: extract_pattern(capability: 'database', include_code_examples: true)",
  inputSchema: {
    capability: z.string().describe("Capability: database, queue, auth, events, ai, notifications"),
    include_files: z.boolean().optional().describe("Include file contents?"),
    include_code_examples: z.boolean().optional().describe("Include code examples?"),
  },
  outputSchema: z.object({
    capability: z.string(),
    blueprint: z.string(),
    description: z.string(),
    modules: z.array(z.string()),
    integrationSteps: z.array(z.string()),
    files: z.array(z.string()).optional(),
    codeExamples: z.string().optional(),
  }),
};

/**
 * Extract pattern tool handler
 *
 * @param args - Tool arguments
 * @returns Tool response
 */
export async function handleExtractPattern(args: {
  capability: string;
  include_files?: boolean;
  include_code_examples?: boolean;
}) {
  const startTime = Date.now();
  const requestId = randomUUID();
  const wideEvent: Record<string, unknown> = {
    tool: "extract_pattern",
    request_id: requestId,
    capability: args.capability,
    include_files: args.include_files || false,
    include_code_examples: args.include_code_examples || false,
  };

  try {
    const capLower = args.capability.toLowerCase();
    const pattern = getExtractionPattern(capLower);

    if (!pattern) {
      const available = Object.keys({
        database: true,
        queue: true,
        auth: true,
        events: true,
        ai: true,
        notifications: true,
      }).join(", ");
      wideEvent.status_code = 400;
      wideEvent.outcome = "invalid_capability";
      wideEvent.duration_ms = Date.now() - startTime;
      logger.info(wideEvent);

      return {
        content: [{
          type: "text" as const,
          text: `Unknown capability "${args.capability}". Available: ${available}`,
          mimeType: "text/markdown",
        }],
        isError: true,
        structuredContent: {
          capability: args.capability,
          error: "unknown_capability",
          availableCapabilities: available.split(", "),
        },
      };
    }

    wideEvent.blueprint = pattern.blueprint;
    wideEvent.module_count = pattern.modules.length;

    const cloud = getCloudProvider(pattern.blueprint) || "aws";
    const moduleFiles = pattern.modules.map(m => `blueprints://${cloud}/${pattern.blueprint}/${m}main.tf`);
    wideEvent.cloud_provider = cloud;

    // Get file contents if requested
    let fileContents = "";
    if (args.include_files) {
      try {
        const files = [
          `blueprints://${cloud}/${pattern.blueprint}/README.md`,
          `blueprints://${cloud}/${pattern.blueprint}/environments/dev/main.tf`,
          ...moduleFiles
        ];
        const contents = await Promise.all(files.map(async uri => {
          try {
            const { content } = await readBlueprintFile(uri);
            const name = uri.split("/").pop() || "";
            return `### ${name}\n\n\`\`\`${name.endsWith(".tf") ? "hcl" : "markdown"}\n${content}\n\`\`\``;
          } catch {
            return "";
          }
        }));
        fileContents = `\n## Files\n\n${contents.filter(Boolean).join("\n\n")}`;
        wideEvent.files_loaded = contents.filter(Boolean).length;
      } catch (error) {
        fileContents = "\n## Files\n\n*Error loading files*";
        wideEvent.file_load_error = error instanceof Error ? error.message : String(error);
      }
    }

  // Get code examples if requested
  let codeExamples = "";
  if (args.include_code_examples && capLower === "database") {
    codeExamples = `\n## Code Example\n\n\`\`\`hcl\n# Add RDS to Lambda\nresource "aws_db_instance" "main" {\n  identifier = "\${var.project_name}-db"\n  engine = "postgres"\n  engine_version = "15.4"\n  # ... VPC config, security groups\n}\n\n# Update Lambda\nresource "aws_lambda_function" "api" {\n  vpc_config {\n    subnet_ids = aws_subnet.private[*].id\n    security_group_ids = [aws_security_group.lambda.id]\n  }\n}\n\`\`\``;
  }

    // Simple validation checklist
    const checks: Record<string, string[]> = {
      database: ["VPC in private subnets", "Security groups configured", "IAM permissions", "Encryption enabled"],
      queue: ["Dead-letter queue", "Visibility timeout set", "IAM permissions"],
      auth: ["User pool configured", "API Gateway authorizer", "Callback URLs"],
    };
    const checklist = checks[capLower] ? `\n## Checklist\n\n${checks[capLower].join("\n")}` : "";

    wideEvent.status_code = 200;
    wideEvent.outcome = "success";
    wideEvent.duration_ms = Date.now() - startTime;
    logger.info(wideEvent);

    const fileUris = [
      `blueprints://${cloud}/${pattern.blueprint}/README.md`,
      `blueprints://${cloud}/${pattern.blueprint}/environments/dev/main.tf`,
      ...moduleFiles,
    ];

    return {
      content: [{
        type: "text" as const,
        text: `# Extract: ${args.capability}

**Blueprint**: \`${pattern.blueprint}\`

${pattern.description}

## Modules
${pattern.modules.map(m => `- ${m}`).join("\n")}

## Steps
${pattern.integrationSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
${checklist}
${codeExamples}
## Files
- README: \`blueprints://${cloud}/${pattern.blueprint}/README.md\`
- Main: \`blueprints://${cloud}/${pattern.blueprint}/environments/dev/main.tf\`
${moduleFiles.map(f => `- Module: \`${f}\``).join("\n")}
${fileContents}

Use fetch_blueprint_file() to get specific files.`,
        mimeType: "text/markdown",
      }],
      structuredContent: {
        capability: args.capability,
        blueprint: pattern.blueprint,
        description: pattern.description,
        modules: pattern.modules,
        integrationSteps: pattern.integrationSteps,
        files: fileUris,
        codeExamples: codeExamples || undefined,
      },
    };
  } catch (error) {
    wideEvent.status_code = 500;
    wideEvent.outcome = "error";
    wideEvent.error = {
      type: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    };
    wideEvent.duration_ms = Date.now() - startTime;
    logger.error(wideEvent);
    throw error;
  }
}
