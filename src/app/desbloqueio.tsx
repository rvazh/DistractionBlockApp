import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  CardTitle,
  Chip,
  Divider,
  Feedback,
  Field,
  Paragraph,
  Screen,
  Tag,
  Txt,
  useUi,
} from '@/components/ui-kit';
import { F, Spacing, type Cores } from '@/constants/theme';
import { useCores, useEstilos } from '@/lib/tema';
import { useFeedback } from '@/hooks/use-feedback';
import { descreverAlvo, formatarData, formatarRestante, pedidoPronto } from '@/lib/regras';
import { useStore } from '@/lib/store';
import type { AlvoPedido, Categoria, PedidoDesbloqueio } from '@/lib/types';

const CATEGORIAS: Categoria[] = ['sites', 'apps', 'palavras'];

export default function DesbloqueioScreen() {
  const styles = useEstilos(criar);
  const ui = useUi();
  const params = useLocalSearchParams<{ itemId?: string }>();
  const { estado, agora, criarPedido } = useStore();
  const { mensagem, mostrar } = useFeedback();

  const itens = CATEGORIAS.flatMap((c) =>
    estado.bloqueios[c].map((i) => ({ categoria: c, id: i.id, valor: i.valor })),
  );
  const [selecionado, setSelecionado] = useState<string | null>(params.itemId ?? null);
  const [motivo, setMotivo] = useState('');

  // Quando chega um item novo pela aba Bloqueios, já deixa ele selecionado.
  const [paramVisto, setParamVisto] = useState(params.itemId);
  if (params.itemId !== paramVisto) {
    setParamVisto(params.itemId);
    setSelecionado(params.itemId ?? null);
  }

  const abertos = estado.pedidos.filter((p) => p.status === 'aguardando');
  const historico = estado.pedidos.filter((p) => p.status !== 'aguardando').slice(0, 10);
  const bloqueadoAte = estado.novoPedidoApos && agora < estado.novoPedidoApos ? estado.novoPedidoApos : null;

  function enviar() {
    let alvo: AlvoPedido | null = null;
    if (selecionado === 'tudo') alvo = { tipo: 'tudo' };
    else {
      const item = itens.find((i) => i.id === selecionado);
      if (item) alvo = { tipo: 'item', categoria: item.categoria, itemId: item.id, valor: item.valor };
    }
    if (!alvo) {
      mostrar({ ok: false, erro: 'Escolha o que você quer liberar.' });
      return;
    }
    if (mostrar(criarPedido(alvo, motivo))) {
      setMotivo('');
      setSelecionado(null);
    }
  }

  return (
    <Screen tag="Liberações" title="Desbloqueio" subtitle="Liberar algo leva tempo de propósito. Assim o impulso passa.">
      <Card>
        <CardTitle>Como funciona</CardTitle>
        <Regra n="01" texto="Você faz o pedido e explica o motivo." />
        <Regra n="02" texto={`O pedido só pode ser concluído ${estado.prazoDias} dias depois, com a sua senha (o prazo muda em Ajustes).`} />
        <Regra
          n="03"
          texto="Se você cadastrou uma pessoa de confiança, ela recebe um e-mail para autorizar (opcional)."
        />
        <Regra n="04" texto="Se ela negar, um novo pedido só pode ser feito depois de mais 1 semana." />
      </Card>

      {!estado.ajustes.protecaoAtiva ? (
        <Card>
          <Paragraph muted>
            A proteção não está ativa, então não é preciso pedir desbloqueio: você pode remover itens direto na aba
            Bloqueios.
          </Paragraph>
        </Card>
      ) : bloqueadoAte ? (
        <Card>
          <Badge label="Aguardando nova tentativa" tone="danger" />
          <Paragraph muted>
            Seu último pedido foi negado. Você poderá fazer um novo pedido a partir de {formatarData(bloqueadoAte)}.
          </Paragraph>
        </Card>
      ) : (
        <Card>
          <CardTitle>Novo pedido</CardTitle>
          <Tag>O que você quer liberar?</Tag>
          {itens.length === 0 ? <Paragraph muted>Sua lista de bloqueios está vazia.</Paragraph> : null}
          <View style={ui.wrap}>
            {itens.map((i) => (
              <Chip
                key={i.id}
                label={i.valor}
                ativo={selecionado === i.id}
                onPress={() => setSelecionado(i.id)}
              />
            ))}
            <Chip label="Toda a proteção" ativo={selecionado === 'tudo'} onPress={() => setSelecionado('tudo')} />
          </View>
          <Field
            label="Motivo"
            value={motivo}
            onChangeText={setMotivo}
            placeholder="Por que você precisa liberar isso?"
            autoCapitalize="sentences"
            autoCorrect
            multiline
            style={{ minHeight: 80, paddingTop: 12, textAlignVertical: 'top' }}
          />
          <Button title="Pedir desbloqueio" onPress={enviar} />
          <Feedback resultado={mensagem} />
        </Card>
      )}

      <Tag style={styles.secao}>Em andamento · {String(abertos.length).padStart(2, '0')}</Tag>
      {abertos.length === 0 ? <Paragraph muted>Nenhum pedido em andamento.</Paragraph> : null}
      {abertos.map((p) => (
        <PedidoCard key={p.id} pedido={p} />
      ))}

      {historico.length > 0 ? (
        <>
          <Tag style={styles.secao}>Histórico</Tag>
          <Card>
            {historico.map((p, idx) => (
              <View key={p.id} style={{ gap: 4 }}>
                {idx > 0 ? <Divider /> : null}
                <Txt style={styles.histTitulo}>{descreverAlvo(p)}</Txt>
                <View style={ui.row}>
                  <Badge
                    label={{ concluido: 'Concluído', cancelado: 'Cancelado', negado: 'Negado', aguardando: '' }[p.status]}
                    tone={p.status === 'concluido' ? 'ok' : p.status === 'negado' ? 'danger' : 'neutral'}
                  />
                  {p.finalizadoEm ? <Txt style={ui.small}>{formatarData(p.finalizadoEm)}</Txt> : null}
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Regra({ n, texto }: { n: string; texto: string }) {
  const styles = useEstilos(criar);
  return (
    <View style={styles.regra}>
      <View style={styles.regraNum}>
        <Txt style={styles.regraNumTexto}>{n}</Txt>
      </View>
      <Txt style={styles.regraTexto}>{texto}</Txt>
    </View>
  );
}

function PedidoCard({ pedido }: { pedido: PedidoDesbloqueio }) {
  const c = useCores();
  const styles = useEstilos(criar);
  const ui = useUi();
  const { agora, cancelarPedido, concluirPedido, testeLiberarAgora, testeNegarPedido } = useStore();
  const { mensagem, mostrar } = useFeedback();
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const pronto = pedidoPronto(pedido, agora);

  async function concluir() {
    setEnviando(true);
    const r = await concluirPedido(pedido.id, senha);
    setEnviando(false);
    if (!r.ok) mostrar(r);
  }

  return (
    <Card destaque={pronto}>
      <CardTitle>{descreverAlvo(pedido)}</CardTitle>
      <Txt style={ui.small}>Motivo: {pedido.motivo}</Txt>
      <Txt style={ui.small}>Pedido em {formatarData(pedido.criadoEm)}</Txt>

      {pronto ? (
        <>
          <Badge label="Liberado para concluir" tone="ok" />
          <Field label="Sua senha" value={senha} onChangeText={setSenha} secureTextEntry placeholder="••••" />
          <Button title="Concluir desbloqueio" onPress={concluir} loading={enviando} disabled={!senha} />
        </>
      ) : (
        <>
          <Badge label={`Faltam ${formatarRestante(pedido.liberaEm - agora)}`} tone="warn" />
          <Txt style={ui.small}>Pode ser concluído a partir de {formatarData(pedido.liberaEm)}.</Txt>
        </>
      )}

      {pedido.emailConfianca ? (
        <Txt style={ui.small}>
          Pessoa de confiança: {pedido.emailConfianca}. O envio do e-mail de autorização será ligado ao servidor na
          próxima etapa.
        </Txt>
      ) : null}

      <Feedback resultado={mensagem} />
      <Button variant="secondary" title="Desistir do pedido" onPress={() => mostrar(cancelarPedido(pedido.id))} />

      {__DEV__ ? (
        <View style={styles.dev}>
          <Tag style={{ color: c.dim }}>Teste · só em desenvolvimento</Tag>
          <View style={ui.wrap}>
            {!pronto ? <Chip label="Pular a espera" onPress={() => testeLiberarAgora(pedido.id)} /> : null}
            {pedido.emailConfianca ? (
              <Chip label="Simular negação" onPress={() => testeNegarPedido(pedido.id)} />
            ) : null}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function criar(c: Cores) {
  return StyleSheet.create({
  secao: { color: c.text, marginTop: Spacing.two },
  regra: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  regraNum: {
    width: 26,
    height: 22,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: c.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  regraNumTexto: { color: c.text, fontSize: 11, fontFamily: F.monoMedium },
  regraTexto: { color: c.textSecondary, fontSize: 14, lineHeight: 20, flex: 1 },
  histTitulo: { color: c.text, fontSize: 15, fontFamily: F.semibold },
  dev: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    borderStyle: 'dashed',
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
});
}
