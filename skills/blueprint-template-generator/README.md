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
├── package.json                # Dependencies
├── scripts/
│   ├── generate.js             # Main script
│   ├── parse-manifest.js       # Manifest parser
│   └── render-template.js      # Template renderer
└── templates/
    ├── rds-module.tf.template  # RDS module template
    └── ephemeral-password.tf.template
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
