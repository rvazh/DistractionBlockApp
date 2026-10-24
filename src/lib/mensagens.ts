// Mensagens de "melhora": as mesmas do site (extension/messages.js).
import type { Estado } from './types';

export const MENSAGENS_PADRAO = [
  'Esse impulso passa em 90 segundos. O que você construir hoje fica.',
  'Você não abriu o celular para isso. Volte para o que importa.',
  'Disciplina é lembrar do que você quer de verdade.',
  'Cada "não" para a distração é um "sim" para a sua vida real.',
  'O tempo que você está tentando matar é o mesmo que você vai querer de volta.',
  'Foco não é talento. É escolha repetida. Escolha de novo agora.',
  'Feche essa porta. Tem coisa melhor esperando do outro lado.',
  'Seu eu do futuro está assistindo. Dê a ele um motivo para agradecer.',
  'Tédio é o lugar onde as boas ideias nascem. Fique um pouco nele.',
  'Você é maior que essa vontade.',
  'Uma tarefa pequena feita agora vale mais que mil vídeos assistidos.',
  'Levante, beba água, respire. Depois volte para o que é seu.',
  'Não é falta de tempo. É tempo indo para o lugar errado.',
  'O mundo real tem gente, projetos e sonhos. Volte para ele.',
  'Pequenas vitórias todos os dias viram uma vida diferente.',
  'Ninguém lembra das horas rolando o feed. Todo mundo lembra do que você fez.',
  'Você bloqueou isso por um motivo. Confie em quem você era quando decidiu.',
  'Consistência vence intensidade. Mais um bloco de foco.',
  'Troque a dopamina rápida pela satisfação de terminar algo.',
  'O que você está evitando fazer agora? Comece por 5 minutos.',
  'Você está construindo uma carreira. Cada minuto conta.',
  'Respire fundo. Quatro segundos para dentro, quatro para fora.',
  'Melhor do que ontem. É só isso que precisa ser hoje.',
  'A distração promete descanso e entrega cansaço.',
  'Hora de mirar no que realmente importa.',
  'Desligue o ruído. Ouça o que você quer para a sua vida.',
  'Você já venceu esse impulso antes. Vença de novo.',
  'Faça hoje o que o seu eu de amanhã vai agradecer.',
  'Não é sobre ser perfeito. É sobre não desistir de você.',
  'Uma página lida, uma linha de código, um passo dado. Vá.',
  'Seu foco é o seu bem mais valioso. Não entregue de graça.',
  'O feed não acaba nunca. O seu dia acaba.',
  'Feche, levante, mude de ambiente por um minuto.',
  'Quem você quer ser daqui a um ano faria o quê agora?',
  'Você está no controle. Não o algoritmo.',
  'Termine uma coisa. Só uma. Depois veja como se sente.',
  'Disciplina hoje, liberdade amanhã.',
  'Volte para a sua lista. A primeira tarefa está te esperando.',
  'Grandes mudanças são feitas de pequenas recusas.',
  'Você merece uma vida mais interessante que uma tela.',
];

/** Mensagens em uso: as suas + as padrão ligadas. Sem nenhuma, volta para as padrão. */
export function mensagensAtivas(e: Pick<Estado, 'mensagensProprias' | 'mensagensDesligadas'>): string[] {
  const off = new Set(e.mensagensDesligadas);
  const lista = [...e.mensagensProprias, ...MENSAGENS_PADRAO.filter((m) => !off.has(m))];
  return lista.length ? lista : MENSAGENS_PADRAO;
}

/** A mesma mensagem o dia inteiro, trocando a cada dia (igual ao site). */
export function mensagemDoDia(e: Pick<Estado, 'mensagensProprias' | 'mensagensDesligadas'>, agora = Date.now()): string {
  const todas = mensagensAtivas(e);
  const d = new Date(agora);
  const semente = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
  return todas[semente % todas.length] ?? '';
}
