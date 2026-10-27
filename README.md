# Sales Postback API

API REST em TypeScript para receber notificações de vendas via webhook e disponibilizar relatórios consolidados.

## Objetivo

Desenvolver um serviço back-end simples e confiável, considerando cenários reais como notificações duplicadas, dados inválidos e falhas de persistência.

## Tecnologias planejadas

- Node.js e TypeScript
- Fastify
- PostgreSQL
- Zod para validação
- Vitest para testes automatizados

## Escopo do MVP

- Receber notificações de vendas via HTTP POST.
- Validar os dados recebidos.
- Armazenar vendas em banco de dados.
- Implementar idempotência para evitar duplicidades.
- Disponibilizar relatórios via HTTP GET.
- Permitir filtros por período.
- Implementar testes automatizados.

## Premissas e decisões iniciais

- Cada notificação representa uma venda com pagamento confirmado.
- Inicialmente, apenas valores em BRL serão aceitos.
- Valores monetários serão armazenados em centavos.
- Cada venda será identificada pela plataforma de origem e seu identificador externo.
- Dados pessoais de compradores não serão necessários.

## Fora do escopo

- Estornos e chargebacks.
- Conversão entre moedas.
- Interface gráfica.
- Autenticação de usuários.
- Microsserviços e sistemas de mensageria.

Essas decisões buscam manter a implementação objetiva e priorizar a confiabilidade das funcionalidades essenciais.

## Status

Em desenvolvimento.

A documentação será atualizada com os endpoints, exemplos de requisições, instruções de execução, deploy e limitações da implementação.
