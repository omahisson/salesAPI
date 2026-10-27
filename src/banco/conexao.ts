import pg from 'pg';
import { ambiente } from '../configuracao/ambiente.js';

const { Pool } = pg;

export const conexao = new Pool({
  connectionString: ambiente.urlBanco,
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

export function bancoIndisponivel(erro: unknown): boolean {
  if (!erro || typeof erro !== 'object') return false;
  const codigo = 'code' in erro ? String(erro.code) : '';
  const codigosRede = new Set([
    'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH',
    'ECONNRESET', 'EPIPE', '57P01', '57P02', '57P03', '53300',
  ]);
  return codigosRede.has(codigo) || codigo.startsWith('08');
}
