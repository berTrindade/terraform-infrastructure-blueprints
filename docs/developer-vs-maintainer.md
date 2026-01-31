# Desenvolvedor vs Mantenedor

Separação clara de responsabilidades entre desenvolvedores (usuários finais) e mantenedores do repositório de blueprints.

## 🎯 Desenvolvedores (Usuários Finais)

### O Que Fazem

- ✅ **Usam blueprints existentes** através de AI Assistants
- ✅ **Recebem código gerado** pelo Template Generator
- ✅ **Copiam código** mostrado pelo AI Assistant
- ✅ **Aplicam código** em seus projetos
- ✅ **Adaptam valores** (nomes, tags, etc.)

### O Que NÃO Fazem

- ❌ **NÃO acessam** o repositório de blueprints
- ❌ **NÃO criam** novos blueprints
- ❌ **NÃO modificam** blueprints existentes
- ❌ **NÃO criam** manifests ou templates
- ❌ **NÃO conhecem** estrutura interna do repositório

### Ferramentas que Usam

1. **AI Assistant** (Cursor, Claude Code, etc.)
   - Usa skills: `blueprint-guidance`, `blueprint-catalog`, `blueprint-patterns`
   - Usa MCP tools: `recommend_blueprint()`, `search_blueprints()`, etc.
   - Usa Template Generator skill para gerar código

2. **Código gerado/copiado**
   - Recebe código Terraform pronto
   - Aplica em seus projetos
   - Adapta conforme necessário

### Fluxo Típico

```
Desenvolvedor: "Preciso adicionar RDS ao meu projeto"
  ↓
AI Assistant: 
  - Identifica blueprint
  - Gera código via Template Generator
  - Retorna código pronto
  ↓
Desenvolvedor:
  - Copia código
  - Aplica
  - Testa
```

**Tempo**: 2 minutos  
**Acesso ao repo**: Nenhum

---

## 🔧 Mantenedores (Repositório)

### O Que Fazem

- ✅ **Criam novos blueprints** no repositório
- ✅ **Mantêm blueprints existentes** (atualizam código)
- ✅ **Criam manifests** YAML
- ✅ **Criam templates** parametrizados
- ✅ **Testam geração** de código
- ✅ **Documentam** blueprints
- ✅ **Acessam repositório** diretamente

### Ferramentas que Usam

1. **Repositório diretamente**
   - Acessa `aws/{blueprint-name}/`
   - Edita código Terraform
   - Cria/modifica arquivos

2. **Manifests e Templates**
   - Cria `blueprints/manifests/{blueprint}.yaml`
   - Cria `skills/blueprint-template-generator/templates/*.tf.template`
   - Testa geração localmente

3. **Git e CI/CD**
   - Commita mudanças
   - Cria PRs
   - Atualiza documentação

### Fluxo Típico

```
Mantenedor: "Preciso criar blueprint para API Gateway + Step Functions"
  ↓
Mantenedor:
  - Acessa repositório
  - Estuda blueprints similares
  - Escreve código Terraform
  - Cria manifest YAML
  - Cria templates
  - Testa geração
  - Commita e faz PR
  ↓
Blueprints disponíveis para desenvolvedores via AI Assistants
```

**Tempo**: 2-4 horas  
**Acesso ao repo**: Direto

---

## 📊 Comparação Visual

| Aspecto | Desenvolvedor | Mantenedor |
|---------|---------------|------------|
| **Acesso ao repo** | ❌ Não | ✅ Sim |
| **Cria blueprints** | ❌ Não | ✅ Sim |
| **Usa blueprints** | ✅ Sim (via AI) | ✅ Sim |
| **Cria manifests** | ❌ Não | ✅ Sim |
| **Cria templates** | ❌ Não | ✅ Sim |
| **Gera código** | ✅ Sim (recebe) | ✅ Sim (testa) |
| **Modifica blueprints** | ❌ Não | ✅ Sim |
| **Ferramenta principal** | AI Assistant | Repositório + Git |

---

## 🔄 Fluxo Completo: Do Mantenedor ao Desenvolvedor

```
┌─────────────────────────────────────────────────────────┐
│ FASE 1: MANTENEDOR CRIA BLUEPRINT                        │
└─────────────────────────────────────────────────────────┘

Mantenedor:
  1. Acessa repositório
  2. Cria aws/apigw-stepfunctions-lambda-dynamodb/
  3. Escreve código Terraform
  4. Cria manifest YAML
  5. Cria templates
  6. Testa e commita
  7. Faz PR e merge


┌─────────────────────────────────────────────────────────┐
│ FASE 2: BLUEPRINT DISPONÍVEL                            │
└─────────────────────────────────────────────────────────┘

Sistema:
  - Blueprint no repositório
  - Manifest disponível
  - Templates disponíveis
  - MCP server descobre automaticamente
  - Skills podem usar


┌─────────────────────────────────────────────────────────┐
│ FASE 3: DESENVOLVEDOR USA                                │
└─────────────────────────────────────────────────────────┘

Desenvolvedor:
  - Pergunta ao AI: "Preciso de API Gateway + Step Functions"
  - AI usa MCP tools para descobrir blueprint
  - AI gera código via Template Generator
  - Desenvolvedor recebe código pronto
  - Aplica em seu projeto

⚠️ Desenvolvedor nunca acessa o repositório
```

---

## 🎓 Exemplos Práticos

### Exemplo 1: Desenvolvedor Adiciona RDS

**Desenvolvedor**:
```
"Preciso adicionar RDS PostgreSQL ao meu projeto Lambda"
```

**AI Assistant** (faz tudo internamente):
- Lê manifest do repo (desenvolvedor não vê)
- Gera código via Template Generator
- Retorna código pronto

**Desenvolvedor**:
- Recebe código
- Copia para projeto
- Aplica

**Acesso ao repo**: Nenhum ✅

---

### Exemplo 2: Mantenedor Cria Blueprint

**Mantenedor**:
```
"Preciso criar blueprint para API Gateway + Step Functions"
```

**Mantenedor**:
- Acessa repositório diretamente
- Estuda blueprints similares
- Escreve código Terraform
- Cria manifest
- Cria templates
- Testa
- Commita

**Acesso ao repo**: Direto ✅

---

## 🚫 O Que Desenvolvedores NÃO Fazem

### ❌ Acesso Direto ao Repositório

```bash
# Desenvolvedor NÃO faz isso:
cd terraform-infrastructure-blueprints/
ls aws/apigw-lambda-rds/
cat blueprints/manifests/apigw-lambda-rds.yaml
```

### ❌ Criar Blueprints

```bash
# Desenvolvedor NÃO faz isso:
mkdir aws/my-new-blueprint/
vim aws/my-new-blueprint/modules/data/main.tf
```

### ❌ Modificar Manifests

```bash
# Desenvolvedor NÃO faz isso:
vim blueprints/manifests/apigw-lambda-rds.yaml
```

### ❌ Criar Templates

```bash
# Desenvolvedor NÃO faz isso:
vim skills/blueprint-template-generator/templates/my-template.tf.template
```

---

## ✅ O Que Desenvolvedores Fazem

### ✅ Usar AI Assistant

```
"Preciso adicionar RDS ao meu projeto"
```

### ✅ Receber Código Gerado

```hcl
# Código recebido do AI Assistant
resource "aws_db_instance" "this" {
  identifier = "myapp-dev-db"
  # ... código completo ...
}
```

### ✅ Aplicar em Projetos

```bash
# Desenvolvedor faz isso:
cd my-project/
vim modules/data/main.tf  # Cola código gerado
terraform apply
```

---

## 📋 Checklist: Sou Desenvolvedor ou Mantenedor?

### Você é **Desenvolvedor** se:

- [ ] Usa blueprints em projetos de clientes
- [ ] Recebe código gerado pelo AI Assistant
- [ ] Não acessa repositório de blueprints
- [ ] Foca em aplicar código em projetos
- [ ] Usa AI Assistants (Cursor, Claude Code, etc.)

### Você é **Mantenedor** se:

- [ ] Cria novos blueprints
- [ ] Mantém blueprints existentes
- [ ] Acessa repositório diretamente
- [ ] Cria manifests e templates
- [ ] Faz PRs no repositório de blueprints

---

## 🎯 Princípio Fundamental

> **Desenvolvedores usam blueprints. Mantenedores criam blueprints.**
>
> O repositório de blueprints é uma **biblioteca interna** mantida por mantenedores. Desenvolvedores acessam essa biblioteca **apenas através de AI Assistants**, nunca diretamente.

---

## 🔗 Referências

- [Fluxo de Trabalho do Desenvolvedor](./developer-workflow.md)
- [Como Manifests Funcionam](./how-manifests-work-with-blueprints.md)
- [Template Generator vs Repository](./blueprints/template-generator-vs-repo.md)
