# Template Generator vs Blueprint Repository

Guia para entender quando usar o **Template Generator** (skill) vs quando usar o **Blueprint Repository** (MCP tools).

> **Contexto arquitetural**: Este documento descreve os dois cenários mencionados pelo Felipe: o **Template Generator** funciona como uma "linha de montagem técnica" que entrega código pronto, enquanto o **Blueprint Repository** funciona como um "manual de boas práticas" para estudo e compreensão. Para entender a visão completa sobre manifestos YAML e arquitetura agnóstica, veja [ADR 0007: Manifest-Based Template Generation Architecture](../adr/0007-manifest-based-template-generation.md).

## Visão Geral

O **Template Generator** e o **Blueprint Repository** servem propósitos diferentes e complementares:

| Cenário | Ferramenta | Por quê? |
|---------|-----------|----------|
| **Adicionar capacidade** a projeto existente | Template Generator | Gera código adaptado, economiza tokens |
| **Criar novo blueprint** | Blueprint Repository | Precisa ver estrutura completa, padrões, testes |
| **Estudar como funciona** | Blueprint Repository | Precisa ver código completo, entender arquitetura |
| **Copiar blueprint completo** | Blueprint Repository | Precisa de toda a estrutura (módulos, testes, docs) |
| **Gerar snippet específico** | Template Generator | Gera apenas o necessário, já adaptado |

## Quando Usar Template Generator

### ✅ Use Template Generator Para

1. **Adicionar capacidade a projeto existente**
   - Exemplo: "Preciso adicionar RDS ao meu projeto Lambda existente"
   - O generator extrai parâmetros do histórico e gera código adaptado
   - Economiza tokens (50 linhas vs 200+ linhas)

2. **Gerar snippets específicos**
   - Exemplo: "Preciso do padrão de senha efêmera"
   - Gera apenas o necessário, não o blueprint inteiro

3. **Scaffold rápido de módulos**
   - Exemplo: "Preciso de um módulo SQS seguindo padrões do blueprint"
   - Gera código já seguindo convenções do projeto

### ❌ NÃO Use Template Generator Para

- Estudar como um blueprint funciona
- Ver a estrutura completa de um blueprint
- Copiar um blueprint completo para novo projeto
- Entender testes e validações
- Ver documentação completa

## Quando Usar Blueprint Repository

### ✅ Use Blueprint Repository (MCP tools) Para

1. **Criar novos blueprints**
   - Precisa ver estrutura completa de blueprints existentes
   - Precisa entender padrões de módulos, testes, documentação
   - Precisa referenciar múltiplos arquivos para criar blueprint completo

2. **Estudar blueprints**
   - Exemplo: "Como funciona o blueprint apigw-lambda-rds?"
   - Precisa ver código completo, arquitetura, testes

3. **Copiar blueprint completo**
   - Exemplo: "Quero usar o blueprint apigw-lambda-rds no meu projeto"
   - Precisa de toda a estrutura: módulos, environments, testes, docs

4. **Entender padrões complexos**
   - Exemplo: "Como funciona o padrão de VPC endpoints?"
   - Precisa ver implementação completa, não apenas snippet

5. **Referenciar múltiplos arquivos**
   - Exemplo: "Preciso ver o módulo de dados, networking e secrets juntos"
   - Template generator gera um snippet, repo permite ver tudo

## Fluxo de Criação de Novos Blueprints

### Passo 1: Identificar Necessidade

**Quando criar um novo blueprint:**

- Novo padrão arquitetural não coberto por blueprints existentes
- Combinação única de serviços que não existe
- Padrão específico de um cloud provider

**Exemplo**: "Preciso de um blueprint para API Gateway + Step Functions + Lambda + DynamoDB"

### Passo 2: Estudar Blueprints Existentes

**Use Blueprint Repository** para:

- Ver estrutura de blueprints similares
- Entender padrões de módulos
- Ver como testes são estruturados
- Entender documentação necessária

```typescript
// Use MCP tools para estudar
fetch_blueprint_file(blueprint: "apigw-lambda-dynamodb", path: "modules/api/main.tf")
fetch_blueprint_file(blueprint: "apigw-lambda-dynamodb", path: "environments/dev/main.tf")
fetch_blueprint_file(blueprint: "apigw-lambda-dynamodb", path: "README.md")
```

### Passo 3: Criar Estrutura do Blueprint

**Use a skill `create-blueprint`** ou siga o padrão manualmente:

```
aws/apigw-lambda-stepfunctions/
├── environments/
│   └── dev/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       ├── versions.tf
│       └── terraform.tfvars
├── modules/
│   ├── api/
│   ├── compute/
│   ├── data/
│   ├── orchestration/  # Novo módulo para Step Functions
│   ├── networking/
│   ├── naming/
│   └── tagging/
├── src/
├── tests/
└── README.md
```

### Passo 4: Implementar Módulos

**Use Blueprint Repository** para referenciar padrões:

- Copiar e adaptar módulos similares
- Seguir padrões de naming, tagging, secrets
- Implementar testes seguindo padrões existentes

### Passo 5: Criar Manifesto YAML (Opcional)

**Depois de criar o blueprint**, você pode criar um manifesto para o Template Generator:

```yaml
# blueprints/manifests/apigw-lambda-stepfunctions.yaml
name: apigw-lambda-stepfunctions
description: Serverless API with Step Functions orchestration
version: 1.0.0

snippets:
  - id: stepfunctions-state-machine
    name: Step Functions State Machine
    template: stepfunctions-state-machine.tf.template
    variables:
      - name: state_machine_name
        type: string
        required: true
      # ...
```

Isso permite que o Template Generator gere snippets deste blueprint no futuro.

## Exemplos Práticos

### Exemplo 1: Adicionar RDS a Projeto Existente

**Cenário**: Projeto Lambda existente, precisa adicionar RDS

**Ferramenta**: **Template Generator**

```json
{
  "blueprint": "apigw-lambda-rds",
  "snippet": "rds-module",
  "params": {
    "db_identifier": "myapp-dev-db",
    "db_subnet_group_name": "existing-subnets",
    "security_group_id": "sg-existing"
  }
}
```

**Resultado**: Código Terraform gerado (50 linhas) já adaptado ao projeto

### Exemplo 2: Criar Novo Blueprint Step Functions

**Cenário**: Criar blueprint completo para API Gateway + Step Functions

**Ferramenta**: **Blueprint Repository**

1. Estudar blueprints similares:

   ```typescript
   fetch_blueprint_file(blueprint: "apigw-lambda-dynamodb", path: "modules/api/main.tf")
   fetch_blueprint_file(blueprint: "apigw-eventbridge-lambda", path: "modules/events/main.tf")
   ```

2. Criar estrutura completa usando `create-blueprint` skill

3. Implementar módulos referenciando padrões do repo

4. Criar testes, documentação, etc.

**Resultado**: Blueprint completo pronto para uso

### Exemplo 3: Entender Como Funciona Ephemeral Password

**Cenário**: "Como funciona o padrão de senha efêmera?"

**Ferramenta**: **Blueprint Repository**

```typescript
fetch_blueprint_file(blueprint: "apigw-lambda-rds", path: "modules/data/main.tf")
fetch_blueprint_file(blueprint: "apigw-lambda-rds", path: "environments/dev/terraform.tfvars")
```

**Resultado**: Entende implementação completa, contexto, variáveis

### Exemplo 4: Gerar Snippet de Ephemeral Password

**Cenário**: "Preciso do padrão de senha efêmera no meu projeto"

**Ferramenta**: **Template Generator**

```json
{
  "blueprint": "apigw-lambda-rds",
  "snippet": "ephemeral-password",
  "params": {
    "password_name": "db"
  }
}
```

**Resultado**: Código gerado pronto para usar

## Resumo: Para Que Precisa do Blueprint Repo?

### Você PRECISA do Blueprint Repo para

1. ✅ **Criar novos blueprints**
   - Ver estrutura completa
   - Entender padrões de módulos
   - Ver como testes são feitos
   - Entender documentação necessária

2. ✅ **Estudar blueprints**
   - Ver código completo
   - Entender arquitetura
   - Ver implementação de padrões

3. ✅ **Copiar blueprint completo**
   - Para novo projeto
   - Precisa de toda a estrutura

4. ✅ **Referenciar múltiplos arquivos**
   - Ver módulos relacionados
   - Entender dependências
   - Ver padrões complexos

### Você NÃO precisa do Blueprint Repo para

1. ❌ **Adicionar capacidade a projeto existente**
   - Use Template Generator
   - Gera código adaptado
   - Economiza tokens

2. ❌ **Gerar snippet específico**
   - Use Template Generator
   - Gera apenas o necessário

## Workflow Recomendado

### Para Adicionar Capacidade (Projeto Existente)

```
1. Identificar necessidade → "adicionar RDS"
2. Usar Template Generator → Gerar código adaptado
3. Integrar no projeto → Adaptar se necessário
```

### Para Criar Novo Blueprint

```
1. Identificar necessidade → "novo padrão arquitetural"
2. Estudar blueprints similares → Usar Blueprint Repository
3. Criar estrutura → Usar create-blueprint skill
4. Implementar módulos → Referenciar padrões do repo
5. Criar manifesto YAML → Para Template Generator (opcional)
```

### Para Estudar Blueprint

```
1. Identificar blueprint → "apigw-lambda-rds"
2. Usar Blueprint Repository → fetch_blueprint_file()
3. Entender arquitetura → Ver múltiplos arquivos
4. Aplicar conhecimento → No projeto ou criar novo blueprint
```

## Conclusão

O **Template Generator** e o **Blueprint Repository** são complementares:

- **Template Generator**: Para adicionar capacidades, gerar snippets, economizar tokens
- **Blueprint Repository**: Para criar blueprints, estudar, copiar completo, entender padrões

**Para criar novos blueprints, você ainda precisa do Blueprint Repository** para:

- Ver estrutura completa
- Entender padrões
- Referenciar múltiplos arquivos
- Criar blueprint completo com testes e documentação

O Template Generator **complementa** o repo, não o substitui.
