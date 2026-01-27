# InvoiceAPI - Scenario 2 Test Case

## Overview

This is a **Scenario 2** test case for testing the MCP server's pattern extraction capabilities.

**Scenario**: Existing Terraform infrastructure that needs a new capability added.

## Current State

- **Current Infrastructure**: API Gateway HTTP API + Lambda function
- **Status**: API works but uses mock/in-memory data
- **Problem**: No persistent storage, needs a database
- **Goal**: Extract database pattern from blueprints and integrate it

## Infrastructure Details

### Existing Components

- **API Gateway HTTP API**: Handles HTTP requests
- **Lambda Function**: Processes invoice CRUD operations
- **IAM Roles**: Basic Lambda execution role
- **Outputs**: API endpoint URL

### Missing Components

- **Database**: No persistent storage (currently using mock data)
- **VPC**: No VPC configuration (needed for RDS)
- **Secrets Manager**: No secrets management for database credentials
- **Networking**: No VPC, subnets, or security groups

## Application Details

The InvoiceAPI manages invoices:
- `GET /invoices` - List all invoices
- `POST /invoices` - Create a new invoice
- `GET /invoices/:id` - Get a specific invoice
- `DELETE /invoices/:id` - Delete an invoice

Currently, the Lambda handler uses mock/in-memory data storage.

## Test Prompts

Use these prompts with the AI assistant to test Scenario 2:

1. "I need to add a database to my existing Terraform project"
2. "How do I extract the database pattern from blueprints?"
3. "Show me how to add RDS PostgreSQL to my API Gateway + Lambda setup"
4. "I have API Gateway and Lambda, but I need persistent storage. What do I need?"

## Expected MCP Behavior

When you use the test prompts, the AI should:

1. Call `extract_pattern(capability: "database")`
2. Receive guidance pointing to: `apigw-lambda-rds` blueprint
3. Fetch blueprint resources:
   - `blueprints://aws/apigw-lambda-rds/README.md`
   - `blueprints://aws/apigw-lambda-rds/environments/dev/main.tf`
   - `blueprints://aws/apigw-lambda-rds/modules/data/main.tf` (RDS module)
   - `blueprints://aws/apigw-lambda-rds/modules/networking/main.tf` (VPC module)
4. Show example code for manual integration

## Expected Blueprint Pattern

The AI should reference: **`apigw-lambda-rds`** blueprint

Key modules to extract:
- **`modules/data/`**: RDS PostgreSQL database configuration
- **`modules/networking/`**: VPC, subnets, security groups for RDS access
- **Secrets Manager**: Database credentials management

## Integration Steps

After receiving the pattern extraction guidance:

1. **Add VPC Module**: Copy networking module for VPC/subnets/security groups
2. **Add RDS Module**: Copy data module for PostgreSQL RDS instance
3. **Update Lambda**: 
   - Add VPC configuration to Lambda
   - Add database connection code to handler
   - Add Secrets Manager access for credentials
4. **Update IAM**: Add permissions for Secrets Manager and VPC access
5. **Add Variables**: Add database-related variables
6. **Update Outputs**: Add database endpoint output

## Current Terraform Structure

```
terraform/
├── main.tf      # API Gateway + Lambda (no database)
├── variables.tf # Project variables
└── outputs.tf   # API endpoint output
```

## TODO Comments

The Terraform files contain TODO comments indicating:
- Need for database configuration
- Need for VPC setup
- Need for secrets management
- Need to update Lambda handler with database connection
