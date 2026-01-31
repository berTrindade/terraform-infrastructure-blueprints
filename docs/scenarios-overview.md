# Cenários de Uso: Visão Geral

Guia rápido para entender os dois cenários principais e qual ferramenta usar em cada um.

## 🎯 Dois Cenários Principais

### Scenario 1: App Exists, Needs Infrastructure

**Situação**: Você tem uma aplicação (React, Node.js, Python, etc.) rodando localmente e precisa de infraestrutura Terraform completa para fazer deploy na AWS.

**O que você tem**:
- ✅ Código da aplicação (React, Node.js, Python, etc.)
- ✅ Aplicação rodando localmente
- ❌ Nenhum Terraform ainda

**O que você precisa**:
- ✅ Estrutura Terraform completa
- ✅ `environments/dev/main.tf` (composição)
- ✅ Todos os módulos (api, data, compute, etc.)
- ✅ Configuração completa para deploy

**Ferramenta**: **Blueprint Repository** (MCP tools)

**Por quê**: Precisa de estrutura completa, não apenas snippets individuais. Blueprint Repository fornece tudo de uma vez.

**Como funciona**:
- ✅ AI analisa automaticamente código da aplicação (package.json, requirements.txt, Dockerfile, etc.)
- ✅ AI identifica stack (React, Node.js, Python, PostgreSQL, etc.)
- ✅ AI recomenda blueprint apropriado
- ✅ AI mostra estrutura completa

**Você pode ser mais específico se quiser**:
- "Preciso fazer deploy serverless" (vs containers)
- "Quero usar containers" (vs serverless)
- Mas não precisa listar toda a stack - AI vê no código

**Exemplos**:
- "Preciso fazer deploy na AWS" (AI vê que é React + Node.js + PostgreSQL no código)
- "Preciso de infraestrutura para minha aplicação containerizada" (AI vê Dockerfile)
- "Quero deployar minha API usando serverless" (AI vê código da API)

**Tempo**: 5-10 minutos

---

### Scenario 2: Existing Terraform, Add Capability

**Situação**: Você já tem Terraform configurado e quer adicionar um recurso específico (RDS, SQS, Cognito, etc.).

**O que você tem**:
- ✅ Terraform já configurado
- ✅ Estrutura de diretórios existente
- ✅ Módulos já integrados
- ✅ Convenções de nomenclatura estabelecidas

**O que você precisa**:
- ✅ Apenas um módulo novo (RDS, SQS, Cognito, etc.)
- ✅ Integrar ao Terraform existente
- ✅ Seguir convenções do projeto

**Ferramenta**: **Template Generator**

**Por quê**: Gera apenas o snippet necessário, já adaptado às convenções do projeto. Economiza tokens (50 linhas vs 200+ linhas).

**Como funciona**:
- ✅ AI analisa automaticamente código Terraform existente
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
- "Preciso adicionar RDS PostgreSQL" (AI vê que já tem API Gateway + Lambda no código)
- "Quero adicionar SQS para processamento assíncrono" (AI vê infraestrutura existente)
- "Preciso adicionar autenticação Cognito" (AI vê projeto existente)

**Tempo**: 2 minutos

---

## 📊 Comparação Visual

```
┌─────────────────────────────────────────────────────────┐
│ Scenario 1: App Exists, Needs Infrastructure            │
├─────────────────────────────────────────────────────────┤
│ Você tem:                                               │
│   ✅ App (React/Node/etc)                               │
│   ❌ Terraform                                          │
│                                                         │
│ Você precisa:                                           │
│   ✅ Estrutura completa                                 │
│   ✅ environments/dev/main.tf                           │
│   ✅ Todos os módulos                                   │
│                                                         │
│ Ferramenta: Blueprint Repository                        │
│ ✅ Fornece tudo de uma vez                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Scenario 2: Existing Terraform, Add Capability          │
├─────────────────────────────────────────────────────────┤
│ Você tem:                                               │
│   ✅ Terraform existente                                │
│   ✅ Estrutura configurada                              │
│   ✅ Módulos integrados                                 │
│                                                         │
│ Você precisa:                                           │
│   ✅ Apenas um módulo novo                              │
│   ✅ Integrar ao existente                              │
│                                                         │
│ Ferramenta: Template Generator                          │
│ ✅ Gera apenas o necessário                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Como Identificar Qual Cenário

### Perguntas para Identificar

1. **Você tem Terraform já configurado?**
   - ✅ Sim → **Scenario 2**: Use Template Generator
   - ❌ Não → Continue para próxima pergunta

2. **Você tem uma aplicação rodando?**
   - ✅ Sim → **Scenario 1**: Use Blueprint Repository
   - ❌ Não → Você está criando do zero (também Scenario 1)

### Fluxo de Decisão

```
Você precisa de infraestrutura
  │
  ├─ Você tem Terraform existente?
  │   └─ SIM → Scenario 2: Existing Terraform, Add Capability
  │       └─ Use Template Generator
  │       └─ Gera snippet em 2 min
  │
  └─ Você tem app mas sem Terraform?
      └─ SIM → Scenario 1: App Exists, Needs Infrastructure
          └─ Use Blueprint Repository
          └─ Recebe estrutura completa em 5-10 min
```

---

## 💡 Por Que Template Generator Não Funciona para Scenario 1?

### Limitações do Template Generator

1. **Gera snippets individuais**
   - Template Generator gera um snippet por vez (ex: apenas `rds-module`)
   - Para Scenario 1, você precisaria gerar múltiplos snippets:
     - `rds-module`
     - `api-module`
     - `lambda-module`
     - `ephemeral-password`
     - etc.

2. **Não gera estrutura de diretórios**
   - Template Generator retorna código, não cria:
     - `modules/api/`
     - `modules/data/`
     - `environments/dev/`

3. **Não gera arquivos de composição**
   - Template Generator não cria:
     - `environments/dev/main.tf` (que chama os módulos)
     - `environments/dev/variables.tf`
     - `environments/dev/outputs.tf`
     - `environments/dev/terraform.tfvars`

4. **Não gera documentação**
   - Template Generator não cria README.md, exemplos, etc.

### O Que Blueprint Repository Fornece

- ✅ Estrutura completa de diretórios
- ✅ Todos os módulos já integrados
- ✅ Arquivos de composição (`environments/dev/main.tf`)
- ✅ Variáveis, outputs, configurações
- ✅ Documentação completa
- ✅ Tudo pronto para copiar e usar

---

## 📈 Economia de Tempo

| Cenário | Sem Sistema | Com Sistema | Economia |
|---------|-------------|-------------|----------|
| **Scenario 2**: Adicionar RDS | 15-30 min | 2 min | 87-93% |
| **Scenario 1**: Deploy de app | 2-4 horas | 5-10 min | 90-95% |

---

## 🔗 Referências

- [Fluxo de Trabalho do Desenvolvedor](./developer-workflow.md) - Guia completo
- [Referência Rápida](./developer-workflow-quick-reference.md) - Guia rápido
- [Template Generator vs Repository](./blueprints/template-generator-vs-repo.md) - Comparação detalhada
- [Workflows](./blueprints/workflows.md) - Workflows passo a passo
