# MCP Test Scenarios

This directory contains test scenarios for validating the MCP (Model Context Protocol) server's blueprint recommendation and pattern extraction capabilities.

## Overview

These test scenarios are designed to be used **outside** the `terraform-infrastructure-blueprints` repository to simulate real-world use cases where developers need infrastructure guidance.

## Test Scenarios

### Scenario 1: TaskTracker API

**Location**: `tasktracker-api/`

**Use Case**: Application exists locally, needs infrastructure recommendations

- Node.js + Express API with DynamoDB
- Currently runs locally with DynamoDB Local
- **Goal**: Get blueprint recommendation for deploying to AWS
- **Expected Blueprint**: `apigw-lambda-dynamodb`

**Test**: Ask AI **"What infrastructure do I need for this codebase?"**

**Note**: The AI should first analyze the codebase (reading `package.json`, `src/server.js`) to identify the tech stack (Express + DynamoDB) before making MCP tool calls. This tests the AI's ability to infer infrastructure needs from code rather than relying on explicit user descriptions.

### Scenario 2: InvoiceAPI

**Location**: `invoice-api/`

**Use Case**: Existing Terraform infrastructure, needs to add a capability

- API Gateway + Lambda already configured
- Uses mock/in-memory data
- **Goal**: Extract database pattern from blueprints to add RDS PostgreSQL
- **Expected Blueprint**: `apigw-lambda-rds` (extract database modules)

**Test**: Ask AI "I need to add a database to my existing Terraform project"

## How to Use

1. Navigate to the scenario directory you want to test
2. Read the scenario-specific README for details
3. Use the provided test prompts with the AI assistant
4. Verify that the AI:
   - Calls the expected MCP tools
   - References the correct blueprint resources
   - Provides relevant code examples

## Expected MCP Tool Calls

### Scenario 1 (Blueprint Recommendation)

- `recommend_blueprint(database: "dynamodb", pattern: "sync")`
- Resource fetches: `blueprints://aws/apigw-lambda-dynamodb/...`

### Scenario 2 (Pattern Extraction)

- `extract_pattern(capability: "database")`
- Resource fetches: `blueprints://aws/apigw-lambda-rds/modules/data/...`
- Resource fetches: `blueprints://aws/apigw-lambda-rds/modules/networking/...`

## Notes

- These scenarios are **standalone** and don't depend on the main blueprints repository
- They simulate real-world scenarios where developers need infrastructure guidance
- Each scenario includes clear documentation of expected behavior
- Use these to validate MCP server functionality and AI assistant responses
