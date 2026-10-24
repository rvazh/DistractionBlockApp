import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  CardTitle,
  Chip,
  Feedback,
  Field,
  Paragraph,
  Screen,
  Segmented,
  Tag,
  Txt,
  useUi,
} from '@/components/ui-kit';
import { F, Spacing, type Cores } from '@/constants/theme';
import { useEstilos } from '@/lib/tema';
import { useFeedback } from '@/hooks/use-feedback';
import { APPS_SUGERIDOS, LIMITES_GRATUITO, NOMES_CATEGORIA, normalizarTexto } from '@/lib/regras';
import { useStore } from '@/lib/store';
import type { Categoria } from '@/lib/types';

const PLACEHOLDER: Record<Categoria, string> = {
  sites: 'ex.: instagram.com',
  apps: 'ex.: Instagram',
  palavras: 'ex.: apostas',
};

export default function BloqueiosScreen() {
  const styles = useEstilos(criar);
  const ui = useUi();
  const router = useRouter();
  const { estado, adicionar, remover } = useStore();
  const [categoria, setCategoria] = useState<Categoria>('sites');
  const [entrada, setEntrada] = useState('');
  const { mensagem, mostrar, limpar } = useFeedback();

  const lista = estado.bloqueios[categoria];
  const limite = LIMITES_GRATUITO[categoria];
  const gratuito = estado.plano === 'gratuito';
  const acimaDoLimite = gratuito && lista.length >= limite;
  const protecaoAtiva = estado.ajustes.protecaoAtiva;

  const comPedido = new Set(
    estado.pedidos
      .filter((p) => p.status === 'aguardando' && p.alvo.tipo === 'item')
      .map((p) => (p.alvo.tipo === 'item' ? p.alvo.itemId : '')),
  );

  function salvar(valor: string) {
    if (mostrar(adicionar(categoria, valor))) setEntrada('');
  }

  const sugeridos = APPS_SUGERIDOS.filter(
    (a) => !lista.some((i) => normalizarTexto(i.valor) === normalizarTexto(a)),
  );

  return (
    <Screen tag="Bloqueios" title="O que você quer evitar" subtitle="Adicionar é livre. Remover exige um pedido de desbloqueio.">
      <Segmented
        value={categoria}
        onChange={(c) => {
          setCategoria(c);
          setEntrada('');
          limpar();
        }}
        options={[
          { value: 'sites', label: 'Sites' },
          { value: 'apps', label: 'Apps' },
          { value: 'palavras', label: 'Palavras' },
        ]}
      />

      <Card>
        <View style={ui.row}>
          <CardTitle>Adicionar {NOMES_CATEGORIA[categoria].singular}</CardTitle>
          <View style={{ flex: 1 }} />
          <Tag>{gratuito ? `${lista.length} / ${limite}` : `${lista.length} · ilimitado`}</Tag>
        </View>
        <Field
          value={entrada}
          onChangeText={setEntrada}
          placeholder={PLACEHOLDER[categoria]}
          onSubmitEditing={() => salvar(entrada)}
          returnKeyType="done"
          keyboardType={categoria === 'sites' ? 'url' : 'default'}
          autoCapitalize={categoria === 'apps' ? 'words' : 'none'}
        />
        <Button title="Bloquear" onPress={() => salvar(entrada)} disabled={!entrada.trim()} />
        <Feedback resultado={mensagem} />
        {acimaDoLimite ? (
          <Paragraph muted>
            O plano Gratuito permite {limite} {NOMES_CATEGORIA[categoria].plural.toLowerCase()}. Por enquanto você
            pode continuar adicionando; no Pro o bloqueio é ilimitado.
          </Paragraph>
        ) : null}
        {categoria === 'apps' && sugeridos.length > 0 ? (
          <View style={{ gap: Spacing.two }}>
            <Tag>Sugestões</Tag>
            <View style={ui.wrap}>
              {sugeridos.map((a) => (
                <Chip key={a} adicionar label={a} onPress={() => salvar(a)} />
              ))}
            </View>
          </View>
        ) : null}
      </Card>

      <Card>
        <View style={ui.row}>
          <CardTitle>{NOMES_CATEGORIA[categoria].plural} bloqueados</CardTitle>
          <View style={{ flex: 1 }} />
          <Tag>{String(lista.length).padStart(2, '0')}</Tag>
        </View>
        {lista.length === 0 ? (
          <Paragraph muted>Nada por aqui ainda.</Paragraph>
        ) : (
          lista.map((item) => {
            const pendente = comPedido.has(item.id);
            return (
              <View key={item.id} style={styles.item}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt style={styles.itemTexto} numberOfLines={1}>
                    {item.valor}
                  </Txt>
                  {pendente ? <Badge label="Pedido em andamento" tone="warn" /> : null}
                </View>
                {protecaoAtiva ? (
                  !pendente ? (
                    <Button
                      variant="ghost"
                      title="Pedir desbloqueio"
                      onPress={() =>
                        router.push({
                          pathname: '/desbloqueio',
                          params: { categoria, itemId: item.id },
                        })
                      }
                    />
                  ) : null
                ) : (
                  <Button variant="ghost" title="Remover" onPress={() => mostrar(remover(categoria, item.id))} />
                )}
              </View>
            );
          })
        )}
      </Card>
    </Screen>
  );
}

function criar(c: Cores) {
  return StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: Spacing.two,
  },
  itemTexto: { color: c.text, fontSize: 14, fontFamily: F.mono },
});
}
