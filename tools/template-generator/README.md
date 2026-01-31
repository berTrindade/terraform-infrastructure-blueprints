# Blueprint Template Generator

Generate Terraform code from parameterized templates based on blueprint manifests.

## Installation

Install dependencies:

```bash
cd skills/blueprint-template-generator
npm install
```

## Usage

### Basic Usage

Generate code from a JSON payload:

```bash
echo '{
  "blueprint": "apigw-lambda-rds",
  "snippet": "rds-module",
  "params": {
    "db_identifier": "myapp-dev-db",
    "db_name": "myapp",
    "engine_version": "15.4",
    "instance_class": "db.t3.micro",
    "db_subnet_group_name": "myapp-dev-db-subnets",
    "security_group_id": "sg-123456"
  }
}' | node scripts/generate.js
```

### From File

```bash
cat payload.json | node scripts/generate.js
```

## Structure

```
blueprint-template-generator/
├── SKILL.md                    # Instructions for LLM
├── CONTRIBUTING.md             # Contribution guidelines
├── package.json                # Dependencies
├── jest.config.js              # Jest test configuration
├── scripts/
│   ├── generate.js             # Main generation script
│   ├── parse-manifest.js       # Manifest parser
│   ├── render-template.js      # Template renderer
│   ├── setup.js                # Setup validation script
│   └── validate-manifest.js    # Manifest validation script
├── templates/
│   ├── rds-module.tf.template  # RDS PostgreSQL module
│   ├── dynamodb-table.tf.template
│   ├── sqs-queue.tf.template
│   ├── lambda-function.tf.template
│   ├── security-group.tf.template
│   ├── cognito-user-pool.tf.template
│   ├── ecs-service.tf.template
│   └── ephemeral-password.tf.template
└── __tests__/
    ├── generate.test.js
    ├── parse-manifest.test.js
    └── render-template.test.js
```

## Manifest Format

Manifests are YAML files in `blueprints/manifests/` that describe:
- Available snippets for each blueprint
- Variables accepted by each snippet
- Types, defaults, and validation rules

## Template Format

Templates use `{{variable_name}}` placeholders that are replaced with parameter values.

## Testing

Test with a sample payload:

```bash
cat <<EOF | node scripts/generate.js
{
  "blueprint": "apigw-lambda-rds",
  "snippet": "rds-module",
  "params": {
    "db_identifier": "test-db",
    "db_name": "testdb",
    "db_subnet_group_name": "test-subnets",
    "security_group_id": "sg-test123"
  }
}
EOF
```
