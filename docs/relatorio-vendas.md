# Contrato HTTP: Relatório de Vendas

## 1. Objetivo

Disponibilizar um endpoint HTTP GET para consultar um relatório consolidado das vendas armazenadas no PostgreSQL.

O relatório apresentará a quantidade de vendas registradas e o valor bruto total.

## 2. Endpoint

**GET /reports/sales**

O endpoint retornará um relatório consolidado em formato JSON.

### Exemplo de requisição

```http
GET /reports/sales
```

### Exemplo de resposta HTTP 200

```json
{
  "currency": "BRL",
  "salesCount": 2,
  "grossAmountCents": 29980
}
```

### Descrição dos campos

| Campo            | Tipo   | Descrição                           |
| ---------------- | ------ | ----------------------------------- |
| currency         | string | Moeda utilizada, inicialmente BRL   |
| salesCount       | number | Quantidade de vendas registradas    |
| grossAmountCents | number | Soma dos valores brutos em centavos |

O valor `grossAmountCents` representa o faturamento bruto.

## 3. Filtros por período

O endpoint aceitará dois parâmetros opcionais de consulta:

| Parâmetro | Tipo   | Descrição                                |
| --------- | ------ | ---------------------------------------- |
| from      | string | Data inicial, formato YYYY-MM-DD         |
| to        | string | Data final exclusiva, formato YYYY-MM-DD |

### Exemplo

```http
GET /reports/sales?from=2026-10-01&to=2026-11-01
```

Esse exemplo consulta as vendas realizadas durante outubro de 2026.

### Regras dos filtros

- Os filtros utilizarão a coluna `pago_em` da tabela `vendas`.
- As datas serão interpretadas em UTC, a partir de 00:00:00.
- `from` será inclusivo.
- `to` será exclusivo.
- Ambos os parâmetros serão opcionais.
- Sem filtros, serão consideradas todas as vendas registradas.
- Datas inválidas ou um período em que `from` seja maior ou igual a `to` retornarão HTTP 400.
- Datas deverão existir no calendário, sem aceitar ajustes automáticos de datas inválidas.

## 4. Regras de consolidação

O relatório será calculado diretamente sobre os registros persistidos na tabela `vendas`.

### Quantidade de vendas

Utilizar a contagem dos registros que atendem aos filtros.

### Valor bruto

Utilizar a soma da coluna `valor_centavos`.

### Idempotência

Notificações duplicadas não deverão aumentar a quantidade de vendas nem o faturamento bruto.

### Integridade numérica

As agregações serão realizadas no PostgreSQL, sem utilização de números de ponto flutuante para somar valores monetários.

A aplicação deverá converter os resultados com segurança antes de retorná-los como números JSON, evitando perda de precisão.

## 5. Relatório sem vendas

Quando nenhuma venda atender aos filtros, o endpoint retornará HTTP 200 com os totais zerados.

```json
{
  "currency": "BRL",
  "salesCount": 0,
  "grossAmountCents": 0
}
```

Uma consulta sem resultados não será considerada erro.

## 6. Tratamento de erros

### HTTP 400: filtros inválidos

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid report filters"
}
```

### HTTP 503: banco de dados indisponível

```json
{
  "error": "SERVICE_UNAVAILABLE",
  "message": "Unable to generate sales report"
}
```

## 7. Decisões e limitações

- O relatório utilizará apenas dados persistidos no PostgreSQL.
- A moeda será exclusivamente BRL.
- Não haverá paginação, pois o endpoint retornará dados agregados.
- Não haverá agrupamento por produtos ou clientes.
- Não haverá cálculo de lucro ou receita líquida.
- Não haverá dashboard.
- O relatório não terá autenticação nesta versão demonstrativa. Portanto, os totais ficarão publicamente acessíveis, uma limitação de segurança que deverá ser corrigida em uma aplicação real.
