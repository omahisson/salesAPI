# Arquitetura da Aplicação

## 1. Visão geral

A Sales Postback API será desenvolvida em TypeScript com Node.js, utilizando Fastify para a camada HTTP e PostgreSQL para persistência.

A aplicação seguirá uma arquitetura monolítica modular, com responsabilidades separadas entre rotas, serviços e repositórios.

Essa abordagem foi escolhida para manter o projeto simples, testável e adequado ao escopo proposto.

## 2. Tecnologias

| Tecnologia | Finalidade |
|---|---|
| Node.js | Ambiente de execução |
| TypeScript | Tipagem estática |
| Fastify | Servidor HTTP |
| PostgreSQL | Persistência de vendas |
| Zod | Validação de dados |
| pg | Comunicação com PostgreSQL |
| Vitest | Testes automatizados |

Não será utilizado um ORM nesta primeira versão. As consultas SQL serão escritas diretamente, utilizando parâmetros para evitar SQL Injection.

## 3. Estrutura do projeto

```text
src/
├── aplicacao.ts
├── servidor.ts
├── configuracao/
│   └── ambiente.ts
├── banco/
│   └── conexao.ts
└── modulos/
    └── vendas/
        ├── rotas-vendas.ts
        ├── esquemas-vendas.ts
        ├── servico-vendas.ts
        └── repositorio-vendas.ts
```

### aplicacao.ts

Responsável por instanciar o Fastify, registrar os endpoints e configurar o tratamento de erros HTTP.

### servidor.ts

Responsável por inicializar o servidor e disponibilizar a aplicação na porta configurada.

### configuracao/ambiente.ts

Responsável por carregar e validar as variáveis de ambiente necessárias à execução.

### banco/conexao.ts

Responsável por configurar o pool de conexões com o PostgreSQL.

### rotas-vendas.ts

Responsável por disponibilizar os endpoints:

- POST /webhooks/sales
- GET /reports/sales

Também será disponibilizado GET /health para verificação básica de funcionamento do servidor.

### esquemas-vendas.ts

Responsável por definir os esquemas Zod para validação do webhook e dos filtros de relatório.

### servico-vendas.ts

Responsável pela coordenação das regras de negócio, incluindo identificação de duplicatas, conflitos e geração de relatórios.

### repositorio-vendas.ts

Responsável pelas operações de persistência e consulta utilizando SQL parametrizado.

## 4. Fluxo de recebimento do webhook

1. A plataforma envia uma requisição POST.
2. A rota recebe o corpo JSON.
3. O Zod valida e normaliza os dados.
4. O serviço executa a regra de processamento.
5. O repositório tenta inserir a venda no PostgreSQL.
6. Havendo conflito de unicidade, os dados existentes são consultados e comparados.
7. A aplicação retorna o código HTTP adequado.

A identificação das vendas utiliza os campos públicos `platform` e `saleId`, armazenados como `plataforma` e `id_venda`.

## 5. Fluxo de geração de relatórios

1. O cliente envia uma requisição GET.
2. Os filtros opcionais são validados.
3. O serviço solicita os dados consolidados.
4. O repositório executa uma consulta agregada no PostgreSQL.
5. A aplicação retorna quantidade de vendas e valor bruto em centavos.

As agregações serão realizadas diretamente no banco de dados.

## 6. Persistência e idempotência

A tabela `vendas` possuirá uma restrição UNIQUE para `(plataforma, id_venda)`.

Essa restrição garantirá que apenas um registro seja persistido para cada identificador de venda por plataforma, inclusive sob requisições concorrentes.

A aplicação distinguirá notificações repetidas idênticas de notificações com informações conflitantes.

Os detalhes estão documentados em `docs/business-rules.md`.

## 7. Configuração

A aplicação utilizará variáveis de ambiente, incluindo:

- `PORT`: porta de execução HTTP.
- `DATABASE_URL`: endereço de conexão com PostgreSQL.

Credenciais e arquivos `.env` não serão versionados.

O arquivo `.env.example` apresentará apenas valores demonstrativos, sem segredos reais.

## 8. Testes

Os testes serão desenvolvidos com Vitest e organizados no diretório `tests`.

Serão priorizados:

- Validação de dados recebidos.
- Registro de uma venda válida.
- Tratamento de notificações duplicadas.
- Tratamento de identificadores com dados conflitantes.
- Concorrência entre notificações.
- Geração de relatórios.
- Filtros de período inválidos.

Os testes que dependem da persistência deverão utilizar um banco de testes isolado.

## 9. Decisões técnicas

### Arquitetura monolítica

Um único serviço é suficiente para os requisitos apresentados. A divisão em microsserviços aumentaria os custos de desenvolvimento, implantação e manutenção sem benefício relevante neste momento.

### SQL direto

O uso da biblioteca `pg` oferece controle explícito sobre consultas, restrições de unicidade e operações de persistência, sem exigir uma camada ORM.

### Separação de responsabilidades

As rotas não deverão conter consultas SQL ou regras complexas de negócio. Essa separação facilita testes e manutenção.

### Processamento síncrono

As notificações serão processadas durante a requisição HTTP. Não serão utilizadas filas nesta versão.

### Persistência externa

O PostgreSQL permitirá manter os dados mesmo após reinicializações da aplicação.

## 10. Limitações

Esta primeira versão não incluirá:

- Microsserviços.
- Filas de mensagens.
- Cache distribuído.
- Interface gráfica.
- Autenticação de usuários.
- Verificação de assinatura de provedores de checkout.
- Processamento de estornos e chargebacks.

A ausência de autenticação e verificação de origem é uma limitação de segurança do protótipo. Uma integração financeira real exigiria autenticação apropriada, verificação das assinaturas fornecidas pelos provedores e controle de acesso aos relatórios.

Essas decisões foram tomadas para priorizar a implementação, os testes e a disponibilização pública das funcionalidades essenciais.