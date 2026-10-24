import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Cabecalho } from '@/components/cabecalho';
import {
  Aviso,
  Badge,
  Button,
  Card,
  CardHead,
  CardTitle,
  Feedback,
  Field,
  Screen,
  Segmented,
  SeloPro,
  Tag,
  ToggleRow,
  Txt,
  useUi,
} from '@/components/ui-kit';
import { CORES_DESTAQUE, F, type Cores } from '@/constants/theme';
import { useFeedback } from '@/hooks/use-feedback';
import { verificarBiometria } from '@/lib/biometria';
import { apagarImagemDeFundo, escolherImagemDeFundo } from '@/lib/fundo';
import {
  LIMITES_GRATUITO,
  PRAZO_MAX,
  PRAZO_MIN,
  PRAZO_OPCOES,
  PRECO_PRO,
  formatarData,
  formatarRestante,
} from '@/lib/regras';
import { useStore } from '@/lib/store';
import { useCores, useEstilos } from '@/lib/tema';

export default function AjustesScreen() {
  const { estado } = useStore();
  return (
    <Screen header={<Cabecalho />} tag="Ajustes" title="Ajustes" subtitle="Prazo para liberar, estilo, plano e conta.">
      <PrazoCard />
      <EstiloCard />
      <PlanoCard />
      <ContaCard />
      <ConfiancaCard key={estado.ajustes.emailConfianca ?? 'sem-email'} />
      <ExclusaoCard />
      <SairBotao />
    </Screen>
  );
}

// ===== Prazo para liberar =====
function PrazoCard() {
  const { estado, agora, mudarPrazo } = useStore();
  const s = useEstilos(criar);
  const { mensagem, mostrar, limpar } = useFeedback();
  const atual = estado.prazoDias;
  const pedido = estado.pedidos.find((p) => p.alvo.tipo === 'prazo' && p.status === 'aguardando');
  const [escolha, setEscolha] = useState<number | 'outro'>(PRAZO_OPCOES.includes(atual) ? atual : 'outro');
  const [outro, setOutro] = useState(PRAZO_OPCOES.includes(atual) ? '' : String(atual));
  const [confirmando, setConfirmando] = useState(false);

  const dias = escolha === 'outro' ? Number(outro) : escolha;
  const valido = Number.isInteger(dias) && dias >= PRAZO_MIN && dias <= PRAZO_MAX;
  const mudou = valido && dias !== atual;
  const aumentar = mudou && dias > atual;
  const confiancaNome = estado.ajustes.emailConfianca;

  function escolher(v: number | 'outro') {
    limpar();
    setConfirmando(false);
    setEscolha(v);
  }

  function salvar() {
    if (!valido) {
      mostrar({ ok: false, erro: `Escolha um prazo entre ${PRAZO_MIN} e ${PRAZO_MAX} dias.` });
      return;
    }
    if (!mudou) return;
    if (!aumentar && pedido) {
      mostrar({ ok: false, erro: 'Já existe um pedido para diminuir o prazo. Desista dele em Desbloqueio para fazer outro.' });
      return;
    }
    setConfirmando(true);
  }

  return (
    <Card destaque>
      <CardHead right={<Badge label={`${atual} dias`} tone="ok" />}>
        <CardTitle>Prazo para liberar</CardTitle>
      </CardHead>
      <Txt style={s.sub}>
        Quanto tempo um bloqueio continua valendo depois que você pede a liberação. Aumentar vale na hora. Diminuir também é
        uma liberação: espera o prazo atual{confiancaNome ? ', a pessoa de confiança aprova' : ''} e você confirma com a senha.
      </Txt>
      <Segmented
        value={escolha}
        onChange={escolher}
        options={[...PRAZO_OPCOES.map((d) => ({ value: d as number | 'outro', label: `${d}d` })), { value: 'outro', label: 'Outro' }]}
      />
      {escolha === 'outro' ? (
        <View style={s.outro}>
          <View style={{ width: 110 }}>
            <Field
              value={outro}
              onChangeText={(t) => {
                limpar();
                setConfirmando(false);
                setOutro(t.replace(/\D/g, ''));
              }}
              keyboardType="number-pad"
              placeholder={`${PRAZO_MIN} a ${PRAZO_MAX}`}
              maxLength={2}
            />
          </View>
          <Txt style={s.sub}>dias</Txt>
        </View>
      ) : null}

      {confirmando ? (
        <Aviso>
          {aumentar ? (
            <>
              <Txt style={s.confTitulo}>Aumentar para {dias} dias?</Txt>
              <Txt style={s.sub}>
                Vale na hora para os próximos pedidos. Os pedidos já abertos mantêm o prazo deles. Para voltar a um prazo
                menor depois, você vai precisar esperar {dias} dias.
                {pedido ? ` O pedido aberto para diminuir para ${pedido.alvo.tipo === 'prazo' ? pedido.alvo.para : ''} dias será cancelado.` : ''}
              </Txt>
            </>
          ) : (
            <>
              <Txt style={s.confTitulo}>Diminuir para {dias} dias?</Txt>
              <Txt style={s.sub}>
                Diminuir o prazo também é uma liberação. Ele continua em {atual} dias durante os próximos {atual} dias.
                Depois disso, você confirma com a senha em Desbloqueio. Dá para desistir a qualquer momento.
              </Txt>
            </>
          )}
          <View style={s.botoes}>
            <View style={{ flex: 1 }}>
              <Button
                pequeno
                variant={aumentar ? 'primary' : 'secondary'}
                title={aumentar ? `Aumentar para ${dias} dias` : 'Pedir mudança'}
                onPress={() => {
                  setConfirmando(false);
                  mostrar(mudarPrazo(dias));
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                pequeno
                variant={aumentar ? 'ghost' : 'primary'}
                title={aumentar ? 'Cancelar' : `Manter ${atual} dias`}
                onPress={() => setConfirmando(false)}
              />
            </View>
          </View>
        </Aviso>
      ) : (
        <Button
          variant={mudou ? 'primary' : 'secondary'}
          title={!mudou ? 'Salvar prazo' : aumentar ? `Aumentar para ${dias} dias` : 'Pedir para diminuir'}
          onPress={salvar}
          disabled={!mudou}
        />
      )}
      <Feedback resultado={mensagem} />

      {pedido && pedido.alvo.tipo === 'prazo' ? (
        <Aviso tracejado>
          <Txt style={s.confTitulo}>
            Pedido para diminuir de {pedido.alvo.de} para {pedido.alvo.para} dias
          </Txt>
          <Txt style={s.sub}>
            Feito em {formatarData(pedido.criadoEm)} ·{' '}
            {agora >= pedido.liberaEm ? 'prazo cumprido' : `faltam ${formatarRestante(pedido.liberaEm - agora)}`}
          </Txt>
        </Aviso>
      ) : null}
      <Txt style={s.nota}>
        Os pedidos que já estão abertos mantêm o prazo com que foram feitos. Mínimo de {PRAZO_MIN} e máximo de {PRAZO_MAX} dias.
      </Txt>
    </Card>
  );
}

// ===== Estilo =====
function EstiloCard() {
  const { estado, mudarEstilo } = useStore();
  const c = useCores();
  const s = useEstilos(criar);
  const ui = useUi();
  const { mensagem, mostrar } = useFeedback();
  const st = estado.estilo;
  const [carregando, setCarregando] = useState(false);
  const padrao = st.tema === 'escuro' && st.cor === 'neutro' && !st.fundo;

  async function escolherImagem() {
    setCarregando(true);
    const r = await escolherImagemDeFundo();
    setCarregando(false);
    if (r.erro) mostrar({ ok: false, erro: r.erro });
    if (r.uri) {
      apagarImagemDeFundo(st.fundo);
      mudarEstilo({ fundo: r.uri });
      mostrar({ ok: true, aviso: 'Imagem de fundo aplicada.' });
    }
  }

  function removerImagem() {
    apagarImagemDeFundo(st.fundo);
    mudarEstilo({ fundo: undefined });
  }

  function voltarAoPadrao() {
    apagarImagemDeFundo(st.fundo);
    mudarEstilo({ tema: 'escuro', cor: 'neutro', escurecer: 0.6, fundo: undefined });
    mostrar({ ok: true, aviso: 'Estilo padrão de volta.' });
  }

  return (
    <Card>
      <CardHead right={!padrao ? <Button pequeno variant="ghost" title="Voltar ao padrão" onPress={voltarAoPadrao} /> : undefined}>
        <View style={ui.row}>
          <CardTitle>Estilo</CardTitle>
          <SeloPro />
        </View>
      </CardHead>
      <Txt style={s.sub}>As cores e o fundo do app. Mudam na hora e valem só neste celular.</Txt>

      <Tag>Tema</Tag>
      <Segmented
        value={st.tema}
        onChange={(tema) => mudarEstilo({ tema })}
        options={[
          { value: 'escuro', label: 'Escuro' },
          { value: 'claro', label: 'Claro' },
        ]}
      />

      <Tag>Cor de destaque</Tag>
      <View style={s.cores}>
        {CORES_DESTAQUE.map((cor) => {
          const ativa = st.cor === cor.id;
          return (
            <Pressable
              key={cor.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativa }}
              onPress={() => mudarEstilo({ cor: cor.id })}
              style={[s.cor, ativa && { borderColor: c.accent }]}>
              <View style={[s.corBola, { backgroundColor: cor[st.tema] }, ativa && { borderColor: c.accent, borderWidth: 2 }]} />
              <Txt style={[s.corNome, ativa && { color: c.text }]}>{cor.nome}</Txt>
            </Pressable>
          );
        })}
      </View>

      <Tag>Imagem de fundo</Tag>
      <View style={[s.previa, !st.fundo && s.previaVazia]}>
        {st.fundo ? (
          <>
            <Image source={{ uri: st.fundo }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background, opacity: st.escurecer }]} />
          </>
        ) : (
          <Txt style={[s.sub, { textAlign: 'center', paddingHorizontal: 16 }]}>Nenhuma imagem. Escolha uma foto do celular.</Txt>
        )}
      </View>
      <View style={s.botoes}>
        <View style={{ flex: 1 }}>
          <Button
            variant="secondary"
            title={carregando ? 'Preparando…' : st.fundo ? 'Trocar imagem' : 'Escolher imagem'}
            onPress={escolherImagem}
            disabled={carregando}
          />
        </View>
        {st.fundo ? (
          <View style={{ flex: 1 }}>
            <Button variant="ghost" title="Remover" onPress={removerImagem} />
          </View>
        ) : null}
      </View>
      {st.fundo ? (
        <View style={{ gap: 8 }}>
          <View style={ui.row}>
            <Txt style={[s.sub, { flex: 1 }]}>Escurecer a imagem</Txt>
            <Txt style={s.mono}>{Math.round(st.escurecer * 100)}%</Txt>
          </View>
          <Segmented
            value={Math.round(st.escurecer * 10) / 10}
            onChange={(v) => mudarEstilo({ escurecer: v })}
            options={[0.2, 0.4, 0.6, 0.8].map((v) => ({ value: v, label: `${v * 100}%` }))}
          />
        </View>
      ) : null}
      <Feedback resultado={mensagem} />
      <Txt style={s.nota}>A imagem fica guardada só neste celular. Dica: fotos escuras ou desfocadas deixam o texto mais fácil de ler.</Txt>
    </Card>
  );
}

// ===== Seu plano =====
const PLANOS = [
  {
    nome: 'Gratuito',
    preco: 'R$ 0',
    itens: [
      `Até ${LIMITES_GRATUITO.sites} sites bloqueados`,
      `Até ${LIMITES_GRATUITO.palavras} palavras pesquisadas`,
      `Até ${LIMITES_GRATUITO.apps} apps bloqueados`,
      'Prazo de espera ajustável',
      'Pessoa de confiança',
      'Mensagens de melhora padrão',
      'Painel e gráfico dos últimos 7 dias',
    ],
  },
  {
    nome: 'Pro',
    preco: PRECO_PRO,
    itens: [
      'Sites, palavras e apps ilimitados',
      'Tudo o que tem no Gratuito',
      'Cores e tema claro ou escuro',
      'Imagem de fundo',
      'Mensagens de melhora suas',
      'Gráfico dos últimos 30 dias',
    ],
  },
];

function PlanoCard() {
  const { estado } = useStore();
  const c = useCores();
  const s = useEstilos(criar);
  const [verPlanos, setVerPlanos] = useState(false);
  const uso = [
    { id: 'sites', rotulo: 'Sites', usado: estado.bloqueios.sites.length, limite: LIMITES_GRATUITO.sites },
    { id: 'palavras', rotulo: 'Palavras', usado: estado.bloqueios.palavras.length, limite: LIMITES_GRATUITO.palavras },
    { id: 'apps', rotulo: 'Apps', usado: estado.bloqueios.apps.length, limite: LIMITES_GRATUITO.apps },
  ];

  return (
    <Card>
      <CardHead right={<Badge label={estado.plano === 'pro' ? 'Pro' : 'Gratuito'} tone="ok" />}>
        <CardTitle>Seu plano</CardTitle>
      </CardHead>
      <Txt style={s.sub}>Fase de lançamento: o Pro está liberado para todos, sem cobrança. Os limites abaixo ainda não travam nada.</Txt>
      <View style={{ gap: 12 }}>
        {uso.map((u) => {
          const pct = Math.min(100, (u.usado / u.limite) * 100);
          const passou = u.usado > u.limite;
          return (
            <View key={u.id}>
              <View style={s.usoLinha}>
                <Txt style={s.usoRotulo}>{u.rotulo}</Txt>
                <Txt style={[s.mono, passou && { color: c.danger }]}>
                  {u.usado} de {u.limite}
                </Txt>
              </View>
              <View style={s.usoTrilho}>
                <View style={[s.usoBarra, { width: `${pct}%` }, passou && { backgroundColor: c.danger }]} />
              </View>
            </View>
          );
        })}
      </View>
      <Button
        variant="secondary"
        title={verPlanos ? 'Esconder os planos' : `Ver os planos · Pro ${PRECO_PRO}`}
        onPress={() => setVerPlanos((v) => !v)}
      />
      {verPlanos
        ? PLANOS.map((p) => (
            <View key={p.nome} style={[s.plano, p.nome === 'Pro' && { borderColor: c.accent }]}>
              <View style={s.usoLinha}>
                <Tag style={{ color: c.text }}>{p.nome}</Tag>
                <Txt style={s.planoPreco}>{p.preco}</Txt>
              </View>
              {p.itens.map((item) => (
                <View key={item} style={s.planoItem}>
                  <Txt style={s.planoTraco}>—</Txt>
                  <Txt style={s.planoTexto}>{item}</Txt>
                </View>
              ))}
            </View>
          ))
        : null}
    </Card>
  );
}

// ===== Conta e forma de entrar =====
function ContaCard() {
  const { estado, definirModoEntrada } = useStore();
  const s = useEstilos(criar);
  const { mensagem, mostrar } = useFeedback();
  const conta = estado.conta;
  if (!conta) return null;
  const inicial = conta.nome.trim().charAt(0).toUpperCase();

  async function alternarBiometria(ligar: boolean) {
    if (ligar) {
      const disp = await verificarBiometria();
      if (!disp.ok) {
        mostrar({ ok: false, erro: disp.motivo });
        return;
      }
    }
    mostrar(await definirModoEntrada(ligar ? 'biometria' : 'padrao'));
  }

  return (
    <Card>
      <View style={s.conta}>
        <View style={s.avatar}>
          <Txt style={s.avatarLetra}>{inicial}</Txt>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt style={s.contaNome} numberOfLines={1}>
            {conta.nome}
          </Txt>
          <Txt style={s.contaEmail} numberOfLines={1}>
            {conta.email}
          </Txt>
        </View>
        <Badge label={conta.origem === 'nuvem' ? 'Nuvem' : 'Neste celular'} />
      </View>
      <ToggleRow
        label="Entrar com a digital"
        description="Ao abrir o app, pede a digital, o rosto ou a senha do celular."
        value={conta.modoEntrada === 'biometria'}
        onValueChange={alternarBiometria}
      />
      <Feedback resultado={mensagem} />
    </Card>
  );
}

// Botão Sair, no fim da tela (da próxima vez que abrir, o app pede login)
function SairBotao() {
  const { sair } = useStore();
  return <Button grande variant="danger" title="Sair da conta" onPress={sair} />;
}

function ConfiancaCard() {
  const { estado, definirEmailConfianca } = useStore();
  const s = useEstilos(criar);
  const { mensagem, mostrar } = useFeedback();
  const [email, setEmail] = useState(estado.ajustes.emailConfianca ?? '');

  return (
    <Card>
      <CardTitle>Pessoa de confiança</CardTitle>
      <Txt style={s.sub}>
        Opcional. Ela recebe um e-mail com um link para autorizar ou negar os seus pedidos de desbloqueio. Se negar, você só
        pode pedir de novo depois de 1 semana.
      </Txt>
      <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="nome@exemplo.com" />
      <Button variant="secondary" title="Salvar" onPress={() => mostrar(definirEmailConfianca(email))} />
      <Feedback resultado={mensagem} />
      <Txt style={s.nota}>O envio do e-mail será ligado ao servidor (Supabase) na próxima etapa.</Txt>
    </Card>
  );
}

function ExclusaoCard() {
  const { estado, definirProibirExclusao } = useStore();
  const s = useEstilos(criar);
  const { mensagem, mostrar } = useFeedback();
  return (
    <Card>
      <ToggleRow
        label="Proibir a exclusão do app"
        description="Impede desinstalar o Distraction Block enquanto a proteção estiver ativa."
        value={estado.ajustes.proibirExclusao}
        onValueChange={(v) => mostrar(definirProibirExclusao(v))}
      />
      <Feedback resultado={mensagem} />
      <Txt style={s.nota}>
        A opção já fica salva, mas o impedimento real depende de permissões do Android que entram com o build de desenvolvimento.
      </Txt>
    </Card>
  );
}


function criar(c: Cores) {
  return StyleSheet.create({
    sub: { color: c.textSecondary, fontSize: 13, lineHeight: 19 },
    nota: { color: c.dim, fontSize: 12, lineHeight: 17 },
    mono: { fontFamily: F.monoMedium, fontSize: 12, color: c.text },
    outro: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    botoes: { flexDirection: 'row', gap: 8 },
    confTitulo: { fontFamily: F.semibold, fontSize: 14 },
    cores: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    cor: {
      width: '31%',
      flexGrow: 1,
      alignItems: 'center',
      gap: 6,
      paddingTop: 10,
      paddingBottom: 8,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 4,
      backgroundColor: c.surface2,
    },
    corBola: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: c.borderStrong },
    corNome: { fontSize: 11, color: c.textSecondary },
    previa: {
      height: 150,
      borderWidth: 1,
      borderColor: c.borderStrong,
      borderRadius: 4,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    previaVazia: { borderStyle: 'dashed', backgroundColor: c.surface2 },
    usoLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    usoRotulo: { fontSize: 13 },
    usoTrilho: { height: 4, backgroundColor: c.surface3, borderRadius: 2, overflow: 'hidden' },
    usoBarra: { height: '100%', backgroundColor: c.accent, borderRadius: 2 },
    plano: { borderWidth: 1, borderColor: c.border, padding: 14, gap: 6 },
    planoPreco: { fontFamily: F.bold, fontSize: 18 },
    planoItem: { flexDirection: 'row', gap: 8 },
    planoTraco: { color: c.dim, fontFamily: F.mono, width: 16 },
    planoTexto: { flex: 1, fontSize: 13, lineHeight: 19 },
    conta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    avatarLetra: { color: c.onAccent, fontFamily: F.bold, fontSize: 15 },
    contaNome: { fontFamily: F.semibold, fontSize: 15 },
    contaEmail: { color: c.dim, fontSize: 12, fontFamily: F.mono },
  });
}
