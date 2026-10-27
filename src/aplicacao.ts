import Fastify from 'fastify';
import { bancoIndisponivel } from './banco/conexao.js';
import { rotasVendas } from './modulos/vendas/rotas-vendas.js';

export function criarAplicacao() {
  const aplicacao = Fastify({ logger: true, bodyLimit: 32 * 1024 });

  aplicacao.get('/health', async () => ({ status: 'ok' }));
  aplicacao.register(rotasVendas);

  aplicacao.setErrorHandler((erro, requisicao, resposta) => {

    if (
      typeof erro === 'object' &&
      erro !== null &&
      'statusCode' in erro &&
      erro.statusCode === 400
    ) {

      return resposta.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request body',
      });
    }
    if (bancoIndisponivel(erro)) {
      aplicacao.log.error({ erro }, 'Banco de dados indisponível');
      return resposta.code(503).send({
        error: 'SERVICE_UNAVAILABLE',
        message: requisicao.url.startsWith('/reports/')
          ? 'Unable to generate sales report'
          : 'Unable to process webhook',
      });
    }
    aplicacao.log.error({ erro }, 'Erro interno inesperado');
    return resposta.code(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error',
    });
  });

  return aplicacao;
}
