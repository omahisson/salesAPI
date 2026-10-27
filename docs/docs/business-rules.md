# Regras de Negócio: Processamento de Vendas

## 1. Objetivo

Garantir que notificações de vendas sejam processadas de forma consistente, sem contabilização duplicada, inclusive sob requisições concorrentes.

## 2. Identificação das vendas

Cada venda será identificada pela combinação:

`platform + saleId`

Essa combinação deverá ser única no banco de dados.

Exemplo:

- `hotmart + SALE-123`: primeira venda.
- `hotmart + SALE-123`: mesma venda.
- `kiwify + SALE-123`: venda diferente.

A identificação não depende apenas de `saleId`, pois plataformas distintas podem gerar identificadores iguais.

## 3. Normalização

Antes da persistência:

- `platform`: remover espaços nas extremidades e converter para letras minúsculas.
- `saleId`: remover espaços nas extremidades, preservando a distinção entre maiúsculas e minúsculas.
- `paidAt`: converter para um instante de tempo UTC para comparação e persistência.
- `amountCents`: validar como inteiro positivo e seguro em JavaScript.

As validações completas seguem o documento `docs/webhook-contract.md`.

## 4. Processamento de vendas

### Cenário A: venda inédita

Quando a combinação `platform + saleId` não existir:

1. Validar a notificação.
2. Registrar a venda no PostgreSQL.
3. Confirmar a persistência.
4. Retornar HTTP 201.

A resposta de sucesso somente será enviada após a confirmação da gravação.

### Cenário B: notificação duplicada

Quando uma venda já existir com os mesmos dados de negócio:

1. Identificar o registro existente.
2. Comparar `amountCents`, `currency` e `paidAt`.
3. Não realizar uma segunda contabilização.
4. Retornar HTTP 200.

Esse comportamento permite que plataformas reenviem notificações sem duplicar o faturamento.

### Cenário C: dados conflitantes

Quando uma venda já existir com a mesma identificação, mas dados de negócio diferentes:

1. Identificar o registro existente.
2. Detectar a divergência.
3. Preservar os dados originais.
4. Retornar HTTP 409.

O serviço não fará atualizações automáticas de vendas existentes.

## 5. Concorrência e consistência

A tabela `sales` possuirá uma restrição:

`UNIQUE(platform, sale_id)`

A implementação utilizará uma tentativa de inserção atômica no banco de dados, com tratamento de conflito de unicidade.

Estratégia planejada:

1. Tentar inserir a venda usando `INSERT ... ON CONFLICT DO NOTHING RETURNING`.
2. Se o banco retornar o registro inserido, responder 201.
3. Caso não haja inserção, consultar o registro já existente.
4. Comparar os dados persistidos com os recebidos.
5. Retornar 200 para duplicata idêntica ou 409 para conflito.

A consulta após a tentativa de inserção será feita como uma nova instrução SQL, permitindo observar a transação concorrente já confirmada sob o isolamento padrão READ COMMITTED do PostgreSQL.

Esse comportamento pressupõe que os registros de vendas não sejam excluídos durante o processamento.

## 6. Falhas de persistência

Se o PostgreSQL estiver indisponível:

- O serviço não deve confirmar que a venda foi registrada.
- Deve retornar HTTP 503 quando a falha representar indisponibilidade da persistência.
- A plataforma poderá tentar reenviar a notificação posteriormente.

Uma falha após uma gravação confirmada, mas antes da entrega da resposta HTTP, também pode provocar um reenvio. A idempotência permitirá reconhecer a venda já persistida.

## 7. Regras dos relatórios

- Apenas vendas persistidas serão contabilizadas.
- Notificações duplicadas não aumentarão a quantidade de vendas.
- O valor bruto será calculado pela soma de `amountCents`.
- Os filtros por período utilizarão a data `paidAt`.
- Não serão descontadas taxas, impostos ou reembolsos.
- O serviço trabalhará inicialmente apenas com BRL.

## 8. Limitações conhecidas

- Não haverá processamento de reembolsos, chargebacks ou cancelamentos.
- Não haverá autenticação da origem dos webhooks neste MVP.
- Não serão utilizadas filas de mensagens.
- Não serão realizadas atualizações automáticas de vendas.
- Não haverá garantia de entrega exatamente uma vez pela rede; a garantia buscada é impedir a duplicação dos registros persistidos.

## 9. Justificativa técnica

A idempotência será garantida principalmente por uma restrição de unicidade no PostgreSQL, e não por verificações em memória.

Essa decisão oferece proteção contra concorrência e mantém o comportamento consistente mesmo quando a aplicação recebe múltiplas requisições para a mesma venda.
