#!/usr/bin/env node

/**
 * Secrets Manager CLI
 *
 * Flow B helper script for seeding, reading, and listing secrets.
 * Terraform creates the shell secrets, engineers seed values via this CLI.
 *
 * Usage:
 *   node scripts/secrets.js seed    # Interactively seed secrets
 *   node scripts/secrets.js read    # Read all secrets
 *   node scripts/secrets.js list    # List secret names
 *
 * Environment:
 *   AWS_REGION       - AWS region (default: us-east-1)
 *   AWS_PROFILE      - AWS profile to use
 *   SECRET_PREFIX    - Secret prefix (default: /dev/command-worker)
 */

import {
  SecretsManagerClient,
  ListSecretsCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import * as readline from 'readline';

// Configuration
const REGION = process.env.AWS_REGION || 'us-east-1';
const SECRET_PREFIX = process.env.SECRET_PREFIX || '/dev/command-worker';

// Initialize client
const client = new SecretsManagerClient({ region: REGION });

/**
 * Create readline interface for interactive input
 */
function createReadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompt user for input
 */
async function prompt(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * List all secrets with the configured prefix
 */
async function listSecrets() {
  console.log(`\nListing secrets with prefix: ${SECRET_PREFIX}\n`);

  const secrets = [];
  let nextToken;

  do {
    const response = await client.send(
      new ListSecretsCommand({
        Filters: [
          {
            Key: 'name',
            Values: [SECRET_PREFIX],
          },
        ],
        NextToken: nextToken,
      })
    );

    secrets.push(...(response.SecretList || []));
    nextToken = response.NextToken;
  } while (nextToken);

  if (secrets.length === 0) {
    console.log('No secrets found. Run "terraform apply" first to create secret shells.');
    return [];
  }

  console.log('Secrets:');
  secrets.forEach((secret) => {
    console.log(`  - ${secret.Name}`);
    console.log(`    ARN: ${secret.ARN}`);
    console.log(`    Description: ${secret.Description || 'N/A'}`);
    console.log();
  });

  return secrets;
}

/**
 * Read and display all secrets
 */
async function readSecrets() {
  console.log(`\nReading secrets with prefix: ${SECRET_PREFIX}\n`);

  const secrets = await listSecrets();

  if (secrets.length === 0) return;

  console.log('\nSecret Values:\n');

  for (const secret of secrets) {
    try {
      const response = await client.send(
        new GetSecretValueCommand({
          SecretId: secret.ARN,
        })
      );

      const value = JSON.parse(response.SecretString);
      const isPlaceholder = value._placeholder === true;

      console.log(`${secret.Name}:`);

      if (isPlaceholder) {
        console.log('  Status: NOT SEEDED (placeholder)');
        console.log('  Run: node scripts/secrets.js seed');
      } else {
        console.log('  Status: SEEDED');
        // Mask sensitive values
        Object.keys(value).forEach((key) => {
          if (key.startsWith('_')) return;
          const maskedValue =
            typeof value[key] === 'string'
              ? value[key].substring(0, 4) + '****'
              : '[object]';
          console.log(`  ${key}: ${maskedValue}`);
        });
      }
      console.log();
    } catch (error) {
      console.log(`${secret.Name}:`);
      console.log(`  Error: ${error.message}`);
      console.log();
    }
  }
}

/**
 * Interactively seed secrets
 */
async function seedSecrets() {
  console.log(`\nSeeding secrets with prefix: ${SECRET_PREFIX}\n`);

  const secrets = await listSecrets();

  if (secrets.length === 0) return;

  const rl = createReadline();

  console.log('\nEnter values for each secret (or press Enter to skip):\n');

  for (const secret of secrets) {
    // Check if already seeded
    try {
      const response = await client.send(
        new GetSecretValueCommand({
          SecretId: secret.ARN,
        })
      );

      const value = JSON.parse(response.SecretString);

      if (value._placeholder !== true) {
        const overwrite = await prompt(
          rl,
          `${secret.Name} is already seeded. Overwrite? (y/N): `
        );
        if (overwrite.toLowerCase() !== 'y') {
          console.log('  Skipped.\n');
          continue;
        }
      }
    } catch (error) {
      // Continue if can't read current value
    }

    console.log(`\nSecret: ${secret.Name}`);
    console.log(`Description: ${secret.Description || 'N/A'}`);

    // Determine secret structure based on name
    const secretName = secret.Name.split('/').pop();
    let newValue = {};

    if (secretName.includes('api-key') || secretName.includes('api_key')) {
      const apiKey = await prompt(rl, '  Enter API key: ');
      if (!apiKey) {
        console.log('  Skipped.\n');
        continue;
      }
      newValue = { api_key: apiKey };
    } else if (secretName.includes('webhook')) {
      const webhookSecret = await prompt(rl, '  Enter webhook secret: ');
      if (!webhookSecret) {
        console.log('  Skipped.\n');
        continue;
      }
      newValue = { secret: webhookSecret };
    } else if (secretName.includes('oauth')) {
      const clientId = await prompt(rl, '  Enter client ID: ');
      const clientSecret = await prompt(rl, '  Enter client secret: ');
      if (!clientId || !clientSecret) {
        console.log('  Skipped.\n');
        continue;
      }
      newValue = { client_id: clientId, client_secret: clientSecret };
    } else {
      // Generic key-value
      const key = await prompt(rl, '  Enter key name: ');
      const value = await prompt(rl, '  Enter value: ');
      if (!key || !value) {
        console.log('  Skipped.\n');
        continue;
      }
      newValue = { [key]: value };
    }

    // Add metadata
    newValue._seeded_at = new Date().toISOString();
    newValue._seeded_by = 'scripts/secrets.js';

    // Update secret
    try {
      await client.send(
        new PutSecretValueCommand({
          SecretId: secret.ARN,
          SecretString: JSON.stringify(newValue),
        })
      );
      console.log('  ✓ Secret seeded successfully.\n');
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}\n`);
    }
  }

  rl.close();
  console.log('\nDone! Run "node scripts/secrets.js read" to verify.\n');
}

/**
 * Show usage
 */
function showUsage() {
  console.log(`
Secrets Manager CLI - Flow B Helper

Usage:
  node scripts/secrets.js <command>

Commands:
  seed    Interactively seed secret values
  read    Read and display all secrets
  list    List secret names only

Environment Variables:
  AWS_REGION     AWS region (default: us-east-1)
  AWS_PROFILE    AWS profile to use
  SECRET_PREFIX  Secret prefix (default: /dev/command-worker)

Examples:
  # List secrets
  node scripts/secrets.js list

  # Seed secrets interactively
  node scripts/secrets.js seed

  # Read secrets with custom prefix
  SECRET_PREFIX=/prod/command-worker node scripts/secrets.js read
`);
}

/**
 * Main entry point
 */
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'seed':
        await seedSecrets();
        break;
      case 'read':
        await readSecrets();
        break;
      case 'list':
        await listSecrets();
        break;
      default:
        showUsage();
    }
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    console.error('\nMake sure you have AWS credentials configured.');
    process.exit(1);
  }
}

main();
