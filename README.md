# Sales Postback API

API REST desenvolvida em TypeScript para receber notificações de vendas via webhook, persistir os dados e disponibilizar relatórios consolidados.

## Tecnologias

- Node.js 22
- TypeScript
- Fastify
- PostgreSQL
- Zod
- Vitest

## Aplicação publicada

**URL:** [https://salesapi-twr.duckdns.org](https://salesapi-twr.duckdns.org)

**Health Check:** [https://salesapi-twr.duckdns.org/health](https://salesapi-twr.duckdns.org/health)

**Relatório:** [https://salesapi-twr.duckdns.org/reports/sales](https://salesapi-twr.duckdns.org/reports/sales)

## Como utilizar

### Registrar uma venda

**POST /webhooks/sales**

Exemplo usando curl em Linux ou macOS:

```bash
curl -i -X POST \
  https://salesapi-twr.duckdns.org/webhooks/sales \
  -H "Content-Type: application/json" \
  --data '{"platform":"demo","saleId":"EXEMPLO-001","amountCents":14990,"currency":"BRL","paidAt":"2026-10-27T14:30:00Z"}'
```

Uma venda inédita retorna HTTP 201:

```json
{
  "status": "created",
  "saleId": "EXEMPLO-001"
}
```

O reenvio da mesma venda com os mesmos dados retorna HTTP 200, sem duplicar o registro.

Se o mesmo identificador apresentar dados divergentes, a API retorna HTTP 409.

### Consultar o relatório

**GET /reports/sales**

```bash
curl https://salesapi-twr.duckdns.org/reports/sales
```

Exemplo de resposta:

```json
{
  "currency": "BRL",
  "salesCount": 1,
  "grossAmountCents": 14990
}
```

Os valores retornados são calculados a partir das vendas já persistidas, portanto os resultados variam conforme os registros existentes.

### Filtrar por período

```bash
curl "https://salesapi-twr.duckdns.org/reports/sales?from=2026-10-01&to=2026-11-01"
```

O período é interpretado em UTC. A data inicial é inclusiva e a final é exclusiva.

## Como executar localmente

Requisitos: Node.js 22 ou superior e PostgreSQL compatível.

```bash
git clone https://github.com/omahisson/salesAPI.git
cd salesAPI
npm ci
```

Crie um arquivo `.env` a partir de `.env.example` e configure:

```dotenv
PORT=3000
DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
```

Execute a migration `migrations/001_criar_vendas.sql` no PostgreSQL antes de iniciar a aplicação.

Para executar em desenvolvimento:

```bash
npm run dev
```

Para compilar e iniciar:

```bash
npm run build
npm start
```

Para executar os testes:

```bash
npm test
```

## Premissas e decisões técnicas

- Cada webhook representa uma venda com pagamento confirmado.
- Apenas BRL é aceito nesta versão.
- Valores monetários são armazenados como inteiros em centavos.
- A identificação da venda utiliza a combinação `platform + saleId`.
- A restrição `UNIQUE(plataforma, id_venda)` garante a unicidade no PostgreSQL, inclusive sob inserções concorrentes.
- Notificações idênticas repetidas não geram novos registros.
- Notificações conflitantes não sobrescrevem os dados existentes.
- A aplicação utiliza SQL parametrizado através da biblioteca `pg`.
- Relatórios são calculados diretamente no PostgreSQL.
- A arquitetura separa rotas, validações, serviços e persistência.
- O serviço é executado em uma VPS Debian, gerenciado por systemd, com Nginx como proxy reverso e HTTPS.

## O que não foi implementado

- Integração com formatos específicos de plataformas de checkout.
- Verificação de assinaturas ou autenticação da origem dos webhooks.
- Autenticação para consultar os relatórios.
- Estornos, cancelamentos e chargebacks.
- Suporte a múltiplas moedas.
- Filas de mensagens, microsserviços ou cache distribuído.
- Interface gráfica.

Essas funcionalidades foram deixadas fora do escopo para priorizar a confiabilidade do recebimento, da persistência e da consolidação das vendas.

**Limitação de segurança:** os endpoints são públicos, sem autenticação. A aplicação é demonstrativa.

## Testes e documentação

O projeto inclui testes automatizados de validação e foi verificado manualmente quanto ao recebimento, à duplicidade, aos conflitos e à geração de relatórios com PostgreSQL.

Documentação complementar disponível na pasta `docs/`.
