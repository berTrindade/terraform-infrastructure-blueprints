# Fluxo de Trabalho: Blueprints → Manifests → Templates

## Diagrama Visual

```
┌─────────────────────────────────────────────────────────────────┐
│ FASE 1: CRIAÇÃO DO BLUEPRINT (Você escreve código Terraform)    │
└─────────────────────────────────────────────────────────────────┘

  Você escreve:
  
  📁 aws/apigw-lambda-rds/
     ├── modules/data/main.tf          ← CÓDIGO REAL (você escreve)
     ├── modules/api/main.tf           ← CÓDIGO REAL (você escreve)
     ├── environments/dev/main.tf      ← CÓDIGO REAL (você escreve)
     └── README.md                     ← DOCUMENTAÇÃO (você escreve)
  
  ✅ Este é o código de produção testado
  ✅ Este é a fonte de verdade
  ✅ Você mantém e atualiza este código


┌─────────────────────────────────────────────────────────────────┐
│ FASE 2: CRIAÇÃO DO MANIFEST (Você descreve o blueprint)        │
└─────────────────────────────────────────────────────────────────┘

  Você cria:
  
  📄 blueprints/manifests/apigw-lambda-rds.yaml
  
  metadata:
    name: apigw-lambda-rds
    description: Serverless REST API with RDS PostgreSQL
  
  spec:
    snippets:
      - id: rds-module
        name: RDS PostgreSQL Module
        template: rds-module.tf.template
        variables:
          - name: db_identifier
            type: string
            required: true
  
  ✅ Descreve o que o blueprint oferece
  ✅ Define snippets disponíveis
  ✅ Especifica variáveis e validações
  ❌ NÃO contém código Terraform


┌─────────────────────────────────────────────────────────────────┐
│ FASE 3: CRIAÇÃO DO TEMPLATE (Baseado no código real)           │
└─────────────────────────────────────────────────────────────────┘

  Você cria (baseado no código real):
  
  📄 skills/blueprint-template-generator/templates/
     └── rds-module.tf.template
  
  resource "aws_db_instance" "this" {
    identifier = "{{db_identifier}}"      ← Placeholder
    engine     = "postgres"
    engine_version = "{{engine_version}}" ← Placeholder
    # ... resto do código do blueprint ...
  }
  
  ✅ Cópia do código real com placeholders
  ✅ Usa {{variable}} para substituição
  ✅ Mantém padrões do blueprint original


┌─────────────────────────────────────────────────────────────────┐
│ FASE 4: USO (Geração automática ou cópia direta)              │
└─────────────────────────────────────────────────────────────────┘

  OPÇÃO A: Template Generator (Para adicionar capacidade)
  
  Input (JSON):
  {
    "blueprint": "apigw-lambda-rds",
    "snippet": "rds-module",
    "params": {
      "db_identifier": "myapp-dev-db",
      "db_name": "myapp"
    }
  }
  
  Output (Código gerado):
  resource "aws_db_instance" "this" {
    identifier = "myapp-dev-db"        ← Substituído
    engine     = "postgres"
    engine_version = "15.4"            ← Substituído
    # ... código completo gerado ...
  }
  
  ✅ Código gerado automaticamente
  ✅ Já adaptado com seus parâmetros
  ✅ Economiza tokens (50 linhas vs 200+ linhas)
  
  
  OPÇÃO B: Copiar Blueprint Diretamente (Para novo projeto)
  
  Você copia:
  cp -r aws/apigw-lambda-rds myproject/
  
  ✅ Código completo do blueprint
  ✅ Todos os módulos, testes, docs
  ✅ Adapta manualmente conforme necessário
```

## Respostas às Perguntas Frequentes

### "Preciso escrever código Terraform?"

**Sim, para criar/manter blueprints:**

1. ✅ **Criar novo blueprint**: Escreve código Terraform completo
2. ✅ **Atualizar blueprint**: Modifica código existente
3. ✅ **Criar templates**: Baseia-se no código real (adiciona placeholders)
4. ✅ **Criar manifests**: Descreve o blueprint em YAML

**Não, para usar blueprints existentes:**

1. ❌ **Adicionar capacidade**: Usa Template Generator (código gerado)
2. ❌ **Copiar blueprint**: Copia código existente (não reescreve)

### "O que vem primeiro: código ou manifest?"

**Ordem correta:**

1. **Código do blueprint** (você escreve)
2. **Manifest** (você descreve o código)
3. **Template** (você parametriza o código)

**Por quê?** O código é a fonte de verdade. Manifest e template são derivados do código.

### "Se mudar o código, preciso atualizar manifest?"

**Depende da mudança:**

- **Mudança funcional** (novo recurso): Atualiza código → template → manifest
- **Mudança de padrão**: Atualiza código → template → manifest
- **Mudança de documentação**: Atualiza manifest apenas
- **Bug fix**: Atualiza código → template (se afetar template)

### "Manifest substitui o código do blueprint?"

**Não!** O manifest é **metadados** que descrevem o blueprint. O código Terraform continua sendo necessário e é a fonte de verdade.

## Comparação: Backstage vs Nosso Sistema

| Aspecto | Backstage | Nosso Sistema |
|---------|-----------|---------------|
| **Código** | Plugin TypeScript/React | Blueprint Terraform |
| **Metadata** | catalog-info.yaml | Manifest YAML |
| **Descoberta** | Backstage lê YAML | MCP/Skills leem YAML |
| **Geração** | N/A | Templates geram código |

## Fluxo de Manutenção

```
Código do Blueprint (mudou)
    ↓
Template precisa atualizar? (se sim, atualiza)
    ↓
Manifest precisa atualizar? (se sim, atualiza)
    ↓
Tudo sincronizado ✅
```

## Exemplo Real

### 1. Você escreve código (Blueprint)

```hcl
# aws/apigw-lambda-rds/modules/data/main.tf
resource "aws_db_instance" "this" {
  identifier = var.db_identifier
  engine     = "postgres"
  # ... código completo ...
}
```

### 2. Você descreve em YAML (Manifest)

```yaml
# blueprints/manifests/apigw-lambda-rds.yaml
spec:
  snippets:
    - id: rds-module
      template: rds-module.tf.template
      variables:
        - name: db_identifier
          type: string
          required: true
```

### 3. Você parametriza (Template)

```hcl
# skills/blueprint-template-generator/templates/rds-module.tf.template
resource "aws_db_instance" "this" {
  identifier = "{{db_identifier}}"
  engine     = "postgres"
  # ... código com placeholders ...
}
```

### 4. Sistema gera código (Uso)

```hcl
# Gerado automaticamente pelo Template Generator
resource "aws_db_instance" "this" {
  identifier = "myapp-dev-db"  # ← Substituído do JSON
  engine     = "postgres"
  # ... código completo gerado ...
}
```

## Conclusão

- ✅ **Você escreve código Terraform** para criar/manter blueprints
- ✅ **Você cria manifests** para descrever blueprints
- ✅ **Você cria templates** para parametrizar código
- ❌ **Você não escreve código** quando usa Template Generator (gerado automaticamente)

O manifest é **metadados**, não substitui o código. O código Terraform continua sendo necessário e é a fonte de verdade.
