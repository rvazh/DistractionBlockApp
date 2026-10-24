import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useCores } from '@/lib/tema';

const LOGO = require('@/assets/images/logo.png');
const SIMBOLO = require('@/assets/images/logo-simbolo.png');

/** Logo do Distraction Block (a arte completa, com o fundo de radar). */
export function Logo({ size = 40, round = true }: { size?: number; round?: boolean }) {
  return (
    <Image
      source={LOGO}
      style={{ width: size, height: size, borderRadius: round ? size / 2 : 4 }}
      contentFit="cover"
      accessibilityLabel="Distraction Block"
    />
  );
}

/** Só o símbolo branco, sem fundo. */
export function Simbolo({ size = 40 }: { size?: number }) {
  return <Image source={SIMBOLO} style={{ width: size, height: size }} contentFit="contain" />;
}

function useGiro(duracao: number, reverso = false): SharedValue<number> {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withRepeat(withTiming(reverso ? -360 : 360, { duration: duracao, easing: Easing.linear }), -1);
    return () => cancelAnimation(v);
  }, [v, duracao, reverso]);
  return v;
}

/** A mira da tela de acesso do site: três anéis tracejados girando em volta da logo. */
export function Mira({ size = 220 }: { size?: number }) {
  const c = useCores();
  const g1 = useGiro(80_000);
  const g2 = useGiro(50_000, true);
  const g3 = useGiro(30_000);
  const s1 = useAnimatedStyle(() => ({ transform: [{ rotate: `${g1.value}deg` }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ rotate: `${g2.value}deg` }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ rotate: `${g3.value}deg` }] }));

  const anel = (r: number, largura: number, traco: string, opacidade: number) => (
    <Svg width={size} height={size} viewBox="0 0 240 240">
      <Circle
        cx={120}
        cy={120}
        r={r}
        fill="none"
        stroke={c.accent}
        strokeWidth={largura}
        strokeDasharray={traco}
        opacity={opacidade}
      />
    </Svg>
  );

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[StyleSheet.absoluteFill, s1]}>{anel(118, 1, '2 8', 0.45)}</Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, s2]}>{anel(104, 3, '62 18', 1)}</Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, s3]}>{anel(90, 1, '30 24', 0.3)}</Animated.View>
      <Logo size={size * 0.62} />
    </View>
  );
}
