# Como os Manifests Funcionam com os Blueprints

## Resposta Rápida

**Sim, você ainda precisa escrever código Terraform!** Os manifests são **metadados** que descrevem os blueprints, mas o código Terraform original continua sendo a fonte de verdade.

## A Relação: Blueprints → Manifests → Templates

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BLUEPRINT (Código Terraform Real)                        │
│    aws/apigw-lambda-rds/modules/data/main.tf               │
│    ✅ Você escreve e mantém este código                     │
│    ✅ Este é o código de produção testado                   │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ (baseado em)
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. MANIFEST (Metadados YAML)                                │
│    blueprints/manifests/apigw-lambda-rds.yaml              │
│    ✅ Descreve o blueprint (metadata, snippets, variables) │
│    ✅ Define quais snippets podem ser gerados               │
│    ✅ Especifica validações e defaults                      │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ (referencia)
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. TEMPLATE (Código Parametrizado)                          │
│    skills/blueprint-template-generator/templates/          │
│       rds-module.tf.template                               │
│    ✅ Baseado no código real do blueprint                   │
│    ✅ Usa {{placeholders}} para substituição               │
│    ✅ Gera código adaptado quando executado                 │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo Completo

### 1. Criar/Manter Blueprint (Você escreve código Terraform)

```hcl
# aws/apigw-lambda-rds/modules/data/main.tf
resource "aws_db_instance" "this" {
  identifier = var.db_identifier
  engine     = "postgres"
  engine_version = var.engine_version
  # ... código completo ...
}
```

**Este é o código real que você escreve e mantém.**

### 2. Criar Manifest (Você descreve o blueprint)

```yaml
# blueprints/manifests/apigw-lambda-rds.yaml
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
```

**O manifest descreve o que o blueprint oferece, mas não contém código.**

### 3. Criar Template (Baseado no código real)

```hcl
# skills/blueprint-template-generator/templates/rds-module.tf.template
resource "aws_db_instance" "this" {
  identifier = "{{db_identifier}}"
  engine     = "postgres"
  engine_version = "{{engine_version}}"
  # ... código com placeholders ...
}
```

**O template é uma cópia parametrizada do código real do blueprint.**

## Quando Você Escreve Código Terraform

### ✅ Você escreve código quando

1. **Criando um novo blueprint**
   - Escreve todo o código Terraform em `aws/{blueprint-name}/`
   - Cria módulos, environments, testes
   - Este é o código de produção

2. **Atualizando um blueprint existente**
   - Modifica código em `aws/{blueprint-name}/`
   - Adiciona recursos, melhora padrões
   - Mantém o código atualizado

3. **Criando templates para snippets**
   - Baseia-se no código real do blueprint
   - Adiciona placeholders `{{variable}}`
   - Mantém templates sincronizados com código real

### ❌ Você NÃO escreve código quando

1. **Usando Template Generator**
   - O generator cria código baseado nos templates
   - Você só fornece parâmetros (JSON)
   - O código é gerado automaticamente

2. **Usando blueprints existentes**
   - Copia o blueprint completo
   - Não precisa reescrever, só adaptar

## Exemplo Prático

### Cenário: Adicionar RDS a um projeto existente

**Opção 1: Usar Template Generator (Recomendado)**

```json
// Você fornece parâmetros
{
  "blueprint": "apigw-lambda-rds",
  "snippet": "rds-module",
  "params": {
    "db_identifier": "myapp-dev-db",
    "db_name": "myapp"
  }
}
```

**O generator cria o código automaticamente** baseado no template (que veio do blueprint real).

**Opção 2: Copiar do Blueprint Diretamente**

```bash
# Você copia o código real
cp aws/apigw-lambda-rds/modules/data/main.tf myproject/modules/data/
# E adapta manualmente
```

## Manutenção: Mantendo Tudo Sincronizado

### Ordem de Atualização

1. **Atualizar código do blueprint** (fonte de verdade)

   ```hcl
   # aws/apigw-lambda-rds/modules/data/main.tf
   # Você adiciona novo recurso aqui
   ```

2. **Atualizar template** (se necessário)

   ```hcl
   # skills/blueprint-template-generator/templates/rds-module.tf.template
   # Adiciona {{placeholder}} para novo recurso
   ```

3. **Atualizar manifest** (se necessário)

   ```yaml
   # blueprints/manifests/apigw-lambda-rds.yaml
   # Adiciona nova variável se necessário
   ```

## Resumo

| Item | Você Escreve? | Quando? |
|------|---------------|---------|
| **Código do Blueprint** | ✅ Sim | Sempre - é o código de produção |
| **Manifest YAML** | ✅ Sim | Uma vez - descreve o blueprint |
| **Template** | ✅ Sim | Uma vez - parametriza o código |
| **Código Gerado** | ❌ Não | Gerado automaticamente pelo script |

## Princípio Fundamental

> **O código Terraform do blueprint é sempre a fonte de verdade.**
>
> Manifests e templates são **derivados** do código real. Se você mudar o código do blueprint, deve atualizar templates e manifests para manter sincronização.

## Analogia com Backstage

No Backstage:

- **Código do plugin** = Você escreve (TypeScript/React)
- **catalog-info.yaml** = Você descreve (metadados)
- **Backstage** = Lê metadados e descobre plugins

No nosso sistema:

- **Código do blueprint** = Você escreve (Terraform)
- **Manifest YAML** = Você descreve (metadados)
- **Template Generator** = Lê metadados e gera código

## Próximos Passos

1. **Para criar novo blueprint**: Escreva código Terraform completo primeiro
2. **Para adicionar manifest**: Descreva o blueprint em YAML
3. **Para adicionar template**: Parametrize o código real do blueprint
4. **Para usar**: Use Template Generator ou copie blueprint diretamente

## Referências

- [ADR 0007: Manifest-Based Template Generation](../adr/0007-manifest-based-template-generation.md)
- [ADR 0008: Backstage-Inspired Manifest Evolution](../adr/0008-backstage-inspired-manifest-evolution.md)
- [Template Generator vs Repository](./blueprints/template-generator-vs-repo.md)
- [Blueprint Template Generator Skill](../../skills/blueprint-template-generator/SKILL.md)
