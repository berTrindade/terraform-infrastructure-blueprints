# Fluxo de Trabalho do Desenvolvedor

Guia prático de como desenvolvedores trabalham com blueprints através de AI Assistants.

> **Importante**: Desenvolvedores **não acessam o repositório de blueprints diretamente**. Eles usam AI Assistants que interagem com MCP tools e Template Generator. Apenas **mantenedores** criam e mantêm blueprints, manifests e templates no repositório.

## Cenários de Uso

### Scenario 1: App Exists, Needs Infrastructure

**Situação**: Você tem uma aplicação (React, Node.js, Python, etc.) rodando localmente e precisa de infraestrutura Terraform completa para fazer deploy na AWS.

**Exemplos**:

- "Preciso fazer deploy na AWS" (AI vê que é React + Node.js + PostgreSQL no código)
- "Preciso de infraestrutura para minha aplicação containerizada" (AI vê Dockerfile)
- "Quero deployar minha API usando serverless" (AI vê código da API)

**Ferramenta**: Blueprint Repository (MCP tools)  
**Por quê**: Precisa de estrutura completa (environments/, modules/, main.tf, etc.), não apenas snippets individuais

---

### Scenario 2: Existing Terraform, Add Capability

**Situação**: Você já tem Terraform configurado e quer adicionar um recurso específico (RDS, SQS, Cognito, etc.).

**Exemplos**:

- "Preciso adicionar RDS PostgreSQL" (AI vê que já tem API Gateway + Lambda no código)
- "Quero adicionar SQS para processamento assíncrono" (AI vê infraestrutura existente)
- "Preciso adicionar autenticação Cognito" (AI vê projeto existente)

**Ferramenta**: Template Generator  
**Por quê**: Gera apenas o snippet necessário, já adaptado às convenções do projeto

---

### Cenário Detalhado: Scenario 2 - Adicionar Capacidade a Terraform Existente

#### Fluxo Completo: Scenario 2

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DESCOBERTA (AI Assistant)                                │
└─────────────────────────────────────────────────────────────┘

Você: "Preciso adicionar RDS PostgreSQL"

AI Assistant:
  ✅ Analisa código Terraform existente automaticamente
  ✅ Identifica recursos existentes (API Gateway, Lambda, VPC, etc.)
  ✅ Extrai convenções de nomenclatura do projeto
  ✅ Identifica intent: "adicionar capacidade"
  ✅ Usa skill blueprint-template-generator
  ✅ Identifica snippet: "rds-module"


┌─────────────────────────────────────────────────────────────┐
│ 2. EXTRAÇÃO DE PARÂMETROS (AI Assistant)                    │
└─────────────────────────────────────────────────────────────┘

AI Assistant analisa código Terraform automaticamente:
  - Lê arquivos .tf do projeto
  - Extrai projeto: "myapp" (de variáveis ou nomes de recursos)
  - Extrai ambiente: "dev" (de variáveis ou nomes de recursos)
  - Extrai VPC: "vpc-123456" (de recursos existentes)
  - Extrai subnet group: "myapp-dev-db-subnets" (de recursos existentes)
  - Extrai security group: "sg-123456" (de recursos existentes)
  - Identifica padrão de nomenclatura: "{project}-{env}-{component}"


┌─────────────────────────────────────────────────────────────┐
│ 3. GERAÇÃO DE CÓDIGO (Template Generator)                  │
└─────────────────────────────────────────────────────────────┘

AI Assistant executa internamente (você não vê):
  - Chama Template Generator skill
  - Template Generator lê manifest do repo (internamente)
  - Valida parâmetros
  - Renderiza template
  - Retorna código Terraform

Você só vê: código Terraform gerado


┌─────────────────────────────────────────────────────────────┐
│ 4. CÓDIGO GERADO (Você recebe)                              │
└─────────────────────────────────────────────────────────────┘

AI Assistant retorna:

resource "aws_db_instance" "this" {
  identifier = "myapp-dev-db"
  engine     = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  # ... código completo já adaptado ...
}


┌─────────────────────────────────────────────────────────────┐
│ 5. VOCÊ USA O CÓDIGO                                        │
└─────────────────────────────────────────────────────────────┘

Você:
  ✅ Copia código gerado para seu projeto
  ✅ Adapta se necessário (valores específicos)
  ✅ Aplica com terraform apply
  ✅ Testa e valida
```

**Tempo total**: ~30 segundos (vs 5-10 minutos escrevendo manualmente)

---

### Cenário Detalhado: Scenario 1 - App Exists, Needs Infrastructure

**Situação**: Você tem uma aplicação e precisa de infraestrutura Terraform completa.

#### Fluxo Completo: Scenario 1

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DESCOBERTA (AI Assistant)                                │
└─────────────────────────────────────────────────────────────┘

Você: "Preciso fazer deploy na AWS"

AI Assistant:
  ✅ Analisa código da aplicação automaticamente (package.json, requirements.txt, etc.)
  ✅ Identifica stack: React, Node.js, PostgreSQL
  ✅ Identifica: app existe, precisa de infraestrutura completa
  ✅ Usa MCP tool: recommend_blueprint()
  ✅ Recomenda: "apigw-lambda-rds" (serverless) ou "alb-ecs-fargate-rds" (containers)
  ✅ Explica diferenças e recomenda baseado na stack detectada


┌─────────────────────────────────────────────────────────────┐
│ 2. ESTUDO DO BLUEPRINT (AI Assistant)                       │
└─────────────────────────────────────────────────────────────┘

AI Assistant usa MCP tools internamente:
  - fetch_blueprint_file() busca estrutura completa do repo
  - Mostra: environments/dev/main.tf, modules/, README.md
  - Você recebe código já extraído e organizado


┌─────────────────────────────────────────────────────────────┐
│ 3. VOCÊ RECEBE ESTRUTURA COMPLETA                          │
└─────────────────────────────────────────────────────────────┘

AI Assistant mostra:
  ✅ Estrutura completa do blueprint
  ✅ environments/dev/main.tf (composição)
  ✅ Todos os módulos (api, data, compute, etc.)
  ✅ Instruções de configuração e deploy

Você:
  ✅ Copia estrutura completa mostrada pelo AI
  ✅ Adapta valores (nomes, tags, região, etc.)
  ✅ Configura terraform.tfvars
  ✅ Aplica com terraform apply

⚠️ Você NÃO acessa o repositório diretamente - AI faz isso por você
⚠️ Você recebe estrutura completa, não apenas snippets
```

**Tempo total**: 5-10 minutos (vs 2-4 horas criando do zero)

---

### Cenário 3: Criar Novo Blueprint (Apenas Mantenedores)

> **⚠️ Nota**: Criar novos blueprints é tarefa de **mantenedores**, não desenvolvedores. Desenvolvedores usam blueprints existentes através de AI Assistants.

**Situação**: Mantenedor precisa criar padrão que não existe (ex: API Gateway + Step Functions).

#### Fluxo Completo (Para Mantenedores)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. IDENTIFICAÇÃO (Mantenedor)                               │
└─────────────────────────────────────────────────────────────┘

Mantenedor identifica:
  - Padrão não existe nos blueprints
  - Precisa criar novo blueprint
  - Exemplo: "API Gateway + Step Functions + Lambda + DynamoDB"


┌─────────────────────────────────────────────────────────────┐
│ 2. ESTUDO DE BLUEPRINTS SIMILARES (Mantenedor)             │
└─────────────────────────────────────────────────────────────┘

Mantenedor acessa repositório diretamente:
  - Estuda blueprints similares no repo
  - Entende estrutura e padrões
  - Referencia código existente


┌─────────────────────────────────────────────────────────────┐
│ 3. CRIAÇÃO DO BLUEPRINT (Mantenedor escreve código)         │
└─────────────────────────────────────────────────────────────┘

Mantenedor:
  ✅ Acessa repositório: terraform-infrastructure-blueprints/
  ✅ Cria estrutura: aws/apigw-stepfunctions-lambda-dynamodb/
  ✅ Escreve código Terraform completo
  ✅ Cria módulos, environments, testes, README
  ✅ Testa com terraform apply


┌─────────────────────────────────────────────────────────────┐
│ 4. CRIAÇÃO DO MANIFEST (Mantenedor)                         │
└─────────────────────────────────────────────────────────────┘

Mantenedor cria: blueprints/manifests/apigw-stepfunctions-lambda-dynamodb.yaml
  - Descreve blueprint em YAML
  - Define snippets disponíveis
  - Especifica variáveis e validações


┌─────────────────────────────────────────────────────────────┐
│ 5. CRIAÇÃO DO TEMPLATE (Mantenedor)                         │
└─────────────────────────────────────────────────────────────┘

Mantenedor cria: skills/blueprint-template-generator/templates/
  - Parametriza código real
  - Adiciona placeholders {{variable}}
  - Testa geração
```

**Tempo total**: ~2-4 horas (criar blueprint completo)

**Resultado**: Blueprint disponível para todos os desenvolvedores via AI Assistants

---

## Fluxo Visual: Adicionar Capacidade

```
┌──────────────┐
│   Você       │
│  "Preciso    │
│   adicionar  │
│   RDS"       │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│  AI Assistant                    │
│  - Identifica intent             │
│  - Lê manifest                   │
│  - Extrai parâmetros             │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Template Generator              │
│  - Valida parâmetros             │
│  - Renderiza template            │
│  - Retorna código                │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Você recebe código gerado      │
│  - Copia para projeto           │
│  - Adapta se necessário         │
│  - Aplica com terraform         │
└─────────────────────────────────┘
```

## Fluxo Visual: Criar Novo Blueprint

```
┌──────────────┐
│   Você       │
│  "Preciso    │
│   criar novo │
│   blueprint" │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│  AI Assistant                    │
│  - Estuda blueprints similares   │
│  - Mostra estrutura              │
│  - Sugere padrões                │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Você escreve                   │
│  - Código Terraform             │
│  - Módulos                      │
│  - Environments                 │
│  - README                       │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Você cria                      │
│  - Manifest YAML                │
│  - Templates                    │
│  - Testa geração                │
└─────────────────────────────────┘
```

## Decisão: Qual Ferramenta Usar?

### Scenario 1: App Exists, Needs Infrastructure

**Use Blueprint Repository (MCP tools) quando**:

- ✅ Você tem uma aplicação (React, Node.js, Python, etc.)
- ✅ Você não tem Terraform ainda
- ✅ Precisa de estrutura completa (environments/, modules/, etc.)
- ✅ Quer fazer deploy completo da aplicação

**Exemplo**: "Tenho uma app React + Node.js + PostgreSQL rodando localmente. Preciso fazer deploy na AWS."

**Por quê**: Blueprint Repository fornece estrutura completa necessária para deploy completo.

### Scenario 2: Existing Terraform, Add Capability

**Use Template Generator quando**:

- ✅ Você já tem Terraform configurado
- ✅ Quer adicionar um recurso específico (RDS, SQS, Cognito)
- ✅ Precisa de código já adaptado às convenções do projeto
- ✅ Quer economizar tokens (50 linhas vs 200+ linhas)

**Exemplo**: "Tenho API Gateway + Lambda. Preciso adicionar RDS PostgreSQL."

**Por quê**: Template Generator gera apenas o snippet necessário, já adaptado.

### Use Código Direto quando (Apenas Mantenedores)

- ✅ Criar novo blueprint
- ✅ Modificar blueprint existente
- ✅ Criar templates
- ✅ Manter código de produção

**Exemplo**: "Vou criar um novo padrão arquitetural"

> **Nota**: Desenvolvedores não criam blueprints. Eles usam blueprints existentes através de AI Assistants.

## Exemplo Prático Completo

### Exemplo 1: Scenario 2 - Adicionar RDS a Terraform Existente

**1. Você inicia conversa:**

```
Você: "Preciso adicionar PostgreSQL RDS ao meu projeto Lambda"
```

**2. AI Assistant identifica:**

- Intent: "adicionar capacidade" → usa Template Generator
- Blueprint: `apigw-lambda-rds`
- Snippet: `rds-module`

**3. AI Assistant extrai do histórico:**

```javascript
// Do histórico da conversa
const params = {
  db_identifier: "myapp-dev-db",        // Padrão: {project}-{env}-{component}
  db_name: "myapp",                     // Nome do projeto
  db_subnet_group_name: "myapp-dev-db-subnets",  // Já existe no projeto
  security_group_id: "sg-123456"        // Security group existente
};
```

**4. AI Assistant executa:**

```bash
cd skills/blueprint-template-generator
echo '{
  "blueprint": "apigw-lambda-rds",
  "snippet": "rds-module",
  "params": {
    "db_identifier": "myapp-dev-db",
    "db_name": "myapp",
    "db_subnet_group_name": "myapp-dev-db-subnets",
    "security_group_id": "sg-123456"
  }
}' | node scripts/generate.js
```

**5. Template Generator processa:**

```
1. Lê: blueprints/manifests/apigw-lambda-rds.yaml
2. Valida parâmetros contra manifest
3. Lê: templates/rds-module.tf.template
4. Substitui {{placeholders}} com valores
5. Retorna código Terraform renderizado
```

**6. Você recebe código:**

```hcl
resource "aws_db_instance" "this" {
  identifier = "myapp-dev-db"
  engine     = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  # ... código completo já adaptado ...
}
```

**7. Você usa:**

```bash
# Copia código para seu projeto
vim modules/data/main.tf  # Cola código gerado

# Aplica
terraform plan
terraform apply
```

**Tempo total**: ~2 minutos (vs 15-30 minutos escrevendo manualmente)

## Comparação de Tempos

| Cenário | Sem Sistema | Com Sistema | Economia |
|---------|-------------|-------------|----------|
| **Scenario 2**: Adicionar RDS a Terraform existente | 15-30 min | 2 min | 87-93% |
| **Scenario 1**: Deploy de app (infraestrutura completa) | 2-4 horas | 5-10 min | 90-95% |
| Criar novo blueprint (mantenedor) | 4-8 horas | 2-4 horas | 50% |

> **Nota**: Desenvolvedores não criam blueprints. Apenas mantenedores criam/manuten blueprints no repositório.

## Benefícios Práticos

### Para Desenvolvedores

1. **Velocidade**: Código pronto em segundos
2. **Consistência**: Sempre segue padrões testados
3. **Menos erros**: Código já validado
4. **Foco**: Foca em lógica de negócio, não infraestrutura
5. **Sem acesso ao repo**: Não precisa conhecer estrutura do repositório

### Para Mantenedores

1. **Centralização**: Um lugar para manter todos os blueprints
2. **Reutilização**: Blueprint criado uma vez, usado por todos
3. **Controle**: Padrões controlados e testados
4. **Escalabilidade**: Adiciona blueprint = todos podem usar via AI

### Para o Time

1. **Padronização**: Todos usam mesmos padrões
2. **Manutenção**: Mantenedor atualiza blueprint, todos se beneficiam
3. **Conhecimento**: Padrões documentados e acessíveis via AI
4. **Separação de responsabilidades**: Devs usam, mantenedores criam

## Checklist de Uso

### Quando Adicionar Capacidade

- [ ] Identificar blueprint relevante
- [ ] Extrair parâmetros do projeto
- [ ] Usar Template Generator
- [ ] Revisar código gerado
- [ ] Adaptar se necessário
- [ ] Aplicar e testar

### Quando Criar Novo Blueprint (Apenas Mantenedores)

> **⚠️ Desenvolvedores não criam blueprints**. Esta seção é para mantenedores do repositório.

- [ ] Verificar se blueprint não existe
- [ ] Estudar blueprints similares no repo
- [ ] Escrever código Terraform no repo
- [ ] Criar manifest YAML no repo
- [ ] Criar templates no repo
- [ ] Testar geração
- [ ] Documentar
- [ ] Disponibilizar para desenvolvedores via AI Assistants

## Referências

- [Como Manifests Funcionam](./how-manifests-work-with-blueprints.md)
- [Template Generator vs Repository](./blueprints/template-generator-vs-repo.md)
- [Blueprint Template Generator Skill](../../skills/blueprint-template-generator/SKILL.md)
- [Blueprint Guidance Skill](../../skills/blueprint-guidance/SKILL.md)
