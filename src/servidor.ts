import { criarAplicacao } from './aplicacao.js';
import { ambiente } from './configuracao/ambiente.js';
import { conexao } from './banco/conexao.js';

const aplicacao = criarAplicacao();

async function iniciar() {
  try {
    await aplicacao.listen({ port: ambiente.porta, host: '127.0.0.1' });
  } catch (erro) {
    aplicacao.log.error(erro);
    process.exitCode = 1;
  }
}

async function encerrar() {
  await aplicacao.close();
  await conexao.end();
}

process.once('SIGINT', () => { void encerrar(); });
process.once('SIGTERM', () => { void encerrar(); });

void iniciar();
