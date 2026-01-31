# Fluxo de Trabalho do Desenvolvedor

Guia prático de como desenvolvedores trabalham com blueprints através de AI Assistants.

> **Importante**: Desenvolvedores **não acessam o repositório de blueprints diretamente**. Eles usam AI Assistants que interagem com MCP tools e Template Generator. Apenas **mantenedores** criam e mantêm blueprints, manifests e templates no repositório.

## Cenários de Uso

### Cenário 1: Adicionar Capacidade a Projeto Existente

**Situação**: Você tem um projeto Lambda e precisa adicionar RDS PostgreSQL.

#### Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DESCOBERTA (AI Assistant)                                │
└─────────────────────────────────────────────────────────────┘

Você: "Preciso adicionar RDS PostgreSQL ao meu projeto"

AI Assistant:
  ✅ Identifica intent: "adicionar capacidade"
  ✅ Usa skill blueprint-template-generator
  ✅ Internamente lê manifest (você não vê isso)
  ✅ Identifica snippet: "rds-module"


┌─────────────────────────────────────────────────────────────┐
│ 2. EXTRAÇÃO DE PARÂMETROS (AI Assistant)                    │
└─────────────────────────────────────────────────────────────┘

AI Assistant analisa histórico da conversa:
  - Projeto: "myapp"
  - Ambiente: "dev"
  - VPC: "vpc-123456"
  - Subnet group: "myapp-dev-db-subnets"
  - Security group: "sg-123456"


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

### Cenário 2: Criar Novo Projeto do Zero

**Situação**: Você precisa criar uma nova API serverless com PostgreSQL.

#### Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DESCOBERTA (AI Assistant)                                │
└─────────────────────────────────────────────────────────────┘

Você: "Preciso de uma API serverless com PostgreSQL"

AI Assistant:
  ✅ Usa MCP tool: recommend_blueprint()
  ✅ Recomenda: "apigw-lambda-rds"
  ✅ Explica por quê: "Serverless REST API with PostgreSQL"


┌─────────────────────────────────────────────────────────────┐
│ 2. ESTUDO DO BLUEPRINT (AI Assistant)                       │
└─────────────────────────────────────────────────────────────┘

AI Assistant usa MCP tools internamente:
  - fetch_blueprint_file() busca arquivos do repo (você não acessa)
  - Mostra estrutura e código para você
  - Você recebe código já extraído


┌─────────────────────────────────────────────────────────────┐
│ 3. VOCÊ RECEBE CÓDIGO                                       │
└─────────────────────────────────────────────────────────────┘

AI Assistant mostra:
  ✅ Estrutura do blueprint
  ✅ Código dos módulos principais
  ✅ Instruções de como usar

Você:
  ✅ Copia código mostrado pelo AI
  ✅ Adapta valores (nomes, tags, etc.)
  ✅ Aplica com terraform apply

⚠️ Você NÃO acessa o repositório diretamente - AI faz isso por você
```

**Tempo total**: ~5 minutos (vs horas criando do zero)

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

### Use Template Generator quando

- ✅ Adicionar capacidade a projeto existente
- ✅ Gerar snippet específico
- ✅ Precisa de código já adaptado
- ✅ Quer economizar tokens

**Exemplo**: "Adicionar RDS ao meu projeto Lambda"

### Use Blueprint Repository (MCP) quando

- ✅ Criar novo projeto do zero
- ✅ Estudar como blueprint funciona
- ✅ Copiar blueprint completo
- ✅ Entender padrões complexos

**Exemplo**: "Preciso de uma API serverless com PostgreSQL"

### Use Código Direto quando (Apenas Mantenedores)

- ✅ Criar novo blueprint
- ✅ Modificar blueprint existente
- ✅ Criar templates
- ✅ Manter código de produção

**Exemplo**: "Vou criar um novo padrão arquitetural"

> **Nota**: Desenvolvedores não criam blueprints. Eles usam blueprints existentes através de AI Assistants.

## Exemplo Prático Completo

### Situação: Adicionar RDS a Projeto Existente

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
| Adicionar RDS | 15-30 min | 2 min | 87-93% |
| Criar novo projeto | 2-4 horas | 5-10 min | 90-95% |
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
