import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  DIA_MS,
  ESPERA_APOS_NEGACAO_MS,
  PRAZO_MAX,
  PRAZO_MIN,
  emailValido,
  estadoInicial,
  formatarData,
  jaExiste,
  normalizarEntrada,
  pedidoPronto,
} from './regras';
import { autenticarNoCelular, verificarBiometria } from './biometria';
import { NUVEM_ATIVA, supabase, traduzirErro } from './nuvem';
import { conferirSenha, criarSenha, novoId } from './senha';
import type { AlvoPedido, Categoria, Conta, Estado, Estilo, ModoEntrada, Tentativa } from './types';

const CHAVE = 'distractionblock:estado:v1';

export type Resultado = { ok: true; aviso?: string } | { ok: false; erro: string };

type Store = {
  estado: Estado;
  carregado: boolean;
  agora: number;
  /** Se o app está aberto (passou pelo login nesta vez). */
  sessaoAtiva: boolean;
  criarConta: (dados: { nome: string; email: string; senha: string }) => Promise<Resultado>;
  entrar: (email: string, senha: string, manter: boolean) => Promise<Resultado>;
  entrarComCelular: () => Promise<Resultado>;
  definirModoEntrada: (modo: ModoEntrada, manter?: boolean) => Promise<Resultado>;
  sair: () => void;
  adicionar: (categoria: Categoria, entrada: string) => Resultado;
  remover: (categoria: Categoria, id: string) => Resultado;
  definirSenha: (nova: string, atual?: string) => Promise<Resultado>;
  ativarProtecao: () => Resultado;
  definirEmailConfianca: (email: string) => Resultado;
  definirProibirExclusao: (valor: boolean) => Resultado;
  criarPedido: (alvo: AlvoPedido, motivo: string) => Resultado;
  cancelarPedido: (id: string) => Resultado;
  concluirPedido: (id: string, senha: string) => Promise<Resultado>;
  mudarPrazo: (dias: number) => Resultado;
  mudarEstilo: (info: Partial<Estilo>) => void;
  adicionarMensagem: (texto: string) => Resultado;
  removerMensagem: (indice: number) => void;
  usarMensagemPadrao: (texto: string, ligar: boolean) => void;
  usarTodasPadrao: (ligar: boolean, todas: string[]) => void;
  registrarTentativa: (tipo: Tentativa['tipo'], alvo: string) => void;
  // Ferramentas de teste (aparecem só em desenvolvimento)
  testeLiberarAgora: (id: string) => void;
  testeNegarPedido: (id: string) => void;
  testeApagarTudo: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>(estadoInicial);
  const [carregado, setCarregado] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  const [sessaoAtiva, setSessaoAtiva] = useState(false);
  const ref = useRef(estado);

  // Toda mudança passa por aqui, para que as ações sempre leiam o estado mais recente.
  const atualizar = useCallback((fn: (e: Estado) => Estado) => {
    const novo = fn(ref.current);
    ref.current = novo;
    setEstado(novo);
  }, []);

  // Carrega os dados salvos no aparelho.
  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((json) => {
        if (json) {
          const salvo = JSON.parse(json) as Estado;
          atualizar(() => ({ ...estadoInicial(), ...salvo }));
          // Login padrão com "manter conectado": entra direto. Com digital, pede a digital ao abrir.
          const c = salvo.conta;
          if (c && (c.modoEntrada ?? 'padrao') === 'padrao' && c.manterConectado) setSessaoAtiva(true);
        }
      })
      .catch(() => {})
      .finally(() => setCarregado(true));
  }, [atualizar]);

  // Salva a cada mudança.
  useEffect(() => {
    if (!carregado) return;
    AsyncStorage.setItem(CHAVE, JSON.stringify(estado)).catch(() => {});
  }, [estado, carregado]);

  // Relógio para atualizar contagens regressivas.
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // ===== Conta e login =====

  const criarConta = useCallback(
    async ({ nome, email, senha }: { nome: string; email: string; senha: string }): Promise<Resultado> => {
      const n = nome.trim();
      const e = email.trim().toLowerCase();
      if (n.length < 2) return { ok: false, erro: 'Digite o seu nome.' };
      if (!emailValido(e)) return { ok: false, erro: 'E-mail inválido.' };
      if (senha.length < 6) return { ok: false, erro: 'A senha precisa ter pelo menos 6 caracteres.' };

      const atual = ref.current.ajustes;
      // Se já existia uma senha de controle neste celular, ela precisa ser a mesma (não dá para trocar assim).
      if (atual.senhaHash && !(await conferirSenha(senha, atual.senhaHash, atual.senhaSalt))) {
        return { ok: false, erro: 'Este celular já tem uma senha de controle. Use a mesma senha.' };
      }

      let origem: Conta['origem'] = 'local';
      if (NUVEM_ATIVA && supabase) {
        const { data, error } = await supabase.auth.signUp({ email: e, password: senha, options: { data: { nome: n } } });
        if (error) return { ok: false, erro: traduzirErro(error.message) };
        if (!data.session) {
          return {
            ok: false,
            erro: `Enviamos um link de confirmação para ${e}. Confirme o e-mail e depois toque em "Já tenho conta".`,
          };
        }
        origem = 'nuvem';
      }

      const { hash, salt } = atual.senhaHash
        ? { hash: atual.senhaHash, salt: atual.senhaSalt as string }
        : await criarSenha(senha);
      atualizar((s) => ({
        ...s,
        conta: { nome: n, email: e, origem, modoEntrada: 'padrao', manterConectado: true, criadaEm: Date.now() },
        ajustes: {
          ...s.ajustes,
          senhaHash: hash,
          senhaSalt: salt,
          protecaoAtiva: true,
          ativadaEm: s.ajustes.ativadaEm ?? Date.now(),
        },
      }));
      setSessaoAtiva(true);
      return { ok: true, aviso: 'Conta criada. A proteção foi ativada.' };
    },
    [atualizar],
  );

  const entrar = useCallback(
    async (email: string, senha: string, manter: boolean): Promise<Resultado> => {
      const e = email.trim().toLowerCase();
      if (!e || !senha) return { ok: false, erro: 'Preencha o e-mail e a senha.' };
      const atual = ref.current;

      if (NUVEM_ATIVA && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: e, password: senha });
        if (error) return { ok: false, erro: traduzirErro(error.message) };
        const nome =
          (data.user?.user_metadata?.nome as string | undefined) || atual.conta?.nome || e.split('@')[0];
        // No servidor a senha pode ter mudado: a senha de controle deste celular acompanha.
        const { hash, salt } = await criarSenha(senha);
        atualizar((s) => ({
          ...s,
          conta: {
            nome,
            email: e,
            origem: 'nuvem',
            modoEntrada: s.conta?.modoEntrada ?? 'padrao',
            manterConectado: manter,
            criadaEm: s.conta?.criadaEm ?? Date.now(),
          },
          ajustes: {
            ...s.ajustes,
            senhaHash: hash,
            senhaSalt: salt,
            protecaoAtiva: s.conta ? s.ajustes.protecaoAtiva : true,
            ativadaEm: s.ajustes.ativadaEm ?? Date.now(),
          },
        }));
        setSessaoAtiva(true);
        return { ok: true };
      }

      const conta = atual.conta;
      if (!conta) return { ok: false, erro: 'Ainda não existe conta neste celular. Crie uma conta.' };
      const certa = await conferirSenha(senha, atual.ajustes.senhaHash, atual.ajustes.senhaSalt);
      if (e !== conta.email || !certa) return { ok: false, erro: 'E-mail ou senha incorretos.' };
      atualizar((s) => (s.conta ? { ...s, conta: { ...s.conta, manterConectado: manter } } : s));
      setSessaoAtiva(true);
      return { ok: true };
    },
    [atualizar],
  );

  const entrarComCelular = useCallback(async (): Promise<Resultado> => {
    const disp = await verificarBiometria();
    if (!disp.ok) return { ok: false, erro: disp.motivo };
    const ok = await autenticarNoCelular();
    if (!ok) return { ok: false, erro: 'Não foi possível confirmar. Tente de novo ou entre com e-mail e senha.' };
    setSessaoAtiva(true);
    return { ok: true };
  }, []);

  const definirModoEntrada = useCallback(
    async (modo: ModoEntrada, manter?: boolean): Promise<Resultado> => {
      if (!ref.current.conta) return { ok: false, erro: 'Entre na sua conta primeiro.' };
      if (modo === 'biometria') {
        const disp = await verificarBiometria();
        if (!disp.ok) return { ok: false, erro: disp.motivo };
        const ok = await autenticarNoCelular('Confirme para usar no Distraction Block');
        if (!ok) return { ok: false, erro: 'Não foi possível confirmar no celular. Tente de novo.' };
      }
      atualizar((s) =>
        s.conta
          ? {
              ...s,
              conta: { ...s.conta, modoEntrada: modo, manterConectado: manter ?? s.conta.manterConectado },
            }
          : s,
      );
      return {
        ok: true,
        aviso: modo === 'biometria' ? 'Pronto: agora você entra com o celular.' : 'Pronto: você entra com e-mail e senha.',
      };
    },
    [atualizar],
  );

  const sair = useCallback(() => {
    // Desligar "manter conectado" faz o app pedir login da próxima vez.
    atualizar((s) => (s.conta ? { ...s, conta: { ...s.conta, manterConectado: false } } : s));
    setSessaoAtiva(false);
  }, [atualizar]);

  // ===== Bloqueios =====

  const adicionar = useCallback(
    (categoria: Categoria, entrada: string): Resultado => {
      const { valor, erro } = normalizarEntrada(categoria, entrada);
      if (!valor) return { ok: false, erro: erro ?? 'Valor inválido.' };
      const e = ref.current;
      if (jaExiste(e.bloqueios[categoria], categoria, valor)) {
        return { ok: false, erro: `"${valor}" já está na lista.` };
      }
      atualizar((s) => ({
        ...s,
        bloqueios: {
          ...s.bloqueios,
          [categoria]: [...s.bloqueios[categoria], { id: novoId(), valor, criadoEm: Date.now() }],
        },
      }));
      return { ok: true };
    },
    [atualizar],
  );

  const remover = useCallback(
    (categoria: Categoria, id: string): Resultado => {
      if (ref.current.ajustes.protecaoAtiva) {
        return {
          ok: false,
          erro: 'A proteção está ativa. Para liberar este item, faça um pedido de desbloqueio.',
        };
      }
      atualizar((s) => ({
        ...s,
        bloqueios: { ...s.bloqueios, [categoria]: s.bloqueios[categoria].filter((i) => i.id !== id) },
      }));
      return { ok: true };
    },
    [atualizar],
  );

  const definirSenha = useCallback(
    async (nova: string, atual?: string): Promise<Resultado> => {
      if (nova.length < 6) return { ok: false, erro: 'A senha precisa ter pelo menos 6 caracteres.' };
      const { senhaHash, senhaSalt } = ref.current.ajustes;
      if (senhaHash) {
        const certa = await conferirSenha(atual ?? '', senhaHash, senhaSalt);
        if (!certa) return { ok: false, erro: 'Senha atual incorreta.' };
      }
      if (NUVEM_ATIVA && supabase && ref.current.conta?.origem === 'nuvem') {
        const { error } = await supabase.auth.updateUser({ password: nova });
        if (error) return { ok: false, erro: traduzirErro(error.message) };
      }
      const { hash, salt } = await criarSenha(nova);
      const primeira = !senhaHash;
      atualizar((s) => ({
        ...s,
        ajustes: {
          ...s.ajustes,
          senhaHash: hash,
          senhaSalt: salt,
          protecaoAtiva: primeira ? true : s.ajustes.protecaoAtiva,
          ativadaEm: primeira ? Date.now() : s.ajustes.ativadaEm,
        },
      }));
      return { ok: true, aviso: primeira ? 'Senha criada. A proteção foi ativada.' : 'Senha alterada.' };
    },
    [atualizar],
  );

  const ativarProtecao = useCallback((): Resultado => {
    if (!ref.current.ajustes.senhaHash) return { ok: false, erro: 'Crie uma senha primeiro.' };
    atualizar((s) => ({ ...s, ajustes: { ...s.ajustes, protecaoAtiva: true, ativadaEm: Date.now() } }));
    return { ok: true, aviso: 'Proteção ativada.' };
  }, [atualizar]);

  const definirEmailConfianca = useCallback(
    (email: string): Resultado => {
      const limpo = email.trim();
      if (limpo && !emailValido(limpo)) return { ok: false, erro: 'E-mail inválido.' };
      atualizar((s) => ({ ...s, ajustes: { ...s.ajustes, emailConfianca: limpo || undefined } }));
      return { ok: true, aviso: limpo ? 'Pessoa de confiança salva.' : 'Pessoa de confiança removida.' };
    },
    [atualizar],
  );

  const definirProibirExclusao = useCallback(
    (valor: boolean): Resultado => {
      const e = ref.current;
      if (!valor && e.ajustes.protecaoAtiva && e.ajustes.proibirExclusao) {
        return {
          ok: false,
          erro: 'Com a proteção ativa, essa opção só pode ser desligada depois de um pedido de desbloqueio.',
        };
      }
      atualizar((s) => ({ ...s, ajustes: { ...s.ajustes, proibirExclusao: valor } }));
      return { ok: true };
    },
    [atualizar],
  );

  const criarPedido = useCallback(
    (alvo: AlvoPedido, motivo: string): Resultado => {
      const e = ref.current;
      const t = Date.now();
      if (!e.ajustes.protecaoAtiva) {
        return { ok: false, erro: 'A proteção não está ativa. Você pode remover os itens diretamente.' };
      }
      if (e.novoPedidoApos && t < e.novoPedidoApos) {
        return {
          ok: false,
          erro: `Seu último pedido foi negado. Um novo pedido só pode ser feito a partir de ${formatarData(e.novoPedidoApos)}.`,
        };
      }
      if (motivo.trim().length < 5) {
        return { ok: false, erro: 'Escreva o motivo do pedido (pelo menos 5 caracteres).' };
      }
      const duplicado = e.pedidos.some(
        (p) =>
          p.status === 'aguardando' &&
          (p.alvo.tipo === 'item'
            ? alvo.tipo === 'item' && p.alvo.itemId === alvo.itemId
            : p.alvo.tipo === alvo.tipo),
      );
      if (duplicado) return { ok: false, erro: 'Já existe um pedido em andamento para isso.' };

      atualizar((s) => ({
        ...s,
        pedidos: [
          {
            id: novoId(),
            alvo,
            motivo: motivo.trim(),
            criadoEm: t,
            liberaEm: t + s.prazoDias * DIA_MS,
            emailConfianca: s.ajustes.emailConfianca,
            status: 'aguardando',
          },
          ...s.pedidos,
        ],
      }));
      return {
        ok: true,
        aviso: `Pedido criado. Você poderá concluí-lo com a sua senha a partir de ${formatarData(t + e.prazoDias * DIA_MS)}.`,
      };
    },
    [atualizar],
  );

  const cancelarPedido = useCallback(
    (id: string): Resultado => {
      atualizar((s) => ({
        ...s,
        pedidos: s.pedidos.map((p) =>
          p.id === id && p.status === 'aguardando'
            ? { ...p, status: 'cancelado', finalizadoEm: Date.now() }
            : p,
        ),
      }));
      return { ok: true, aviso: 'Pedido cancelado. Boa decisão!' };
    },
    [atualizar],
  );

  const concluirPedido = useCallback(
    async (id: string, senha: string): Promise<Resultado> => {
      const e = ref.current;
      const pedido = e.pedidos.find((p) => p.id === id);
      if (!pedido) return { ok: false, erro: 'Pedido não encontrado.' };
      if (!pedidoPronto(pedido, Date.now())) {
        return { ok: false, erro: 'Este pedido ainda está no período de espera.' };
      }
      const certa = await conferirSenha(senha, e.ajustes.senhaHash, e.ajustes.senhaSalt);
      if (!certa) return { ok: false, erro: 'Senha incorreta.' };

      atualizar((s) => {
        const pedidos = s.pedidos.map((p) =>
          p.id === id ? { ...p, status: 'concluido' as const, finalizadoEm: Date.now() } : p,
        );
        if (pedido.alvo.tipo === 'tudo') {
          return {
            ...s,
            pedidos,
            ajustes: { ...s.ajustes, protecaoAtiva: false, ativadaEm: undefined, proibirExclusao: false },
          };
        }
        if (pedido.alvo.tipo === 'prazo') {
          return { ...s, pedidos, prazoDias: pedido.alvo.para };
        }
        const { categoria, itemId } = pedido.alvo;
        return {
          ...s,
          pedidos,
          bloqueios: { ...s.bloqueios, [categoria]: s.bloqueios[categoria].filter((i) => i.id !== itemId) },
        };
      });
      return {
        ok: true,
        aviso:
          pedido.alvo.tipo === 'tudo'
            ? 'Proteção desativada.'
            : pedido.alvo.tipo === 'prazo'
              ? `Prazo alterado para ${pedido.alvo.para} dias.`
              : `"${pedido.alvo.valor}" foi liberado.`,
      };
    },
    [atualizar],
  );

  // ===== Prazo para liberar =====
  // Aumentar vale na hora. Diminuir também é uma liberação: vira um pedido que espera o prazo atual.
  const mudarPrazo = useCallback(
    (dias: number): Resultado => {
      const e = ref.current;
      if (!Number.isInteger(dias) || dias < PRAZO_MIN || dias > PRAZO_MAX) {
        return { ok: false, erro: `Escolha um prazo entre ${PRAZO_MIN} e ${PRAZO_MAX} dias.` };
      }
      if (dias === e.prazoDias) return { ok: false, erro: `O prazo já é de ${dias} dias.` };
      const t = Date.now();
      if (dias > e.prazoDias) {
        atualizar((s) => ({
          ...s,
          prazoDias: dias,
          // Um pedido aberto para diminuir deixa de fazer sentido
          pedidos: s.pedidos.map((p) =>
            p.alvo.tipo === 'prazo' && p.status === 'aguardando' ? { ...p, status: 'cancelado', finalizadoEm: t } : p,
          ),
        }));
        return { ok: true, aviso: `Prazo aumentado para ${dias} dias.` };
      }
      if (!e.ajustes.protecaoAtiva) {
        atualizar((s) => ({ ...s, prazoDias: dias }));
        return { ok: true, aviso: `Prazo alterado para ${dias} dias.` };
      }
      if (e.pedidos.some((p) => p.alvo.tipo === 'prazo' && p.status === 'aguardando')) {
        return { ok: false, erro: 'Já existe um pedido para diminuir o prazo. Desista dele em Desbloqueio para fazer outro.' };
      }
      if (e.novoPedidoApos && t < e.novoPedidoApos) {
        return { ok: false, erro: `Seu último pedido foi negado. Um novo pedido só a partir de ${formatarData(e.novoPedidoApos)}.` };
      }
      atualizar((s) => ({
        ...s,
        pedidos: [
          {
            id: novoId(),
            alvo: { tipo: 'prazo', de: s.prazoDias, para: dias },
            motivo: `Diminuir o prazo para ${dias} dias`,
            criadoEm: t,
            liberaEm: t + s.prazoDias * DIA_MS,
            emailConfianca: s.ajustes.emailConfianca,
            status: 'aguardando',
          },
          ...s.pedidos,
        ],
      }));
      return { ok: true, aviso: 'Pedido criado. Acompanhe em Desbloqueio.' };
    },
    [atualizar],
  );

  // ===== Estilo =====
  const mudarEstilo = useCallback(
    (info: Partial<Estilo>) => {
      atualizar((s) => ({ ...s, estilo: { ...s.estilo, ...info } }));
    },
    [atualizar],
  );

  // ===== Mensagens =====
  const adicionarMensagem = useCallback(
    (texto: string): Resultado => {
      const m = texto.trim().replace(/\s+/g, ' ');
      if (m.length < 3) return { ok: false, erro: 'Escreva a mensagem.' };
      if (m.length > 240) return { ok: false, erro: 'Use no máximo 240 caracteres.' };
      if (ref.current.mensagensProprias.includes(m)) return { ok: false, erro: 'Essa mensagem já está na lista.' };
      atualizar((s) => ({ ...s, mensagensProprias: [m, ...s.mensagensProprias] }));
      return { ok: true, aviso: 'Mensagem adicionada.' };
    },
    [atualizar],
  );

  const removerMensagem = useCallback(
    (indice: number) => {
      atualizar((s) => ({ ...s, mensagensProprias: s.mensagensProprias.filter((_, i) => i !== indice) }));
    },
    [atualizar],
  );

  const usarMensagemPadrao = useCallback(
    (texto: string, ligar: boolean) => {
      atualizar((s) => {
        const off = new Set(s.mensagensDesligadas);
        if (ligar) off.delete(texto);
        else off.add(texto);
        return { ...s, mensagensDesligadas: [...off] };
      });
    },
    [atualizar],
  );

  const usarTodasPadrao = useCallback(
    (ligar: boolean, todas: string[]) => {
      atualizar((s) => ({ ...s, mensagensDesligadas: ligar ? [] : [...todas] }));
    },
    [atualizar],
  );

  // ===== Tentativas bloqueadas =====
  // Quem bloqueia de verdade (o build de desenvolvimento) chama isto a cada tentativa.
  const registrarTentativa = useCallback(
    (tipo: Tentativa['tipo'], alvo: string) => {
      const t = Date.now();
      const limite = t - 120 * DIA_MS;
      atualizar((s) => ({
        ...s,
        tentativas: [...s.tentativas.filter((x) => x.t >= limite), { t, tipo, alvo: alvo.slice(0, 200) }].slice(-5000),
      }));
    },
    [atualizar],
  );

  const testeLiberarAgora = useCallback(
    (id: string) => {
      atualizar((s) => ({
        ...s,
        pedidos: s.pedidos.map((p) => (p.id === id ? { ...p, liberaEm: Date.now() } : p)),
      }));
      setAgora(Date.now());
    },
    [atualizar],
  );

  const testeNegarPedido = useCallback(
    (id: string) => {
      const t = Date.now();
      atualizar((s) => ({
        ...s,
        novoPedidoApos: t + ESPERA_APOS_NEGACAO_MS,
        pedidos: s.pedidos.map((p) => (p.id === id ? { ...p, status: 'negado', finalizadoEm: t } : p)),
      }));
    },
    [atualizar],
  );

  const testeApagarTudo = useCallback(async () => {
    await AsyncStorage.removeItem(CHAVE).catch(() => {});
    if (supabase) await supabase.auth.signOut().catch(() => {});
    atualizar(() => estadoInicial());
    setSessaoAtiva(false);
  }, [atualizar]);

  const valor = useMemo<Store>(
    () => ({
      estado,
      carregado,
      agora,
      sessaoAtiva,
      criarConta,
      entrar,
      entrarComCelular,
      definirModoEntrada,
      sair,
      adicionar,
      remover,
      definirSenha,
      ativarProtecao,
      definirEmailConfianca,
      definirProibirExclusao,
      criarPedido,
      cancelarPedido,
      concluirPedido,
      mudarPrazo,
      mudarEstilo,
      adicionarMensagem,
      removerMensagem,
      usarMensagemPadrao,
      usarTodasPadrao,
      registrarTentativa,
      testeLiberarAgora,
      testeNegarPedido,
      testeApagarTudo,
    }),
    [
      estado,
      carregado,
      agora,
      sessaoAtiva,
      criarConta,
      entrar,
      entrarComCelular,
      definirModoEntrada,
      sair,
      adicionar,
      remover,
      definirSenha,
      ativarProtecao,
      definirEmailConfianca,
      definirProibirExclusao,
      criarPedido,
      cancelarPedido,
      concluirPedido,
      mudarPrazo,
      mudarEstilo,
      adicionarMensagem,
      removerMensagem,
      usarMensagemPadrao,
      usarTodasPadrao,
      registrarTentativa,
      testeLiberarAgora,
      testeNegarPedido,
      testeApagarTudo,
    ],
  );

  return <StoreContext.Provider value={valor}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>.');
  return ctx;
}
