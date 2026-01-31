# Fluxo de Trabalho do Desenvolvedor - Referência Rápida

> **Importante**: Desenvolvedores **não acessam o repositório de blueprints**. Eles usam AI Assistants que interagem com o repositório internamente. Apenas **mantenedores** criam e mantêm blueprints no repositório.

## 🎯 Dois Cenários Principais (Desenvolvedores)

### 1️⃣ Adicionar Capacidade (Mais Comum)

```
Você: "Preciso adicionar RDS ao meu projeto"
  ↓
AI: Identifica blueprint → Extrai parâmetros → Gera código
  ↓
Você: Copia código → Aplica → Testa
```

**Tempo**: 2 minutos  
**Ferramenta**: Template Generator  
**Resultado**: Código Terraform gerado automaticamente

---

### 2️⃣ Criar Novo Projeto

```
Você: "Preciso de uma API serverless com PostgreSQL"
  ↓
AI: Recomenda blueprint → Mostra estrutura
  ↓
Você: Copia blueprint completo → Adapta → Aplica
```

**Tempo**: 5-10 minutos  
**Ferramenta**: Blueprint Repository (MCP)  
**Resultado**: Projeto completo copiado

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
"Preciso adicionar RDS PostgreSQL ao meu projeto Lambda"

┌─────────────────────────────────────────────────────────┐
│ PASSO 2: AI identifica                                  │
└─────────────────────────────────────────────────────────┘
✅ Intent: "adicionar capacidade"
✅ Blueprint: apigw-lambda-rds
✅ Snippet: rds-module
✅ Skill: blueprint-template-generator

┌─────────────────────────────────────────────────────────┐
│ PASSO 3: AI extrai parâmetros do histórico              │
└─────────────────────────────────────────────────────────┘
- Projeto: "myapp"
- Ambiente: "dev"
- VPC: "vpc-123456"
- Subnet group: "myapp-dev-db-subnets"
- Security group: "sg-123456"

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
  ├─ Adicionar ao projeto existente?
  │   └─ SIM → AI usa Template Generator
  │       └─ Você recebe código em 2 min
  │
  ├─ Criar novo projeto?
  │   └─ SIM → AI usa Blueprint Repository
  │       └─ Você recebe código em 5-10 min
  │
  └─ Padrão não existe?
      └─ SIM → Solicita a mantenedor
          └─ Mantenedor cria blueprint (2-4 horas)
          └─ Blueprint disponível para todos
```

---

## 💡 Dicas Práticas

### Para Adicionar Capacidade

1. **Seja específico**: "Adicionar RDS PostgreSQL" vs "Preciso de banco"
2. **Mencione contexto**: "Ao meu projeto Lambda existente"
3. **Forneça parâmetros**: Nomes, VPC, security groups (se souber)

### Para Criar Projeto

1. **Descreva requisitos**: "API serverless com PostgreSQL"
2. **Mencione padrão**: "Sync" ou "Async"
3. **Pergunte sobre opções**: AI pode recomendar alternativas

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

**Q: Quando usar Template Generator vs copiar blueprint?**  
A: Template Generator para adicionar capacidade. Copiar para novo projeto.

**Q: Como adicionar novo blueprint?**  
A: Desenvolvedores não adicionam. Solicite a mantenedor que cria no repositório.

**Q: Preciso acessar o repositório?**  
A: Não. Desenvolvedores usam AI Assistants. Apenas mantenedores acessam o repo.

**Q: Qual a diferença entre desenvolvedor e mantenedor?**  
A: Desenvolvedores usam blueprints via AI. Mantenedores criam/manuten blueprints no repo.
