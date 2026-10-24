import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Cabecalho } from '@/components/cabecalho';
import { GraficoTentativas } from '@/components/grafico-tentativas';
import {
  Aviso,
  Badge,
  Button,
  Card,
  CardHead,
  CardTitle,
  Field,
  Paragraph,
  Ponto,
  Screen,
  Tag,
  Txt,
  Vazio,
  useUi,
} from '@/components/ui-kit';
import { F, type Cores } from '@/constants/theme';
import { mensagemDoDia } from '@/lib/mensagens';
import { DIA_MS, LIMITES_GRATUITO, NOMES_CATEGORIA, formatarDiaMes, formatarHora, mesmoDia, verificar } from '@/lib/regras';
import { useStore } from '@/lib/store';
import { useCores, useEstilos } from '@/lib/tema';
import type { Categoria } from '@/lib/types';

const CATEGORIAS: Categoria[] = ['sites', 'apps', 'palavras'];
const TIPO: Record<string, string> = { site: 'Site', app: 'App', palavra: 'Pesquisa' };

function saudacao(nome?: string) {
  const h = new Date().getHours();
  const quem = nome ? `, ${nome.split(' ')[0]}` : '';
  return (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite') + quem + '.';
}

export default function InicioScreen() {
  const router = useRouter();
  const { estado, agora, ativarProtecao } = useStore();
  const c = useCores();
  const s = useEstilos(criar);
  const ui = useUi();
  const { ajustes, bloqueios, pedidos, plano, conta } = estado;
  const [teste, setTeste] = useState('');

  const diasProtegido =
    ajustes.protecaoAtiva && ajustes.ativadaEm ? Math.max(0, Math.floor((agora - ajustes.ativadaEm) / DIA_MS)) : 0;
  const pedidosAbertos = pedidos.filter((p) => p.status === 'aguardando').length;
  const resultado = teste.trim() ? verificar(teste, bloqueios) : null;
  const recentes = estado.tentativas.slice(-12).reverse();

  return (
    <Screen
      header={<Cabecalho />}
      tag="Painel"
      title={saudacao(conta?.nome)}
      subtitle="Tudo o que tentou roubar a sua atenção, e o que você escolheu no lugar.">
      <Card destaque>
        <View style={ui.row}>
          <Ponto ligado={ajustes.protecaoAtiva} />
          <Tag style={{ color: c.text }}>{ajustes.protecaoAtiva ? 'Proteção ativa' : 'Proteção desligada'}</Tag>
        </View>
        {ajustes.protecaoAtiva ? (
          <View style={s.dias}>
            <Txt style={s.diasNumero}>{String(diasProtegido).padStart(2, '0')}</Txt>
            <Txt style={s.diasTexto}>{diasProtegido === 1 ? 'dia protegido' : 'dias protegido'}</Txt>
          </View>
        ) : (
          <>
            <Paragraph muted>A proteção está desligada: dá para tirar itens da lista sem pedido.</Paragraph>
            <Button title="Ativar proteção" onPress={() => ativarProtecao()} />
          </>
        )}
        {pedidosAbertos > 0 ? (
          <Button
            variant="secondary"
            title={`${pedidosAbertos} ${pedidosAbertos === 1 ? 'pedido' : 'pedidos'} de desbloqueio em andamento`}
            onPress={() => router.push('/desbloqueio')}
          />
        ) : null}
      </Card>

      <Card destaque>
        <Tag>Mensagem do dia</Tag>
        <Txt style={s.citacao}>{mensagemDoDia(estado, agora)}</Txt>
      </Card>

      <Card>
        <CardTitle>O que está bloqueado</CardTitle>
        <View style={s.kv}>
          {CATEGORIAS.map((cat, i) => {
            const total = bloqueios[cat].length;
            const limite = LIMITES_GRATUITO[cat];
            const acima = plano === 'gratuito' && total > limite;
            return (
              <View key={cat} style={[s.kvItem, i > 0 && s.kvBorda]}>
                <Tag>{NOMES_CATEGORIA[cat].plural}</Tag>
                <Txt style={s.kvNumero}>{total}</Txt>
                <Txt style={[s.kvLimite, acima && { color: c.danger }]}>{plano === 'pro' ? 'ilimitado' : `de ${limite}`}</Txt>
              </View>
            );
          })}
        </View>
        <Button variant="secondary" title="Gerenciar bloqueios" onPress={() => router.push('/bloqueios')} />
      </Card>

      <GraficoTentativas />

      <Card>
        <CardHead right={recentes.length ? <Tag>{recentes.length}</Tag> : undefined}>
          <CardTitle>Últimos bloqueios</CardTitle>
        </CardHead>
        {recentes.length ? (
          recentes.map((e, i) => (
            <View key={`${e.t}-${i}`} style={[s.evento, i > 0 && s.eventoBorda]}>
              <Txt style={s.eventoHora}>{mesmoDia(e.t, agora) ? formatarHora(e.t) : formatarDiaMes(e.t)}</Txt>
              <Badge label={TIPO[e.tipo] ?? e.tipo} />
              <Txt style={s.eventoAlvo} numberOfLines={1}>
                {e.alvo}
              </Txt>
            </View>
          ))
        ) : (
          <Vazio titulo="Nada por aqui ainda.">Quando o app bloquear algo, aparece nesta lista.</Vazio>
        )}
      </Card>

      <Card>
        <CardTitle sub="Digite um site, uma pesquisa ou o nome de um app para ver se ele seria bloqueado.">
          Testar um bloqueio
        </CardTitle>
        <Field value={teste} onChangeText={setTeste} placeholder="ex.: youtube.com/shorts" returnKeyType="done" />
        {resultado ? (
          resultado.bloqueado ? (
            <View style={{ gap: 6 }}>
              <Badge label="Seria bloqueado" tone="danger" />
              {resultado.motivos.map((m) => (
                <Txt key={m} style={ui.small}>
                  {m}
                </Txt>
              ))}
            </View>
          ) : (
            <Badge label="Liberado" tone="neutral" />
          )
        ) : null}
      </Card>

      <Aviso tracejado>
        No Expo Go, o app já guarda as suas listas, a senha e as regras de desbloqueio, mas ainda não consegue bloquear
        outros apps e sites do celular. Esse bloqueio real chega com o build de desenvolvimento.
      </Aviso>
    </Screen>
  );
}

function criar(c: Cores) {
  return StyleSheet.create({
    dias: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
    diasNumero: { fontFamily: F.monoMedium, fontSize: 44, lineHeight: 50, letterSpacing: -1 },
    diasTexto: { color: c.textSecondary, fontSize: 14 },
    citacao: { fontFamily: F.medium, fontSize: 18, lineHeight: 26 },
    kv: { flexDirection: 'row', borderWidth: 1, borderColor: c.border },
    kvItem: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, gap: 4 },
    kvBorda: { borderLeftWidth: 1, borderLeftColor: c.border },
    kvNumero: { fontFamily: F.monoMedium, fontSize: 26, lineHeight: 30 },
    kvLimite: { color: c.dim, fontSize: 12, fontFamily: F.mono },
    evento: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    eventoBorda: { borderTopWidth: 1, borderTopColor: c.border },
    eventoHora: { fontFamily: F.mono, fontSize: 12, color: c.dim, width: 46 },
    eventoAlvo: { flex: 1, fontFamily: F.mono, fontSize: 12 },
  });
}
