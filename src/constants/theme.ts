/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Identidade do Distraction Block: as mesmas cores do site (src/styles/global.css e estilos.css).
// Preto e branco, como a logo. O vermelho só marca o que está bloqueado.
const ESCURO = {
  // nomes usados pelos componentes do modelo do Expo
  text: '#f3f3f3',
  background: '#070707',
  backgroundElement: '#0e0e0e',
  backgroundSelected: '#1b1b1b',
  textSecondary: '#8d8d8d',
  // nomes do site
  surface: '#0e0e0e',
  surface2: '#141414',
  surface3: '#1b1b1b',
  border: '#242424',
  borderStrong: '#383838',
  dim: '#5c5c5c',
  accent: '#ffffff', // cor de destaque
  onAccent: '#000000', // texto em cima da cor de destaque
  danger: '#ff4a3d',
  dangerSoft: 'rgba(255, 74, 61, 0.12)',
};

const CLARO: typeof ESCURO = {
  text: '#141414',
  background: '#f1f1ee',
  backgroundElement: '#ffffff',
  backgroundSelected: '#ececea',
  textSecondary: '#5e5e5a',
  surface: '#ffffff',
  surface2: '#f7f7f4',
  surface3: '#ececea',
  border: '#e0e0db',
  borderStrong: '#c6c6c0',
  dim: '#8a8a85',
  accent: '#141414',
  onAccent: '#ffffff',
  danger: '#d4322a',
  dangerSoft: 'rgba(212, 50, 42, 0.1)',
};

export type Cores = typeof ESCURO & {
  /** Fundo dos cartões (fica translúcido quando há imagem de fundo). */
  card: string;
  escuro: boolean;
};

export type TemaId = 'escuro' | 'claro';
export type CorId = 'neutro' | 'dourado' | 'verde' | 'azul' | 'lilas' | 'coral';

/** As mesmas cores de destaque do site (no tema claro ficam mais escuras, para dar leitura). */
export const CORES_DESTAQUE: { id: CorId; nome: string; escuro: string; claro: string }[] = [
  { id: 'neutro', nome: 'Neutro', escuro: '#ffffff', claro: '#141414' },
  { id: 'dourado', nome: 'Dourado', escuro: '#eaaf5a', claro: '#95620c' },
  { id: 'verde', nome: 'Verde', escuro: '#5fd38d', claro: '#1d7a45' },
  { id: 'azul', nome: 'Azul', escuro: '#6cb6ff', claro: '#1f5fbf' },
  { id: 'lilas', nome: 'Lilás', escuro: '#b39dff', claro: '#5b45c4' },
  { id: 'coral', nome: 'Coral', escuro: '#ff8a6b', claro: '#bd4328' },
];

function comTransparencia(hex: string, alfa: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

export function montarCores(tema: TemaId, cor: CorId, comFundo: boolean): Cores {
  const base = tema === 'claro' ? CLARO : ESCURO;
  const destaque = CORES_DESTAQUE.find((c) => c.id === cor) ?? CORES_DESTAQUE[0];
  return {
    ...base,
    accent: destaque[tema],
    card: comFundo ? comTransparencia(base.surface, 0.84) : base.surface,
    escuro: tema === 'escuro',
  };
}

// Cores fixas do tema escuro padrão (usadas pelos componentes do modelo do Expo e antes de carregar).
export const Colors = {
  light: ESCURO,
  dark: ESCURO,
} as const;

export const Brand = ESCURO;

// Fontes do site: Chakra Petch (texto) e JetBrains Mono (rótulos técnicos).
// No celular cada peso é uma fonte separada, carregada em src/app/_layout.tsx.
export const F = {
  regular: 'ChakraPetch_400Regular',
  medium: 'ChakraPetch_500Medium',
  semibold: 'ChakraPetch_600SemiBold',
  bold: 'ChakraPetch_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export const Radius = 4;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
