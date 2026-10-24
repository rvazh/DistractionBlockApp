export type Categoria = 'sites' | 'apps' | 'palavras';

export type ItemBloqueado = {
  id: string;
  valor: string;
  criadoEm: number;
};

export type AlvoPedido =
  | { tipo: 'item'; categoria: Categoria; itemId: string; valor: string }
  | { tipo: 'tudo' }
  /** Diminuir o prazo para liberar também é uma liberação. */
  | { tipo: 'prazo'; de: number; para: number };

export type StatusPedido = 'aguardando' | 'concluido' | 'cancelado' | 'negado';

export type PedidoDesbloqueio = {
  id: string;
  alvo: AlvoPedido;
  motivo: string;
  criadoEm: number;
  /** Momento a partir do qual o pedido pode ser concluído com a senha (criadoEm + prazo). */
  liberaEm: number;
  emailConfianca?: string;
  status: StatusPedido;
  finalizadoEm?: number;
};

export type Ajustes = {
  senhaHash?: string;
  senhaSalt?: string;
  emailConfianca?: string;
  proibirExclusao: boolean;
  protecaoAtiva: boolean;
  ativadaEm?: number;
};

export type Plano = 'gratuito' | 'pro';

/** Uma tentativa bloqueada (abrir um site/app bloqueado ou pesquisar uma palavra bloqueada). */
export type Tentativa = { t: number; tipo: 'site' | 'app' | 'palavra'; alvo: string };

export type Estilo = {
  tema: 'escuro' | 'claro';
  cor: 'neutro' | 'dourado' | 'verde' | 'azul' | 'lilas' | 'coral';
  /** Quanto escurecer a imagem de fundo (0 a 0,9). */
  escurecer: number;
  /** Endereço da imagem de fundo guardada no celular. */
  fundo?: string;
};

/** Como entrar no app: e-mail e senha, ou digital / senha do próprio celular. */
export type ModoEntrada = 'padrao' | 'biometria';

export type Conta = {
  nome: string;
  email: string;
  /** 'local': conta só neste celular. 'nuvem': conta no Supabase, igual ao site. */
  origem: 'local' | 'nuvem';
  /** Ainda vazio logo depois de criar a conta, até a pessoa escolher. */
  modoEntrada?: ModoEntrada;
  /** No login padrão: entra direto ao abrir o app, sem pedir a senha. */
  manterConectado: boolean;
  criadaEm: number;
};

export type Estado = {
  versao: 1;
  bloqueios: Record<Categoria, ItemBloqueado[]>;
  pedidos: PedidoDesbloqueio[];
  ajustes: Ajustes;
  plano: Plano;
  conta?: Conta;
  /** Dias de espera para qualquer liberação (4 a 90; padrão 7). */
  prazoDias: number;
  estilo: Estilo;
  /** Mensagens de melhora escritas pela pessoa. */
  mensagensProprias: string[];
  /** Mensagens padrão que a pessoa desligou. */
  mensagensDesligadas: string[];
  tentativas: Tentativa[];
  /** Se a pessoa de confiança negar um pedido, novos pedidos só depois desta data. */
  novoPedidoApos?: number;
};
