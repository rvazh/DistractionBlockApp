// Mensagens de melhora (igual ao site): escolha quais padrões usar e escreva as suas
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Cabecalho } from '@/components/cabecalho';
import {
  Badge,
  Button,
  Card,
  CardHead,
  CardTitle,
  Feedback,
  Field,
  Interruptor,
  Screen,
  SeloPro,
  Tag,
  Txt,
  Vazio,
} from '@/components/ui-kit';
import { type Cores } from '@/constants/theme';
import { useFeedback } from '@/hooks/use-feedback';
import { MENSAGENS_PADRAO } from '@/lib/mensagens';
import { useStore } from '@/lib/store';
import { useEstilos } from '@/lib/tema';

export default function MensagensScreen() {
  const { estado, adicionarMensagem, removerMensagem, usarMensagemPadrao, usarTodasPadrao } = useStore();
  const s = useEstilos(criar);
  const { mensagem, mostrar } = useFeedback();
  const [texto, setTexto] = useState('');

  const proprias = estado.mensagensProprias;
  const desligadas = new Set(estado.mensagensDesligadas);
  const emUso = MENSAGENS_PADRAO.filter((m) => !desligadas.has(m)).length;
  const total = proprias.length + emUso;

  function adicionar() {
    if (mostrar(adicionarMensagem(texto))) setTexto('');
  }

  return (
    <Screen
      header={<Cabecalho />}
      tag="Mensagens de melhora"
      title="Mensagens"
      subtitle="Na tela de bloqueio aparece uma destas, sorteada. Escolha quais padrões usar e escreva as suas."
      right={<Badge label={`${total || MENSAGENS_PADRAO.length} em uso`} tone="ok" />}>
      <Card destaque>
        <CardHead right={<Tag>{proprias.length} personalizadas</Tag>}>
          <View style={s.tituloPro}>
            <CardTitle>Suas mensagens</CardTitle>
            <SeloPro />
          </View>
        </CardHead>
        <Field
          value={texto}
          onChangeText={setTexto}
          placeholder="Escreva a sua mensagem"
          maxLength={240}
          autoCapitalize="sentences"
          autoCorrect
          onSubmitEditing={adicionar}
          returnKeyType="done"
        />
        <Button title="Adicionar" onPress={adicionar} disabled={!texto.trim()} />
        <Feedback resultado={mensagem} />
        {proprias.length ? (
          proprias.map((m, i) => (
            <View key={i + m} style={[s.item, i === 0 && s.primeiro]}>
              <Txt style={s.texto}>{m}</Txt>
              <Button pequeno variant="ghost" title="Remover" onPress={() => removerMensagem(i)} />
            </View>
          ))
        ) : (
          <Vazio titulo="Nenhuma ainda.">Uma frase sua, na hora certa, costuma funcionar melhor que qualquer outra.</Vazio>
        )}
      </Card>

      <Card>
        <CardTitle sub={`${emUso} de ${MENSAGENS_PADRAO.length} em uso`}>Mensagens padrão</CardTitle>
        <View style={s.botoes}>
          <View style={{ flex: 1 }}>
            <Button
              pequeno
              variant="secondary"
              title="Usar todas"
              disabled={emUso === MENSAGENS_PADRAO.length}
              onPress={() => usarTodasPadrao(true, MENSAGENS_PADRAO)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              pequeno
              variant="ghost"
              title="Desligar todas"
              disabled={emUso === 0}
              onPress={() => usarTodasPadrao(false, MENSAGENS_PADRAO)}
            />
          </View>
        </View>
        {!total ? <Txt style={s.nota}>Sem nenhuma mensagem em uso, o app volta a mostrar as padrão.</Txt> : null}
        {MENSAGENS_PADRAO.map((m, i) => {
          const ligada = !desligadas.has(m);
          return (
            <View key={m} style={[s.item, i === 0 && s.primeiro]}>
              <Txt style={[s.texto, !ligada && s.desligada]}>{m}</Txt>
              <Interruptor value={ligada} onValueChange={(v) => usarMensagemPadrao(m, v)} />
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

function criar(c: Cores) {
  return StyleSheet.create({
    tituloPro: { flexDirection: 'row', alignItems: 'center' },
    item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.border },
    primeiro: { borderTopWidth: 0 },
    texto: { flex: 1, fontSize: 14, lineHeight: 20 },
    desligada: { color: c.dim, textDecorationLine: 'line-through' },
    botoes: { flexDirection: 'row', gap: 8 },
    nota: { color: c.textSecondary, fontSize: 12 },
  });
}
