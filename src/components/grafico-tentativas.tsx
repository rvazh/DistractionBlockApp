// Painel › Tentativas bloqueadas: quantas vezes você tentou abrir algo bloqueado, por dia (igual ao site)
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, CardTitle, Segmented, Txt } from '@/components/ui-kit';
import { F, type Cores } from '@/constants/theme';
import { formatarDiaMes, mesmoDia, plural, tentativasPorDia } from '@/lib/regras';
import { useStore } from '@/lib/store';
import { useCores, useEstilos } from '@/lib/tema';

const DIAS_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

// Um número "redondo" para o topo da escala (1, 2, 5, 10, 20, 50…)
function topoDaEscala(max: number) {
  if (max <= 4) return Math.max(1, max);
  const base = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 5, 10]) if (m * base >= max) return m * base;
  return 10 * base;
}

export function GraficoTentativas() {
  const { estado, agora } = useStore();
  const c = useCores();
  const s = useEstilos(criar);
  const [periodo, setPeriodo] = useState<7 | 30>(7);
  const [tocado, setTocado] = useState<number | null>(null);
  const dias = tentativasPorDia(estado.tentativas, periodo, agora);

  const total = dias.reduce((t, d) => t + d.total, 0);
  const sites = dias.reduce((t, d) => t + d.site + d.app, 0);
  const pesquisas = dias.reduce((t, d) => t + d.palavra, 0);
  const media = total / periodo;
  const pico = dias.reduce((a, d) => (d.total > a.total ? d : a), dias[0]);
  const topo = topoDaEscala(Math.max(...dias.map((d) => d.total)));
  const sel = tocado !== null ? dias[tocado] : null;

  const rotulo = (inicio: number, i: number) => {
    const dt = new Date(inicio);
    if (periodo === 7) return DIAS_DA_SEMANA[dt.getDay()];
    return (dias.length - 1 - i) % 5 === 0 ? String(dt.getDate()).padStart(2, '0') : '';
  };

  return (
    <Card>
      <CardTitle sub="Cada vez que você tentou abrir um site ou app, ou pesquisar uma palavra bloqueada.">
        Tentativas bloqueadas
      </CardTitle>
      <Segmented
        value={periodo}
        onChange={(p) => {
          setPeriodo(p);
          setTocado(null);
        }}
        options={[
          { value: 7, label: '7 dias' },
          { value: 30, label: '30 dias', pro: true },
        ]}
      />

      <View style={s.resumo}>
        <View style={[s.resumoItem, s.destaque]}>
          <Txt style={s.dt}>Total</Txt>
          <Txt style={[s.dd, { fontSize: 28, lineHeight: 32 }]}>{total}</Txt>
        </View>
        <View style={s.resumoLinha}>
          <View style={s.resumoItem}>
            <Txt style={s.dt}>Sites e apps</Txt>
            <Txt style={s.dd}>{sites}</Txt>
          </View>
          <View style={[s.resumoItem, s.bordaEsq]}>
            <Txt style={s.dt}>Pesquisas</Txt>
            <Txt style={s.dd}>{pesquisas}</Txt>
          </View>
        </View>
        <View style={s.resumoLinha}>
          <View style={s.resumoItem}>
            <Txt style={s.dt}>Média por dia</Txt>
            <Txt style={s.dd}>{media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</Txt>
          </View>
          <View style={[s.resumoItem, s.bordaEsq]}>
            <Txt style={s.dt}>Pior dia</Txt>
            <Txt style={s.dd}>
              {pico.total ? (
                <>
                  {pico.total}
                  <Txt style={s.ddPequeno}> · {formatarDiaMes(pico.inicio)}</Txt>
                </>
              ) : (
                '—'
              )}
            </Txt>
          </View>
        </View>
      </View>

      <View style={s.barras}>
        <View style={s.escala}>
          <Txt style={s.escalaTxt}>{topo}</Txt>
          <Txt style={s.escalaTxt}>0</Txt>
        </View>
        <View style={[s.area, { gap: periodo === 7 ? 8 : 2 }]}>
          <View style={s.guia} pointerEvents="none" />
          {dias.map((d, i) => {
            const altura = d.total ? Math.max(3, (d.total / topo) * 100) : 0;
            const hoje = mesmoDia(d.inicio, agora);
            return (
              <Pressable key={d.inicio} style={s.col} onPress={() => setTocado(tocado === i ? null : i)}>
                <View style={[s.trilho, tocado === i && { backgroundColor: c.surface2 }]}>
                  <View
                    style={[
                      s.barra,
                      { height: `${altura}%`, maxWidth: periodo === 7 ? 30 : 14, width: periodo === 7 ? '60%' : '100%' },
                      !d.total && { backgroundColor: c.borderStrong, height: 2 },
                    ]}
                  />
                </View>
                <Txt style={[s.lbl, hoje && { color: c.text }]}>{rotulo(d.inicio, i)}</Txt>
              </Pressable>
            );
          })}
        </View>
      </View>

      {sel ? (
        <View style={s.dica}>
          <Txt style={s.dicaForte}>{plural(sel.total, 'tentativa', 'tentativas')}</Txt>
          <Txt style={s.dicaTxt}>
            {formatarDiaMes(sel.inicio)}
            {mesmoDia(sel.inicio, agora) ? ' · hoje' : ''}
            {sel.total > 0 ? ` · ${plural(sel.site + sel.app, 'site/app', 'sites/apps')} · ${plural(sel.palavra, 'pesquisa', 'pesquisas')}` : ''}
          </Txt>
        </View>
      ) : null}

      {total === 0 ? (
        <Txt style={s.nota}>
          Nenhuma tentativa nesse período. O bloqueio de verdade no celular chega com o build de desenvolvimento; até lá,
          a conta fica zerada.
        </Txt>
      ) : null}
    </Card>
  );
}

function criar(c: Cores) {
  return StyleSheet.create({
    resumo: { borderWidth: 1, borderColor: c.border },
    resumoLinha: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.border },
    resumoItem: { flex: 1, paddingVertical: 10, paddingHorizontal: 14, gap: 4 },
    destaque: {},
    bordaEsq: { borderLeftWidth: 1, borderLeftColor: c.border },
    dt: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: c.dim },
    dd: { fontFamily: F.monoMedium, fontSize: 20, lineHeight: 24 },
    ddPequeno: { fontFamily: F.mono, fontSize: 12, color: c.textSecondary },
    barras: { flexDirection: 'row', gap: 8, height: 170, marginTop: 4 },
    escala: { justifyContent: 'space-between', paddingBottom: 22 },
    escalaTxt: { fontFamily: F.mono, fontSize: 10, color: c.dim, textAlign: 'right' },
    area: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', position: 'relative' },
    guia: { position: 'absolute', left: 0, right: 0, top: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: c.border },
    col: { flex: 1, height: '100%', alignItems: 'center', gap: 8 },
    trilho: {
      width: '100%',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      borderBottomWidth: 1,
      borderBottomColor: c.borderStrong,
    },
    barra: { minHeight: 2, backgroundColor: c.accent, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    lbl: { fontFamily: F.mono, fontSize: 10, color: c.dim, textTransform: 'uppercase', height: 14 },
    dica: { backgroundColor: c.accent, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2, alignSelf: 'flex-start', gap: 2 },
    dicaForte: { color: c.onAccent, fontFamily: F.semibold, fontSize: 12 },
    dicaTxt: { color: c.onAccent, opacity: 0.7, fontSize: 12 },
    nota: { color: c.textSecondary, fontSize: 12, lineHeight: 17 },
  });
}
