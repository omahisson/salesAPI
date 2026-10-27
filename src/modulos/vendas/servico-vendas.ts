import { buscarRelatorio, salvarVenda } from './repositorio-vendas.js';
import type { DadosVenda, FiltrosRelatorio } from './esquemas-vendas.js';

export async function registrarVenda(dados: DadosVenda) {
  return salvarVenda(dados);
}

export async function gerarRelatorio(filtros: FiltrosRelatorio) {
  return buscarRelatorio(filtros);
}
