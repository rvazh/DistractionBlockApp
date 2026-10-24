import { StyleSheet, View } from 'react-native';

import { Logo } from '@/components/marca';
import { Txt } from '@/components/ui-kit';
import { F, type Cores } from '@/constants/theme';
import { useEstilos } from '@/lib/tema';

/** Marca no topo das telas, como no menu do site: logo + "DISTRACTION / BLOCK". */
export function Cabecalho() {
  const s = useEstilos(criar);
  return (
    <View style={s.marca}>
      <Logo size={40} />
      <View>
        <Txt style={s.l1}>Distraction</Txt>
        <Txt style={s.l2}>Block</Txt>
      </View>
    </View>
  );
}

function criar(c: Cores) {
  return StyleSheet.create({
    marca: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
    l1: { fontFamily: F.bold, fontSize: 15, lineHeight: 16, letterSpacing: 1.8, textTransform: 'uppercase' },
    l2: { fontFamily: F.medium, fontSize: 15, lineHeight: 16, letterSpacing: 1.8, textTransform: 'uppercase', color: c.textSecondary },
  });
}
