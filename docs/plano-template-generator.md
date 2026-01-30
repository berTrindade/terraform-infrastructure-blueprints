# Plano de Implementação: Template Generator Skill

Baseado no feedback do Felipe sobre geração local de templates para economizar tokens.

## Visão Geral

Transformar a skill em um **template engine/scaffolder local** que gera código Terraform sob demanda baseado em parâmetros, ao invés de buscar arquivos completos do repositório. Isso economiza tokens e gera código já adaptado às convenções do projeto do cliente.

## Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────┐
│                    LLM Assistant                        │
│  (identifica intenção: adicionar capacidade vs estudar) │
└────────────┬──────────────────────────────┬─────────────┘
             │                              │
             │                              │
    ┌────────▼────────┐          ┌─────────▼──────────┐
    │  Template       │          │  fetch_blueprint_   │
    │  Generator      │          │  file (MCP)         │
    │  Skill          │          │  (para estudo)       │
    └────────┬────────┘          └─────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │  Scripts (Node.js/Python)             │
    │  + Templates Parametrizados           │
    │  + Manifestos YAML                    │
    └────────┬───────────────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │  Gera código Terraform adaptado       │
    │  (50 linhas vs 200 linhas)            │
    └───────────────────────────────────────┘
```

## Componentes Necessários

### 1. Manifestos YAML para Blueprints

Cada blueprint terá um manifesto que descreve:

- Variáveis aceitas
- Tipos e valores padrão
- Dependências entre variáveis
- Snippets disponíveis

**Estrutura proposta:**

```yaml
# blueprints/manifests/apigw-lambda-rds.yaml
name: apigw-lambda-rds
description: Serverless REST API with RDS PostgreSQL
version: 1.0.0

snippets:
  - id: rds-module
    name: RDS PostgreSQL Module
    template: modules/data/main.tf
    variables:
      - name: db_identifier
        type: string
        required: true
        description: RDS instance identifier
      - name: db_name
        type: string
        required: true
        default: "mydb"
      - name: engine_version
        type: string
        required: false
        default: "15.4"
      - name: instance_class
        type: string
        required: false
        default: "db.t3.micro"
      - name: vpc_id
        type: string
        required: true
        description: Existing VPC ID
      - name: subnet_group_name
        type: string
        required: true
        description: Existing DB subnet group name
      - name: security_group_id
        type: string
        required: true
        description: Security group ID for RDS access

  - id: ephemeral-password
    name: Ephemeral Password Pattern
    template: patterns/ephemeral-password.tf
    variables:
      - name: password_name
        type: string
        required: true
        default: "db"
```

### 2. Skill Genérica: `blueprint-template-generator`

**Localização:** `packages/blueprint-skill/templates/.cursor/skills/blueprint-template-generator/`

**Estrutura:**

```
blueprint-template-generator/
├── SKILL.md                    # Instruções para LLM
├── scripts/
│   ├── generate.js             # Script Node.js principal
│   ├── render-template.js      # Renderiza templates
│   └── parse-manifest.js       # Lê e valida manifestos YAML
├── templates/
│   ├── rds-module.tf.template  # Template para módulo RDS
│   ├── sqs-queue.tf.template  # Template para SQS
│   └── ephemeral-password.tf.template
└── manifests/
    └── (symlink para blueprints/manifests/)
```

### 3. Scripts de Geração

**generate.js** - Script principal que:

- Recebe JSON com parâmetros via stdin ou arquivo
- Lê manifesto YAML do blueprint
- Valida parâmetros
- Renderiza template correspondente
- Retorna código Terraform gerado

**Exemplo de uso:**

```bash
echo '{
  "blueprint": "apigw-lambda-rds",
  "snippet": "rds-module",
  "params": {
    "db_identifier": "myapp-dev-db",
    "db_name": "myapp",
    "vpc_id": "vpc-123456",
    "subnet_group_name": "myapp-dev-db-subnets",
    "security_group_id": "sg-123456"
  }
}' | node scripts/generate.js
```

### 4. Templates Parametrizados

Templates HCL com placeholders que são substituídos pelos valores:

```hcl
# templates/rds-module.tf.template
resource "aws_db_instance" "{{db_identifier}}" {
  identifier = "{{db_identifier}}"
  
  engine         = "postgres"
  engine_version = "{{engine_version}}"
  instance_class = "{{instance_class}}"
  
  db_name  = "{{db_name}}"
  username = var.db_username
  
  password_wo         = var.db_password
  password_wo_version = var.db_password_version
  
  db_subnet_group_name   = "{{subnet_group_name}}"
  vpc_security_group_ids = ["{{security_group_id}}"]
  
  iam_database_authentication_enabled = true
  
  tags = {
    Name = "{{db_identifier}}"
  }
}
```

## Fluxo de Trabalho

### Cenário: Adicionar RDS ao Projeto Existente

1. **Desenvolvedor pergunta**: "Preciso adicionar RDS PostgreSQL ao meu projeto"

2. **LLM identifica intenção**: "adição de capacidade" → usa skill de geração

3. **LLM extrai do histórico**:
   - Naming convention: `{project}-{env}-{component}`
   - VPC ID: `vpc-123456`
   - Subnet group: `myapp-dev-db-subnets`
   - Security group: `sg-123456`

4. **LLM chama skill** com payload:

```json
{
  "blueprint": "apigw-lambda-rds",
  "snippet": "rds-module",
  "params": {
    "db_identifier": "myapp-dev-db",
    "db_name": "myapp",
    "engine_version": "15.4",
    "instance_class": "db.t3.micro",
    "vpc_id": "vpc-123456",
    "subnet_group_name": "myapp-dev-db-subnets",
    "security_group_id": "sg-123456"
  }
}
```

1. **Skill executa script**:
   - Lê manifesto `apigw-lambda-rds.yaml`
   - Valida parâmetros
   - Renderiza template `rds-module.tf.template`
   - Retorna código Terraform gerado (50 linhas)

2. **LLM recebe código gerado** e adapta ao projeto do cliente

### Cenário: Estudar Blueprint

1. **Desenvolvedor pergunta**: "Como funciona o blueprint apigw-lambda-rds?"

2. **LLM identifica intenção**: "estudo/compreensão" → usa `fetch_blueprint_file`

3. **LLM busca arquivos** do repositório para análise

## Passos de Implementação

### Fase 1: Estrutura Base

1. **Criar estrutura de diretórios**

   ```
   packages/blueprint-skill/templates/.cursor/skills/blueprint-template-generator/
   blueprints/manifests/
   ```

2. **Criar skill básica** (`SKILL.md`)
   - Instruções para LLM sobre quando usar
   - Como montar payload JSON
   - Como extrair parâmetros do histórico

3. **Criar script Node.js base** (`generate.js`)
   - Recebe JSON via stdin
   - Lê manifesto YAML
   - Valida estrutura básica

### Fase 2: Manifestos e Templates

1. **Criar manifestos YAML** para blueprints principais:
   - `apigw-lambda-rds.yaml`
   - `apigw-lambda-dynamodb.yaml`
   - `apigw-sqs-lambda-dynamodb.yaml`

2. **Criar templates** para snippets mais usados:
   - RDS module
   - DynamoDB table
   - SQS queue
   - Ephemeral password pattern
   - VPC endpoints

3. **Implementar renderização** (`render-template.js`)
   - Substitui placeholders nos templates
   - Valida tipos de variáveis
   - Trata valores padrão

### Fase 3: Integração com LLM

1. **Atualizar skill guidance** para distinguir:
   - "Adicionar capacidade" → usar template generator
   - "Estudar blueprint" → usar fetch_blueprint_file

2. **Implementar auto-detecção de parâmetros**
   - LLM identifica naming conventions do histórico
   - LLM identifica VPC, security groups existentes
   - LLM monta payload automaticamente

3. **Criar exemplos de uso** na documentação

### Fase 4: Testes e Refinamento

1. **Testar geração** com diferentes blueprints
2. **Validar economia de tokens** (comparar antes/depois)
3. **Refinar templates** baseado em feedback
4. **Documentar padrões** de manifestos e templates

## Estrutura de Arquivos Final

```
terraform-infrastructure-blueprints/
├── blueprints/
│   └── manifests/                    # NOVO
│       ├── apigw-lambda-rds.yaml
│       ├── apigw-lambda-dynamodb.yaml
│       └── ...
├── packages/
│   └── blueprint-skill/
│       └── templates/
│           └── .cursor/
│               └── skills/
│                   ├── blueprint-guidance/
│                   ├── blueprint-catalog/
│                   ├── blueprint-patterns/
│                   └── blueprint-template-generator/  # NOVO
│                       ├── SKILL.md
│                       ├── scripts/
│                       │   ├── generate.js
│                       │   ├── render-template.js
│                       │   └── parse-manifest.js
│                       └── templates/
│                           ├── rds-module.tf.template
│                           ├── dynamodb-table.tf.template
│                           └── ...
```

## Exemplo de Manifesto Completo

```yaml
# blueprints/manifests/apigw-lambda-rds.yaml
name: apigw-lambda-rds
description: Serverless REST API with RDS PostgreSQL
version: 1.0.0

snippets:
  - id: rds-module
    name: RDS PostgreSQL Module
    description: Complete RDS module with ephemeral passwords
    template: rds-module.tf.template
    output_file: modules/data/main.tf
    variables:
      - name: db_identifier
        type: string
        required: true
        description: RDS instance identifier (e.g., myapp-dev-db)
        pattern: "^[a-z0-9-]+$"
      
      - name: db_name
        type: string
        required: true
        default: "mydb"
        description: Database name
      
      - name: engine_version
        type: string
        required: false
        default: "15.4"
        description: PostgreSQL engine version
      
      - name: instance_class
        type: string
        required: false
        default: "db.t3.micro"
        description: RDS instance class
        enum: ["db.t3.micro", "db.t3.small", "db.t3.medium"]
      
      - name: vpc_id
        type: string
        required: true
        description: Existing VPC ID
        pattern: "^vpc-[a-z0-9]+$"
      
      - name: subnet_group_name
        type: string
        required: true
        description: Existing DB subnet group name
      
      - name: security_group_id
        type: string
        required: true
        description: Security group ID for RDS access
        pattern: "^sg-[a-z0-9]+$"
    
    dependencies:
      - ephemeral-password
      - secrets-module

  - id: ephemeral-password
    name: Ephemeral Password Pattern
    description: Flow A ephemeral password generation
    template: ephemeral-password.tf.template
    output_file: environments/dev/ephemeral-password.tf
    variables:
      - name: password_name
        type: string
        required: true
        default: "db"
        description: Name for the ephemeral password resource
```

## Exemplo de Template

```hcl
# templates/rds-module.tf.template
# RDS PostgreSQL - Flow A (TF-Generated Password)
# Generated by blueprint-template-generator

resource "aws_db_instance" "{{db_identifier}}" {
  identifier = "{{db_identifier}}"

  # Engine configuration
  engine         = "postgres"
  engine_version = "{{engine_version}}"
  instance_class = "{{instance_class}}"

  # Database configuration
  db_name  = "{{db_name}}"
  username = var.db_username

  # Flow A: Write-only password
  password_wo         = var.db_password
  password_wo_version = var.db_password_version

  port = 5432

  # Network configuration
  db_subnet_group_name   = "{{subnet_group_name}}"
  vpc_security_group_ids = ["{{security_group_id}}"]
  publicly_accessible    = false

  # Enable IAM Database Authentication
  iam_database_authentication_enabled = true

  tags = {
    Name       = "{{db_identifier}}"
    SecretFlow = "A-tf-generated"
    DataClass  = "secret"
  }
}
```

## Benefícios Esperados

1. **Economia de tokens**: 50 linhas geradas vs 200 linhas buscadas (~75% economia)
2. **Código já adaptado**: Variáveis já usam naming conventions do projeto
3. **Execução local**: Sem network calls, mais rápido
4. **Flexibilidade**: Pode gerar variações baseadas em parâmetros
5. **Manutenção**: Templates centralizados, fácil atualizar padrões

## Próximos Passos

1. Validar estrutura de manifestos com equipe
2. Criar protótipo para um blueprint (apigw-lambda-rds)
3. Testar geração de templates
4. Medir economia de tokens
5. Iterar baseado em feedback
