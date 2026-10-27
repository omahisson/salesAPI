# Contrato HTTP: Webhook de Vendas

## 1. Objetivo

Definir o contrato de entrada, as validações e as respostas HTTP para o recebimento de notificações de vendas.

O endpoint deve permitir o processamento seguro de notificações repetidas, evitando a contabilização duplicada de vendas.

## 2. Endpoint

**POST /webhooks/sales**

Content-Type: `application/json`

### Exemplo de requisição

```json
{
  "platform": "hotmart",
  "saleId": "SALE-123",
  "amountCents": 14990,
  "currency": "BRL",
  "paidAt": "2026-10-27T14:30:00Z"
}
```

## 3. Campos obrigatórios

| Campo       | Tipo   | Validação                                 |
| ----------- | ------ | ----------------------------------------- |
| platform    | string | Obrigatório, 1 a 50 caracteres            |
| saleId      | string | Obrigatório, 1 a 100 caracteres           |
| amountCents | number | Inteiro positivo                          |
| currency    | string | Deve ser BRL                              |
| paidAt      | string | Data ISO 8601 válida, em UTC com sufixo Z |

Regras adicionais:

- Todos os campos são obrigatórios.
- Campos desconhecidos serão rejeitados.
- `platform` será normalizado para letras minúsculas, removendo espaços nas extremidades.
- `saleId` terá espaços nas extremidades removidos, mas permanecerá sensível a maiúsculas e minúsculas.
- Valores monetários serão armazenados em centavos.
- Cada notificação representará uma venda com pagamento confirmado.

## 4. Respostas HTTP

### 201 Created: venda registrada

```json
{
  "status": "created",
  "saleId": "SALE-123"
}
```

### 200 OK: webhook duplicado

```json
{
  "status": "already_processed",
  "saleId": "SALE-123"
}
```

### 400 Bad Request: dados inválidos

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid webhook payload"
}
```

### 409 Conflict: venda existente com dados divergentes

```json
{
  "error": "SALE_CONFLICT",
  "message": "Sale already exists with different data"
}
```

### 503 Service Unavailable: persistência indisponível

```json
{
  "error": "SERVICE_UNAVAILABLE",
  "message": "Unable to process webhook"
}
```

## 5. Idempotência

Cada venda será identificada pela combinação:

`platform + saleId`

Comportamento esperado:

1. Venda inexistente: registrar e retornar 201.
2. Venda existente com os mesmos dados: retornar 200, sem duplicar.
3. Venda existente com dados divergentes: retornar 409, sem alterar o registro original.

Para comparar notificações repetidas, serão considerados `amountCents`, `currency` e `paidAt`, após as normalizações estabelecidas.

O PostgreSQL deverá garantir a unicidade de `(plataforma, id_venda)` por meio de uma restrição UNIQUE, inclusive em requisições concorrentes.

## 6. Decisões e limitações

- O contrato utiliza um payload próprio e simplificado, sem integração direta com os formatos específicos de cada checkout.
- A versão inicial aceita exclusivamente vendas pagas em BRL.
- Estornos, cancelamentos e chargebacks não serão processados.
- O MVP não implementará autenticação da origem do webhook. Isso será documentado como uma limitação de segurança, inadequada para uma integração financeira de produção.
- O processamento será síncrono, sem filas ou serviços de mensageria.

Essas decisões priorizam clareza, implementação objetiva e comportamento previsível para o desafio técnico.
