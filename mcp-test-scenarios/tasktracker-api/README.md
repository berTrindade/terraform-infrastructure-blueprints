# TaskTracker API - Scenario 1 Test Case

## Overview

This is a **Scenario 1** test case for testing the MCP server's blueprint recommendation capabilities.

**Scenario**: An application exists locally and needs infrastructure recommendations.

## Current State

- **Tech Stack**: Node.js + Express + DynamoDB
- **Status**: Runs locally with DynamoDB Local or mock data
- **Problem**: No AWS infrastructure, needs deployment
- **Goal**: Get infrastructure recommendations and example code

## Application Details

The TaskTracker API is a simple REST API for managing tasks:
- `GET /tasks` - List all tasks
- `POST /tasks` - Create a new task
- `GET /tasks/:id` - Get a specific task
- `DELETE /tasks/:id` - Delete a task

Currently, the application uses:
- Express.js for the HTTP server
- AWS DynamoDB SDK (configured for local/mock)
- No Terraform files - this is the "before" state

## Test Prompts

Use these prompts with the AI assistant to test Scenario 1:

1. **"What infrastructure do I need for this codebase?"** (Primary, most realistic prompt)
2. "I have a Node.js API using DynamoDB running locally. What infrastructure do I need?"
3. "How do I deploy this API to AWS?"
4. "What blueprint should I use for a serverless API with DynamoDB?"

## Expected MCP Behavior

When you use the test prompts, the AI should:

**Step 0: Codebase Analysis** (for codebase-aware prompts like "What infrastructure do I need for this codebase?")
- Read `package.json` → identifies Express, aws-sdk dependencies
- Read `src/server.js` → identifies DynamoDB operations, Express routes
- Analyze code structure → infers: Node.js + Express + DynamoDB → needs serverless API infrastructure

**Step 1: MCP Tool Call**
- Call `recommend_blueprint(database: "dynamodb", pattern: "sync")`

**Step 2: Blueprint Recommendation**
- Receive recommendation: `apigw-lambda-dynamodb`

**Step 3: Resource Fetching**
- Fetch blueprint resources:
  - `blueprints://aws/apigw-lambda-dynamodb/README.md`
  - `blueprints://aws/apigw-lambda-dynamodb/environments/dev/main.tf`

**Step 4: Provide Recommendations**
- Show example code as reference for deployment

**Note**: For codebase-aware prompts, the AI should analyze the codebase first to understand the tech stack before calling MCP tools. This tests the AI's ability to infer infrastructure needs from code rather than relying on explicit user descriptions.

## Expected Blueprint

The AI should recommend: **`apigw-lambda-dynamodb`** (serverless REST API with DynamoDB)

This blueprint provides:
- API Gateway HTTP API
- Lambda functions for API handlers
- DynamoDB table for task storage
- IAM roles and permissions
- Complete Terraform configuration

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# AWS Configuration
AWS_REGION=us-east-1

# DynamoDB Configuration
# For local development with DynamoDB Local, set:
# DYNAMODB_ENDPOINT=http://localhost:8000
# For production, leave this unset to use AWS DynamoDB
DYNAMODB_ENDPOINT=

# Table name
TABLE_NAME=tasks

# Server Configuration
PORT=3000
```

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start DynamoDB Local** (optional):
   ```bash
   docker-compose up -d
   ```

3. **Set environment variables** (create `.env` file)

4. **Run the server**:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## Next Steps

After receiving the blueprint recommendation:
1. Copy the blueprint folder
2. Adapt the Lambda handlers to match this API's logic
3. Deploy using Terraform
4. Update environment variables with AWS resource ARNs
