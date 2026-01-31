# Fluxo de Trabalho do Desenvolvedor - Referência Rápida

> **Importante**: Desenvolvedores **não acessam o repositório de blueprints**. Eles usam AI Assistants que interagem com o repositório internamente. Apenas **mantenedores** criam e mantêm blueprints no repositório.

## 🎯 Dois Cenários Principais (Desenvolvedores)

### Scenario 1: App Exists, Needs Infrastructure

**Situação**: Você tem uma aplicação (React, Node.js, Python, etc.) rodando localmente e precisa de infraestrutura Terraform completa para fazer deploy na AWS.

```
Você: "Preciso fazer deploy na AWS"
  ↓
AI: Analisa código da app → Recomenda blueprint → Mostra estrutura completa
  ↓
Você: Copia blueprint completo → Adapta → Aplica
```

**Tempo**: 5-10 minutos  
**Ferramenta**: Blueprint Repository (MCP)  
**Resultado**: Estrutura Terraform completa (environments/, modules/, etc.)  
**Por quê**: Precisa de estrutura completa, não apenas snippets individuais

**Como funciona**:

- ✅ AI analisa automaticamente código da aplicação (package.json, requirements.txt, etc.)
- ✅ AI identifica stack (React, Node.js, Python, PostgreSQL, etc.)
- ✅ AI recomenda blueprint apropriado
- ✅ AI mostra estrutura completa

**Você pode ser mais específico se quiser**:

- "Preciso fazer deploy serverless" (vs containers)
- "Quero usar containers" (vs serverless)
- Mas não precisa listar toda a stack - AI vê no código

**Exemplos**:

- "Preciso fazer deploy na AWS"
- "Quero deployar minha API usando serverless"
- "Preciso de infraestrutura para minha aplicação containerizada"

---

### Scenario 2: Existing Terraform, Add Capability

**Situação**: Você já tem Terraform configurado e quer adicionar um recurso específico (RDS, SQS, Cognito, etc.).

```
Você: "Preciso adicionar RDS PostgreSQL"
  ↓
AI: Analisa Terraform existente → Identifica blueprint → Gera snippet
  ↓
Você: Copia código gerado → Integra → Aplica
```

**Tempo**: 2 minutos  
**Ferramenta**: Template Generator  
**Resultado**: Snippet Terraform gerado e adaptado  
**Por quê**: Gera apenas o necessário, já adaptado às convenções do projeto

**Como funciona**:

- ✅ AI analisa automaticamente seu código Terraform existente
- ✅ AI identifica recursos existentes (API Gateway, Lambda, VPC, etc.)
- ✅ AI extrai convenções de nomenclatura do projeto
- ✅ AI gera código já adaptado às suas convenções

**Você não precisa dizer**:

- ❌ "Tenho API Gateway + Lambda" (AI vê no código)
- ❌ "Meu projeto usa padrão myapp-dev-*" (AI extrai do código)
- ❌ "Tenho VPC vpc-123456" (AI pode ver nos arquivos)

**Você só precisa dizer**:

- ✅ "Preciso adicionar RDS PostgreSQL"
- ✅ "Quero adicionar SQS"
- ✅ "Preciso de autenticação Cognito"

**Exemplos**:

- "Preciso adicionar RDS PostgreSQL"
- "Quero adicionar SQS para processamento assíncrono"
- "Preciso adicionar autenticação Cognito"

---

### 3️⃣ Criar Novo Blueprint (Apenas Mantenedores)

> **⚠️ Desenvolvedores não criam blueprints**. Esta tarefa é para mantenedores do repositório.

```
Mantenedor: "Preciso criar padrão que não existe"
  ↓
Mantenedor: Acessa repo → Estuda similares → Escreve código
  ↓
Mantenedor: Cria manifest → Cria template → Testa → Commita
```

**Tempo**: 2-4 horas  
**Ferramenta**: Repositório + Git  
**Resultado**: Blueprint disponível para desenvolvedores via AI Assistants

---

## 📊 Fluxo Detalhado: Adicionar Capacidade

```
┌─────────────────────────────────────────────────────────┐
│ PASSO 1: Você pede                                      │
└─────────────────────────────────────────────────────────┘
"Preciso adicionar RDS PostgreSQL"

┌─────────────────────────────────────────────────────────┐
│ PASSO 2: AI analisa código Terraform existente          │
└─────────────────────────────────────────────────────────┘
✅ AI lê arquivos Terraform do projeto
✅ AI identifica recursos existentes (API Gateway, Lambda, VPC)
✅ AI extrai convenções de nomenclatura (myapp-dev-*)
✅ AI identifica VPC, subnet groups, security groups

┌─────────────────────────────────────────────────────────┐
│ PASSO 3: AI identifica blueprint e gera código         │
└─────────────────────────────────────────────────────────┘
✅ Intent: "adicionar capacidade"
✅ Blueprint: apigw-lambda-rds
✅ Snippet: rds-module
✅ Skill: blueprint-template-generator
✅ Parâmetros extraídos automaticamente:
   - Projeto: "myapp" (do código)
   - Ambiente: "dev" (do código)
   - VPC: "vpc-123456" (do código)
   - Subnet group: "myapp-dev-db-subnets" (do código)
   - Security group: "sg-123456" (do código)

┌─────────────────────────────────────────────────────────┐
│ PASSO 4: AI executa Template Generator                 │
└─────────────────────────────────────────────────────────┘
{
  "blueprint": "apigw-lambda-rds",
  "snippet": "rds-module",
  "params": {
    "db_identifier": "myapp-dev-db",
    "db_name": "myapp",
    "db_subnet_group_name": "myapp-dev-db-subnets",
    "security_group_id": "sg-123456"
  }
}
  ↓
Template Generator:
  1. Lê manifest
  2. Valida parâmetros
  3. Renderiza template
  4. Retorna código

┌─────────────────────────────────────────────────────────┐
│ PASSO 5: Você recebe código                             │
└─────────────────────────────────────────────────────────┘
resource "aws_db_instance" "this" {
  identifier = "myapp-dev-db"
  engine     = "postgres"
  # ... código completo ...
}

┌─────────────────────────────────────────────────────────┐
│ PASSO 6: Você usa                                       │
└─────────────────────────────────────────────────────────┘
✅ Copia código para modules/data/main.tf
✅ Revisa e adapta se necessário
✅ terraform plan
✅ terraform apply
✅ Testa conexão
```

**Total**: ~2 minutos

---

## 🔄 O Que Acontece Por Trás dos Panos

### Template Generator Internamente

```
1. Lê Manifest
   blueprints/manifests/apigw-lambda-rds.yaml
   ↓
2. Valida Parâmetros
   - db_identifier: string ✓
   - db_name: string ✓
   - security_group_id: pattern ^sg-.* ✓
   ↓
3. Lê Template
   templates/rds-module.tf.template
   ↓
4. Substitui Placeholders
   {{db_identifier}} → "myapp-dev-db"
   {{db_name}} → "myapp"
   ↓
5. Retorna Código
   Terraform HCL renderizado
```

### Blueprint Repository Internamente

```
1. Você pede blueprint
   "Preciso de API serverless com PostgreSQL"
   ↓
2. AI usa MCP tool (internamente, você não vê)
   recommend_blueprint(database: "postgresql", pattern: "sync")
   ↓
3. MCP retorna
   blueprint: "apigw-lambda-rds"
   ↓
4. AI busca arquivos do repo (internamente, você não vê)
   fetch_blueprint_file(blueprint: "apigw-lambda-rds", path: "README.md")
   fetch_blueprint_file(blueprint: "apigw-lambda-rds", path: "environments/dev/main.tf")
   ↓
5. AI mostra código extraído
   Você copia código mostrado (não acessa repo)
```

---

## 🎨 Diagrama de Decisão

```
Você precisa de infraestrutura
  │
  ├─ Você tem Terraform existente?
  │   └─ SIM → Scenario 2: Existing Terraform, Add Capability
  │       └─ AI usa Template Generator
  │       └─ Você recebe snippet em 2 min
  │
  ├─ Você tem app mas sem Terraform?
  │   └─ SIM → Scenario 1: App Exists, Needs Infrastructure
  │       └─ AI usa Blueprint Repository
  │       └─ Você recebe estrutura completa em 5-10 min
  │
  └─ Padrão não existe?
      └─ SIM → Solicita a mantenedor
          └─ Mantenedor cria blueprint (2-4 horas)
          └─ Blueprint disponível para todos
```

---

## 💡 Dicas Práticas

### Scenario 1: App Exists, Needs Infrastructure

1. **Diga o que quer fazer**: "Preciso fazer deploy na AWS"
2. **Opcional - seja específico sobre preferência**: "Preciso de API serverless" ou "Quero usar containers"
3. **AI analisa automaticamente**: package.json, requirements.txt, etc.
4. **AI recomenda**: Blueprint apropriado baseado na stack detectada

**Exemplo**: "Preciso fazer deploy na AWS" (AI vê que é Node.js + PostgreSQL e recomenda blueprint)

### Scenario 2: Existing Terraform, Add Capability

1. **Diga o que quer adicionar**: "Preciso adicionar RDS PostgreSQL"
2. **AI analisa automaticamente**: Código Terraform existente
3. **AI extrai automaticamente**: Convenções, VPC, security groups, etc.
4. **AI gera código**: Já adaptado às suas convenções

**Exemplo**: "Preciso adicionar RDS PostgreSQL" (AI vê Terraform existente, extrai tudo automaticamente, gera código adaptado)

### Para Solicitar Novo Blueprint (Desenvolvedores)

1. **Verifique se existe**: Pergunte ao AI antes de solicitar
2. **Descreva necessidade**: "Preciso de padrão para X"
3. **Solicite a mantenedor**: Mantenedor cria no repositório

> **Nota**: Desenvolvedores não criam blueprints. Apenas mantenedores criam no repositório.

---

## ⚡ Atalhos

### Comandos Rápidos

```bash
# Gerar código localmente (se tiver acesso)
cd skills/blueprint-template-generator
echo '{"blueprint":"apigw-lambda-rds","snippet":"rds-module","params":{...}}' | node scripts/generate.js

# Validar manifest
npm run validate:manifest apigw-lambda-rds

# Ver snippets disponíveis
cat blueprints/manifests/apigw-lambda-rds.yaml
```

### Perguntas Úteis para AI

- "Quais blueprints têm PostgreSQL?"
- "Qual blueprint usar para API serverless?"
- "Como adicionar RDS ao meu projeto?"
- "Preciso criar novo blueprint para X?"

---

## 📈 Economia de Tempo

| Tarefa | Manual | Com Sistema | Economia |
|--------|--------|-------------|----------|
| Adicionar RDS | 30 min | 2 min | 93% |
| Criar projeto | 3 horas | 10 min | 94% |
| Entender padrão | 1 hora | 5 min | 92% |

---

## 🔗 Referências Rápidas

- **Template Generator**: `skills/blueprint-template-generator/SKILL.md`
- **Blueprint Guidance**: `skills/blueprint-guidance/SKILL.md`
- **Manifests**: `blueprints/manifests/*.yaml`
- **Blueprints**: `aws/*/`, `azure/*/`, `gcp/*/`

---

## ❓ FAQ Rápido

**Q: Preciso escrever código Terraform?**  
A: Sim, para criar/manter blueprints. Não, para usar blueprints existentes.

**Q: Manifest substitui código?**  
A: Não, manifest é metadados. Código é fonte de verdade.

**Q: Quando usar Template Generator vs Blueprint Repository?**  
A: Template Generator para Scenario 2 (adicionar capacidade a Terraform existente). Blueprint Repository para Scenario 1 (app existe, precisa de infraestrutura completa).

**Q: Por que Template Generator não é usado para criar novo projeto?**  
A: Template Generator gera snippets individuais. Para criar projeto completo, você precisa de estrutura completa (environments/, main.tf, etc.) que Blueprint Repository fornece.

**Q: Como adicionar novo blueprint?**  
A: Desenvolvedores não adicionam. Solicite a mantenedor que cria no repositório.

**Q: Preciso acessar o repositório?**  
A: Não. Desenvolvedores usam AI Assistants. Apenas mantenedores acessam o repo.

**Q: Qual a diferença entre desenvolvedor e mantenedor?**  
A: Desenvolvedores usam blueprints via AI. Mantenedores criam/manuten blueprints no repo.
