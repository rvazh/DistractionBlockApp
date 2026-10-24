import type { Categoria, Estado, ItemBloqueado, PedidoDesbloqueio } from './types';

export const DIA_MS = 24 * 60 * 60 * 1000;
export const ESPERA_DESBLOQUEIO_MS = 7 * DIA_MS;
export const ESPERA_APOS_NEGACAO_MS = 7 * DIA_MS;

// Prazo para liberar (igual ao site): opções rápidas, mínimo e máximo
export const PRAZO_PADRAO = 7;
export const PRAZO_OPCOES = [4, 7, 14, 30];
export const PRAZO_MIN = 4;
export const PRAZO_MAX = 90;

export const LIMITES_GRATUITO: Record<Categoria, number> = {
  sites: 4,
  apps: 2,
  palavras: 5,
};

export const PRECO_PRO = 'R$ 9,99/mês';

export const NOMES_CATEGORIA: Record<Categoria, { plural: string; singular: string }> = {
  sites: { plural: 'Sites', singular: 'site' },
  apps: { plural: 'Apps', singular: 'app' },
  palavras: { plural: 'Palavras', singular: 'palavra' },
};

export const APPS_SUGERIDOS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Facebook',
  'X (Twitter)',
  'Kwai',
  'Reddit',
  'Netflix',
  'Twitch',
  'Pinterest',
];

export function estadoInicial(): Estado {
  return {
    versao: 1,
    bloqueios: { sites: [], apps: [], palavras: [] },
    pedidos: [],
    ajustes: { proibirExclusao: false, protecaoAtiva: false },
    plano: 'gratuito',
    prazoDias: PRAZO_PADRAO,
    estilo: { tema: 'escuro', cor: 'neutro', escurecer: 0.6 },
    mensagensProprias: [],
    mensagensDesligadas: [],
    tentativas: [],
  };
}

/** Remove acentos e deixa em minúsculas, para comparar textos. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Converte "https://www.youtube.com/watch?v=1" em "youtube.com". Retorna null se não parecer um domínio. */
export function normalizarSite(entrada: string): string | null {
  let s = entrada.trim().toLowerCase();
  s = s.replace(/^[a-z]+:\/\//, '');
  s = s.split(/[/?#]/)[0];
  s = s.replace(/:\d+$/, '');
  s = s.replace(/^www\./, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s)) return null;
  return s;
}

export function normalizarEntrada(categoria: Categoria, entrada: string): { valor?: string; erro?: string } {
  const bruto = entrada.trim();
  if (!bruto) return { erro: 'Digite algo para bloquear.' };

  if (categoria === 'sites') {
    const site = normalizarSite(bruto);
    if (!site) return { erro: 'Endereço inválido. Exemplo: instagram.com' };
    return { valor: site };
  }
  if (categoria === 'palavras') {
    if (bruto.length < 2) return { erro: 'Use pelo menos 2 letras.' };
    return { valor: bruto.toLowerCase() };
  }
  return { valor: bruto };
}

export function jaExiste(lista: ItemBloqueado[], categoria: Categoria, valor: string): boolean {
  const alvo = categoria === 'sites' ? valor : normalizarTexto(valor);
  return lista.some((i) => (categoria === 'sites' ? i.valor : normalizarTexto(i.valor)) === alvo);
}

export type ResultadoVerificacao = {
  bloqueado: boolean;
  motivos: string[];
};

/**
 * Verifica se um endereço, pesquisa ou nome de app seria bloqueado.
 * Esta é a mesma regra que o bloqueio real vai usar quando for ligado ao sistema.
 */
export function verificar(texto: string, bloqueios: Estado['bloqueios']): ResultadoVerificacao {
  const motivos: string[] = [];
  const t = normalizarTexto(texto);
  if (!t) return { bloqueado: false, motivos };

  const dominio = normalizarSite(texto);
  if (dominio) {
    for (const s of bloqueios.sites) {
      if (dominio === s.valor || dominio.endsWith('.' + s.valor)) {
        motivos.push(`Site bloqueado: ${s.valor}`);
      }
    }
  }

  for (const p of bloqueios.palavras) {
    if (t.includes(normalizarTexto(p.valor))) {
      motivos.push(`Palavra bloqueada: "${p.valor}"`);
    }
  }

  for (const a of bloqueios.apps) {
    if (t === normalizarTexto(a.valor)) {
      motivos.push(`App bloqueado: ${a.valor}`);
    }
  }

  return { bloqueado: motivos.length > 0, motivos };
}

export function pedidoPronto(p: PedidoDesbloqueio, agora: number): boolean {
  return p.status === 'aguardando' && agora >= p.liberaEm;
}

export function descreverAlvo(p: PedidoDesbloqueio): string {
  if (p.alvo.tipo === 'tudo') return 'Desativar toda a proteção';
  if (p.alvo.tipo === 'prazo') return `Diminuir o prazo de ${p.alvo.de} para ${p.alvo.para} dias`;
  return `Liberar ${NOMES_CATEGORIA[p.alvo.categoria].singular}: ${p.alvo.valor}`;
}

export function formatarRestante(ms: number): string {
  if (ms <= 0) return 'agora';
  const dias = Math.floor(ms / DIA_MS);
  const horas = Math.floor((ms % DIA_MS) / (60 * 60 * 1000));
  const minutos = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (dias > 0) return `${dias}d ${horas}h`;
  if (horas > 0) return `${horas}h ${minutos}min`;
  return `${Math.max(minutos, 1)}min`;
}

export function formatarData(ms: number): string {
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} às ${hh}:${mi}`;
}

export function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`;
}

export function mesmoDia(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

const pad = (n: number) => String(n).padStart(2, '0');
export function formatarDiaMes(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}
export function formatarHora(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type DiaTentativas = { inicio: number; total: number; site: number; app: number; palavra: number };

/** Tentativas por dia nos últimos `dias` dias (o último é hoje). */
export function tentativasPorDia(tentativas: Estado['tentativas'], dias: number, agora = Date.now()): DiaTentativas[] {
  const hoje = new Date(agora);
  hoje.setHours(0, 0, 0, 0);
  const lista: DiaTentativas[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    lista.push({ inicio: d.getTime(), total: 0, site: 0, app: 0, palavra: 0 });
  }
  const primeiro = lista[0].inicio;
  for (const t of tentativas) {
    if (t.t < primeiro) continue;
    const dia = new Date(t.t);
    dia.setHours(0, 0, 0, 0);
    const item = lista.find((x) => x.inicio === dia.getTime());
    if (item) {
      item.total++;
      item[t.tipo]++;
    }
  }
  return lista;
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
