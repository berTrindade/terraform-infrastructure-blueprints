# Evolução do Sistema de Manifests - Inspirado no Backstage

## Visão do Felipe

> "No primeiro cenário, o fetch funciona como se a LLM estivesse consultando um manual de boas práticas da empresa para desenhar a solução ideal. Já no segundo, a skill vira uma linha de montagem técnica que só entrega a peça pronta, economizando um tempo enorme de processamento. Essa ideia do manifesto YAML é o caminho para deixar tudo escalável. Se você seguir essa lógica de ter um arquivo de configuração em cada blueprint, sua skill fica agnóstica e você consegue plugar novos padrões sem precisar mexer na inteligência da ferramenta o tempo todo. É basicamente o que o backstage faz"

## Comparação: Antes vs Depois

### ❌ Sistema Atual (Duplicação)

```
┌─────────────────────────────────────────────────────────┐
│  Blueprint: apigw-lambda-rds                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📄 mcp/src/config/constants.ts                         │
│     └─ BLUEPRINTS array (hardcoded)                      │
│                                                          │
│  📄 skills/blueprint-catalog/SKILL.md                    │
│     └─ Catalog table (static markdown)                   │
│                                                          │
│  📄 blueprints/manifests/apigw-lambda-rds.yaml          │
│     └─ Snippets only (for templates)                    │
│                                                          │
│  ⚠️  Informação duplicada em 3 lugares                  │
│  ⚠️  Adicionar blueprint = editar 3 arquivos            │
│  ⚠️  Skill conhece blueprints específicos               │
└─────────────────────────────────────────────────────────┘
```

### ✅ Sistema Proposto (Single Source of Truth)

```
┌─────────────────────────────────────────────────────────┐
│  Blueprint: apigw-lambda-rds                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📄 blueprints/manifests/apigw-lambda-rds.yaml          │
│     ├─ metadata (name, description, tags, cloud)       │
│     ├─ spec (database, pattern, components)             │
│     ├─ decision (when/not_when)                         │
│     ├─ equivalents (cross-cloud mappings)              │
│     └─ snippets (templates)                             │
│                                                          │
│  🔄 MCP Server                                           │
│     └─ Lê manifests dinamicamente                       │
│                                                          │
│  🔄 Skills                                               │
│     └─ Referenciam manifest structure                    │
│                                                          │
│  ✅ Single source of truth                               │
│  ✅ Adicionar blueprint = criar 1 arquivo              │
│  ✅ Skill completamente agnóstica                        │
└─────────────────────────────────────────────────────────┘
```

## Estrutura do Manifesto Evoluído

```yaml
apiVersion: blueprint.ustwo.io/v1
kind: Blueprint

metadata:
  name: apigw-lambda-rds
  title: Serverless REST API with RDS PostgreSQL
  description: Production-tested serverless API pattern...
  tags: [serverless, api, postgresql, sync, aws]
  cloud: aws
  origin: "NBCU Loyalty Build (Backlot) - ustwo, 2025"

spec:
  database: postgresql
  pattern: sync
  components: [api-gateway, lambda, rds, vpc]
  
  decision:
    when: ["Need serverless API", "Need relational DB"]
    not_when: ["Need GraphQL", "Need NoSQL"]
  
  equivalents:
    azure: functions-postgresql
    gcp: appengine-cloudsql-strapi
  
  snippets:
    - id: rds-module
      name: RDS PostgreSQL Module
      template: rds-module.tf.template
      variables: [...]
```

## Benefícios

### 1. Escalabilidade
- **Adicionar blueprint**: Criar 1 arquivo YAML
- **Atualizar info**: Editar 1 arquivo, todos os sistemas atualizam
- **Remover blueprint**: Deletar 1 arquivo

### 2. Agnosticismo
- **Skill não conhece blueprints**: Só conhece estrutura de manifest
- **MCP não tem hardcode**: Descobre blueprints dinamicamente
- **Fácil extensão**: Adicionar campos sem quebrar código existente

### 3. Consistência
- **Single source of truth**: Tudo em manifests
- **Sem duplicação**: Catalog, MCP, skills leem mesma fonte
- **Versionamento**: Mudanças rastreadas no git

## Comparação com Backstage

| Aspecto | Backstage | Nosso Sistema |
|---------|-----------|---------------|
| **Arquivo de Metadata** | `catalog-info.yaml` | `blueprints/manifests/{name}.yaml` |
| **Descoberta** | Escaneia arquivos | Escaneia manifests |
| **Single Source** | ✅ Sim | ✅ Sim (após migração) |
| **Dinâmico** | ✅ Sim | ✅ Sim (após migração) |
| **Agnóstico** | ✅ Sim | ✅ Sim (após migração) |

## Próximos Passos

1. ✅ **ADR criado**: `docs/adr/0008-backstage-inspired-manifest-evolution.md`
2. ✅ **Exemplo criado**: `blueprints/manifests/apigw-lambda-rds.evolved.yaml`
3. ⏳ **Criar schema JSON** para validação
4. ⏳ **Migrar 1 blueprint** como POC
5. ⏳ **Atualizar MCP server** para ler manifests
6. ⏳ **Atualizar skills** para referenciar manifests
7. ⏳ **Migrar blueprints restantes**

## Referências

- [ADR 0008: Backstage-Inspired Manifest Evolution](./adr/0008-backstage-inspired-manifest-evolution.md)
- [ADR 0007: Manifest-Based Template Generation](./adr/0007-manifest-based-template-generation.md)
- [Backstage Catalog Model](https://backstage.io/docs/features/software-catalog/descriptor-format/)
- [Exemplo de Manifesto Evoluído](../blueprints/manifests/apigw-lambda-rds.evolved.yaml)
