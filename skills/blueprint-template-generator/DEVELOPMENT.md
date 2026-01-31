# Template Generator Development Guide

## Overview

The blueprint template generator is a system that generates Terraform code from parameterized templates based on blueprint manifests. This guide explains the architecture, development workflow, and how to extend the system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ LLM (Claude)                                                 │
│ - Identifies Scenario 2 (Add capability)                    │
│ - Extracts parameters from conversation                      │
│ - Builds JSON payload                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    Skill Execution      Manifest + Template
        │                     │
        ▼                     ▼
┌──────────────────┐  ┌─────────────────────────┐
│ parse-manifest.js │  │ render-template.js     │
│ - Load YAML       │  │ - Load template        │
│ - Validate params │  │ - Replace placeholders │
└──────────────────┘  └─────────────────────────┘
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Generated Terraform  │
        │ Code (HCL)           │
        └──────────────────────┘
```

## Core Components

### 1. Manifests (`blueprints/manifests/*.yaml`)

Manifests describe available snippets for each blueprint:
- **Snippets**: Reusable Terraform modules that can be generated
- **Variables**: Parameters accepted by each snippet
- **Validation**: Types, patterns, enums, defaults

### 2. Templates (`skills/blueprint-template-generator/templates/*.tf.template`)

Terraform templates with placeholders:
- Use `{{variable_name}}` for parameter substitution
- Preserve Terraform syntax and structure
- Support strings, numbers, and booleans

### 3. Scripts

- **`parse-manifest.js`**: Loads and validates manifests
- **`render-template.js`**: Renders templates with parameters
- **`generate.js`**: Main entry point for generation
- **`setup.js`**: Environment validation
- **`validate-manifest.js`**: Manifest structure validation

## Development Workflow

### Adding a New Blueprint

1. **Analyze the blueprint:**
   ```bash
   cd aws/{blueprint-name}
   # Examine modules/ directory
   # Identify extractable components
   ```

2. **Create manifest:**
   ```bash
   # Create blueprints/manifests/{blueprint-name}.yaml
   # Define snippets and variables
   ```

3. **Create templates (if needed):**
   ```bash
   # Create templates/{resource-type}.tf.template
   # Based on modules/{module}/main.tf
   ```

4. **Validate:**
   ```bash
   npm run validate:manifest {blueprint-name}
   npm run setup
   ```

5. **Test:**
   ```bash
   # Test generation with sample payload
   echo '{"blueprint":"...","snippet":"...","params":{...}}' | npm run generate
   ```

### Adding a New Template

1. **Identify source:**
   - Find the Terraform code in `aws/{blueprint}/modules/{module}/main.tf`
   - Identify which parts should be parameterized

2. **Create template:**
   ```bash
   # Create templates/{resource-type}.tf.template
   # Replace hardcoded values with {{placeholders}}
   ```

3. **Update manifest:**
   - Reference the template in snippet definition
   - Define variables that map to placeholders

4. **Test:**
   ```bash
   # Test rendering
   npm test
   ```

## File Structure

```
terraform-infrastructure-blueprints/
├── blueprints/
│   └── manifests/              # Manifest files
│       ├── apigw-lambda-rds.yaml
│       └── ...
├── skills/
│   └── blueprint-template-generator/
│       ├── templates/           # Template files
│       │   ├── rds-module.tf.template
│       │   └── ...
│       ├── scripts/            # Core scripts
│       │   ├── generate.js
│       │   ├── parse-manifest.js
│       │   ├── render-template.js
│       │   ├── setup.js
│       │   └── validate-manifest.js
│       ├── __tests__/          # Test files
│       │   ├── parse-manifest.test.js
│       │   ├── render-template.test.js
│       │   └── generate.test.js
│       ├── package.json
│       ├── jest.config.js
│       └── CONTRIBUTING.md
└── docs/
    └── guides/
        └── template-generator-development.md
```

## Common Patterns

### Pattern 1: Simple Resource

**Template:**
```terraform
resource "aws_dynamodb_table" "this" {
  name         = "{{table_name}}"
  billing_mode = "{{billing_mode}}"
  hash_key     = "{{hash_key}}"
}
```

**Manifest:**
```yaml
variables:
  - name: table_name
    type: string
    required: true
  - name: billing_mode
    type: string
    default: "PAY_PER_REQUEST"
```

### Pattern 2: Conditional Block

**Template:**
```terraform
dynamic "ttl" {
  for_each = "{{ttl_attribute_name}}" != "" ? [1] : []
  content {
    attribute_name = "{{ttl_attribute_name}}"
    enabled        = true
  }
}
```

### Pattern 3: Boolean Flag

**Template:**
```terraform
point_in_time_recovery {
  enabled = {{enable_point_in_time_recovery}}
}
```

**Manifest:**
```yaml
variables:
  - name: enable_point_in_time_recovery
    type: boolean
    default: true
```

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test:watch

# Specific test file
npm test -- __tests__/parse-manifest.test.js
```

### Test Structure

- **Unit tests**: Test individual functions
- **Integration tests**: Test full generation flow
- **Validation tests**: Test error cases

### Adding Tests

1. Create test file: `__tests__/{module}.test.js`
2. Import functions to test
3. Write test cases:
   - Happy path
   - Error cases
   - Edge cases

Example:
```javascript
import { loadManifest } from '../scripts/parse-manifest.js';

test('should load a valid manifest', () => {
  const manifest = loadManifest('apigw-lambda-rds');
  expect(manifest.name).toBe('apigw-lambda-rds');
});
```

## Validation

### Setup Validation

```bash
npm run setup
```

Checks:
- Node.js version >= 22
- Dependencies installed
- Directory structure
- Manifest files exist
- Template files exist

### Manifest Validation

```bash
# Single manifest
npm run validate:manifest {blueprint-name}

# All manifests
npm run validate:all
```

Validates:
- Required fields present
- Template files exist
- Variable types correct
- Enum values match types
- Patterns are valid regex

## Troubleshooting

### Common Issues

1. **"Manifest not found"**
   - Check file exists in `blueprints/manifests/`
   - Verify filename matches blueprint name

2. **"Template not found"**
   - Check template exists in `templates/`
   - Verify template name in manifest matches filename

3. **"Missing parameter"**
   - Check all required variables provided
   - Verify variable names match manifest

4. **"Invalid type"**
   - Ensure parameter types match manifest definition
   - Check boolean values are actual booleans, not strings

### Debug Tips

1. **Check paths:**
   ```bash
   # Verify repo root detection
   node -e "console.log(require('./scripts/parse-manifest.js'))"
   ```

2. **Test manifest loading:**
   ```bash
   node -e "import('./scripts/parse-manifest.js').then(m => console.log(m.loadManifest('apigw-lambda-rds')))"
   ```

3. **Test template rendering:**
   ```bash
   node -e "import('./scripts/render-template.js').then(m => console.log(m.renderTemplate('dynamodb-table.tf.template', {table_name: 'test', ...})))"
   ```

## Best Practices

1. **Keep templates simple**: Only parameterize what varies
2. **Use sensible defaults**: Reduce required parameters
3. **Validate early**: Use patterns and enums for common mistakes
4. **Document well**: Clear descriptions help LLMs use correctly
5. **Test thoroughly**: Cover happy path and error cases
6. **Follow conventions**: Consistent naming and structure

## Examples

See these files for complete examples:

- **Manifest**: `blueprints/manifests/apigw-lambda-rds.yaml`
- **Template**: `templates/rds-module.tf.template`
- **Test**: `__tests__/generate.test.js`

## Next Steps

- Review [CONTRIBUTING.md](../skills/blueprint-template-generator/CONTRIBUTING.md) for detailed contribution guidelines
- Check existing manifests for patterns
- Run validation scripts before submitting changes
