# Plano de Testes e Tratamento de Erros

## 1. Objetivo

Definir os cenários essenciais para validar o recebimento de vendas, a idempotência, a persistência e a geração dos relatórios.

Os testes serão implementados com Vitest durante o desenvolvimento.

## 2. Tratamento de erros

A API deverá utilizar respostas HTTP consistentes.

| HTTP | Situação |
|---|---|
| 201 | Venda registrada |
| 200 | Webhook já processado ou relatório consultado |
| 400 | Requisição inválida |
| 409 | Venda existente com informações conflitantes |
| 500 | Erro interno inesperado |
| 503 | Banco de dados indisponível |

### Regras gerais

- Erros de validação deverão retornar HTTP 400.
- Notificações duplicadas idênticas não serão tratadas como erro.
- Conflitos de dados deverão retornar HTTP 409.
- Falhas de disponibilidade do PostgreSQL deverão retornar HTTP 503.
- Erros internos inesperados deverão retornar HTTP 500.
- Informações sensíveis, credenciais e detalhes internos do banco não deverão ser expostos nas respostas.
- Erros internos deverão ser registrados nos logs do servidor.

## 3. Testes do webhook

Endpoint: `POST /webhooks/sales`

### Cenário 1: Venda válida

**Dado** um payload válido de uma venda ainda inexistente.

**Quando** a requisição POST for enviada.

**Então:**
- A venda deverá ser persistida.
- O servidor deverá retornar HTTP 201.

### Cenário 2: Notificação duplicada

**Dado** uma venda previamente registrada.

**Quando** a mesma notificação for enviada novamente.

**Então:**
- Nenhum registro adicional deverá ser criado.
- O servidor deverá retornar HTTP 200.

### Cenário 3: Venda com dados conflitantes

**Dado** uma venda previamente registrada.

**Quando** outra notificação utilizar a mesma plataforma e identificador, mas apresentar um valor diferente.

**Então:**
- O registro original deverá ser preservado.
- O servidor deverá retornar HTTP 409.

### Cenário 4: Dados inválidos

Verificar a rejeição de:
- Campos obrigatórios ausentes.
- Valores negativos ou iguais a zero.
- Valores decimais em `amountCents`.
- Valores inteiros fora do limite seguro do JavaScript.
- Datas inválidas.
- Moedas diferentes de BRL.
- Campos desconhecidos.

**Resultado esperado:** HTTP 400, sem persistência da venda.

### Cenário 5: Plataformas diferentes

**Dado** duas vendas com o mesmo identificador externo, mas plataformas distintas.

**Então:** ambas poderão ser registradas.

### Cenário 6: Requisições simultâneas

**Dado** duas requisições simultâneas contendo a mesma venda.

**Então:**
- Apenas um registro deverá ser persistido.
- Uma requisição deverá retornar 201.
- A outra deverá retornar 200, caso os dados sejam idênticos.

O teste deverá utilizar PostgreSQL real para verificar a restrição de unicidade.

## 4. Testes do relatório

Endpoint: `GET /reports/sales`

### Cenário 7: Relatório com vendas

**Dado** um conjunto de vendas registradas.

**Então:**
- A quantidade deverá corresponder ao número de vendas persistidas.
- O valor bruto deverá corresponder à soma de `valor_centavos`.
- O resultado deverá utilizar BRL.

### Cenário 8: Relatório sem vendas

Quando não houver vendas registradas, o servidor deverá retornar HTTP 200 com:

```json
{
  "currency": "BRL",
  "salesCount": 0,
  "grossAmountCents": 0
}
```

### Cenário 9: Filtros por período

Verificar:
- Filtro por data inicial.
- Filtro por data final exclusiva.
- Filtro utilizando ambas as datas.
- Rejeição de datas inválidas.
- Rejeição quando a data inicial for maior ou igual à data final.
- Inclusão de venda exatamente no início do intervalo.
- Exclusão de venda exatamente no fim do intervalo.

Datas e horários serão interpretados em UTC.

## 5. Testes de persistência

### Cenário 10: Reinicialização da aplicação

1. Registrar uma venda.
2. Reiniciar a aplicação.
3. Consultar o relatório.

**Resultado esperado:** a venda deverá continuar armazenada no PostgreSQL.

### Cenário 11: Indisponibilidade do banco

Simular a indisponibilidade do PostgreSQL.

**Resultado esperado:** o servidor deverá retornar HTTP 503 nas operações que dependem da persistência, sem confirmar vendas não gravadas.

## 6. Estratégia de testes

Os testes serão divididos em:

- **Testes de validação:** verificar formatos e regras dos payloads.
- **Testes de integração:** verificar rotas HTTP, consultas SQL e persistência em banco isolado.
- **Testes manuais:** verificar a aplicação publicada por meio de requisições HTTP.

Os testes automatizados utilizarão Vitest.

Os testes de integração deverão usar um banco separado do ambiente de produção.

## 7. Critérios de conclusão

A aplicação será considerada pronta para entrega quando:

- Receber e persistir uma venda válida.
- Evitar registros duplicados.
- Identificar conflitos de dados.
- Rejeitar requisições inválidas.
- Gerar relatórios corretos.
- Manter os dados após reinicializações.
- Possuir testes essenciais executados com sucesso.
- Estiver acessível por uma URL pública.
- Possuir README com instruções, exemplos e decisões técnicas.

## 8. Limitações

Não serão implementados testes de carga em larga escala, testes de infraestrutura distribuída ou integrações completas com plataformas externas.

A prioridade será verificar os requisitos principais e garantir uma entrega funcional, reproduzível e documentada.