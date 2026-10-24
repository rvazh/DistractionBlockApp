import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, F, MaxContentWidth, Radius, Spacing, type Cores } from '@/constants/theme';
import { useStore } from '@/lib/store';
import { useCores, useEstilos } from '@/lib/tema';

/** Texto com a fonte do site (Chakra Petch). Use no lugar de <Text>. */
export function Txt({ style, ...props }: TextProps) {
  const c = useCores();
  return <Text {...props} style={[{ fontFamily: F.regular, color: c.text }, style]} />;
}

/** Rótulo técnico em caixa alta, como as marcações da mira (classe .tag do site). */
export function Tag({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const s = useEstilos(criar);
  return <Text style={[s.tag, style]}>{children}</Text>;
}

/** Selo "Pro" dos recursos do plano Pro. */
export function SeloPro() {
  const s = useEstilos(criar);
  return (
    <View style={s.selo}>
      <Text style={s.seloTexto}>Pro</Text>
    </View>
  );
}

/** Imagem de fundo escolhida em Ajustes › Estilo, escurecida pela cor de fundo. */
function Fundo() {
  const { estado } = useStore();
  const c = useCores();
  const { fundo, escurecer } = estado.estilo;
  if (!fundo) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={{ uri: fundo }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background, opacity: escurecer }]} />
    </View>
  );
}

export function Screen({
  tag,
  title,
  subtitle,
  header,
  right,
  children,
}: {
  tag?: string;
  title: string;
  subtitle?: string;
  header?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const s = useEstilos(criar);
  return (
    <View style={s.screen}>
      <Fundo />
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          s.screenContent,
          {
            // No navegador, a barra de abas fica por cima, no topo.
            paddingTop: insets.top + (Platform.OS === 'web' ? 88 : Spacing.three),
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}>
        <View style={s.inner}>
          {header}
          {tag ? <Tag>{tag}</Tag> : null}
          <View style={s.tituloLinha}>
            <Txt style={[s.title, { flex: 1 }]}>{title}</Txt>
            {right}
          </View>
          {subtitle ? <Txt style={s.subtitle}>{subtitle}</Txt> : null}
          <View style={s.body}>{children}</View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Cantoneiras de visor (as bordas nos cantos dos cartões do site). */
export function Cantoneiras({ tamanho = 12 }: { tamanho?: number }) {
  const c = useCores();
  const base = { position: 'absolute' as const, width: tamanho, height: tamanho, borderColor: c.accent };
  return (
    <>
      <View pointerEvents="none" style={[base, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 }]} />
      <View pointerEvents="none" style={[base, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 }]} />
    </>
  );
}

export function Card({
  children,
  destaque,
  style,
}: {
  children: ReactNode;
  /** Mostra as cantoneiras (classe .card.frame do site). */
  destaque?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const s = useEstilos(criar);
  return (
    <View style={[s.card, style]}>
      {children}
      {destaque ? <Cantoneiras /> : null}
    </View>
  );
}

export function CardTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  const s = useEstilos(criar);
  return (
    <View style={{ gap: 2 }}>
      <Txt style={s.cardTitle}>{children}</Txt>
      {sub ? <Txt style={s.small}>{sub}</Txt> : null}
    </View>
  );
}

/** Título do cartão à esquerda e algo (selo, botão) à direita. */
export function CardHead({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1 }}>{children}</View>
      {right}
    </View>
  );
}

export function Paragraph({ children, muted }: { children: ReactNode; muted?: boolean }) {
  const s = useEstilos(criar);
  return <Txt style={[s.paragraph, muted && s.muted]}>{children}</Txt>;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  grande,
  pequeno,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  grande?: boolean;
  pequeno?: boolean;
}) {
  const c = useCores();
  const s = useEstilos(criar);
  const cores = {
    primary: { bg: c.accent, fg: c.onAccent, border: c.accent },
    secondary: { bg: 'transparent', fg: c.text, border: c.borderStrong },
    danger: { bg: 'transparent', fg: c.danger, border: c.danger },
    ghost: { bg: 'transparent', fg: c.textSecondary, border: 'transparent' },
  }[variant];
  const inativo = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [
        s.button,
        grande && { minHeight: 48 },
        pequeno && { minHeight: 32, paddingHorizontal: 12 },
        { backgroundColor: cores.bg, borderColor: cores.border },
        pressed && (variant === 'primary' ? { opacity: 0.85 } : { borderColor: c.accent }),
        inativo && { opacity: 0.4 },
      ]}>
      {loading ? (
        <ActivityIndicator color={cores.fg} />
      ) : (
        <Text style={[s.buttonText, grande && { fontSize: 15 }, pequeno && { fontSize: 13 }, { color: cores.fg }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

/** Link de texto sublinhado (classe .link-botao do site). */
export function LinkTexto({ title, onPress }: { title: string; onPress: () => void }) {
  const s = useEstilos(criar);
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="link">
      <Txt style={s.link}>{title}</Txt>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label?: string }) {
  const c = useCores();
  const s = useEstilos(criar);
  const [foco, setFoco] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Tag>{label}</Tag> : null}
      <TextInput
        placeholderTextColor={c.dim}
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={c.accent}
        {...props}
        onFocus={(e) => {
          setFoco(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFoco(false);
          props.onBlur?.(e);
        }}
        style={[s.input, foco && { borderColor: c.accent }, props.style]}
      />
    </View>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; pro?: boolean }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const s = useEstilos(criar);
  return (
    <View style={s.segmented}>
      {options.map((o) => {
        const ativo = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            onPress={() => onChange(o.value)}
            style={[s.segment, ativo && s.segmentAtivo]}>
            <Text style={[s.segmentText, ativo && s.segmentTextAtivo]}>{o.label}</Text>
            {o.pro ? (
              <View style={[s.selo, { paddingHorizontal: 3, paddingVertical: 0 }, ativo && s.seloAtivo]}>
                <Text style={[s.seloTexto, { fontSize: 7 }, ativo && s.seloTextoAtivo]}>Pro</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Chip tracejado do site. `adicionar` mostra o "+" na frente; `ativo` é a opção escolhida. */
export function Chip({
  label,
  onPress,
  ativo,
  adicionar,
}: {
  label: string;
  onPress?: () => void;
  ativo?: boolean;
  adicionar?: boolean;
}) {
  const c = useCores();
  const s = useEstilos(criar);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        s.chip,
        ativo && s.chipAtivo,
        pressed && !ativo && { borderStyle: 'solid', borderColor: c.accent },
      ]}>
      <Text style={[s.chipText, ativo && { color: c.onAccent }]}>
        {adicionar ? <Text style={{ color: c.dim }}>+ </Text> : null}
        {label}
      </Text>
    </Pressable>
  );
}

/** Selo pequeno (classe .pill do site). */
export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'ok' | 'warn' | 'danger' }) {
  const c = useCores();
  const s = useEstilos(criar);
  if (tone === 'ok') {
    return (
      <View style={[s.badge, { backgroundColor: c.accent, borderColor: c.accent }]}>
        <Text style={[s.badgeText, { color: c.onAccent }]}>{label}</Text>
      </View>
    );
  }
  const cor = { neutral: c.textSecondary, warn: c.text, danger: c.danger }[tone];
  return (
    <View
      style={[
        s.badge,
        { borderColor: tone === 'danger' ? c.danger : c.borderStrong },
        tone === 'danger' && { backgroundColor: c.dangerSoft },
        tone === 'warn' && { borderStyle: 'dashed' },
      ]}>
      <Text style={[s.badgeText, { color: cor }]}>{label}</Text>
    </View>
  );
}

/** Bolinha de status do menu do site: acesa ou de alerta (vermelha). */
export function Ponto({ ligado, alerta }: { ligado?: boolean; alerta?: boolean }) {
  const c = useCores();
  const s = useEstilos(criar);
  return (
    <View
      style={[
        s.ponto,
        ligado && { backgroundColor: c.accent, borderColor: c.accent },
        alerta && { backgroundColor: c.danger, borderColor: c.danger },
      ]}
    />
  );
}

/** Interruptor no formato do site (.switch). */
export function Interruptor({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const c = useCores();
  const s = useEstilos(criar);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      style={[s.switch, value && { backgroundColor: c.accent, borderColor: c.accent }]}>
      <View style={[s.switchBola, value && { transform: [{ translateX: 20 }], backgroundColor: c.onAccent }]} />
    </Pressable>
  );
}

export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const s = useEstilos(criar);
  return (
    <View style={s.toggleRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt style={s.toggleLabel}>{label}</Txt>
        {description ? <Txt style={s.small}>{description}</Txt> : null}
      </View>
      <Interruptor value={value} onValueChange={onValueChange} />
    </View>
  );
}

export function Feedback({ resultado }: { resultado: { tipo: 'ok' | 'erro'; texto: string } | null }) {
  const c = useCores();
  const s = useEstilos(criar);
  if (!resultado) return null;
  if (resultado.tipo === 'erro') return <Txt style={[s.feedback, { color: c.danger }]}>{resultado.texto}</Txt>;
  return (
    <View style={s.aviso}>
      <Txt style={s.feedback}>{resultado.texto}</Txt>
    </View>
  );
}

/** Caixa de aviso com borda (classe .acesso-aviso / .banner do site). */
export function Aviso({ children, tracejado }: { children: ReactNode; tracejado?: boolean }) {
  const s = useEstilos(criar);
  return (
    <View style={[s.avisoNeutro, tracejado && { borderStyle: 'dashed' }]}>
      {typeof children === 'string' ? <Txt style={s.small}>{children}</Txt> : children}
    </View>
  );
}

/** Lista vazia (classe .empty do site). */
export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  const s = useEstilos(criar);
  return (
    <View style={s.vazio}>
      <Txt style={s.vazioTitulo}>{titulo}</Txt>
      {children ? <Txt style={[s.small, { textAlign: 'center' }]}>{children}</Txt> : null}
    </View>
  );
}

export function Divider() {
  const s = useEstilos(criar);
  return <View style={s.divider} />;
}

/** Estilos pequenos de uso geral. */
export function useUi() {
  return useEstilos(criarUi);
}

function criarUi(c: Cores) {
  return StyleSheet.create({
    small: { color: c.textSecondary, fontSize: 13, lineHeight: 18, fontFamily: F.regular },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
    mono: { fontFamily: F.mono, fontSize: 13, color: c.text },
  });
}

function criar(c: Cores) {
  return StyleSheet.create({
    tag: {
      fontFamily: F.mono,
      fontSize: 11,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: c.textSecondary,
    },
    selo: {
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: 2,
      paddingHorizontal: 5,
      paddingVertical: 1,
      marginLeft: 6,
    },
    seloAtivo: { borderColor: c.onAccent },
    seloTexto: { fontFamily: F.monoMedium, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: c.accent },
    seloTextoAtivo: { color: c.onAccent },
    screen: { flex: 1, backgroundColor: c.background },
    screenContent: { paddingHorizontal: Spacing.three, alignItems: 'center' },
    inner: { width: '100%', maxWidth: MaxContentWidth, gap: 6 },
    tituloLinha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontFamily: F.bold, fontSize: 28, lineHeight: 32, letterSpacing: -0.2, color: c.text },
    subtitle: { color: c.textSecondary, fontSize: 14, lineHeight: 21 },
    body: { gap: Spacing.three, marginTop: Spacing.three },
    card: {
      position: 'relative',
      backgroundColor: c.card,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      gap: 12,
    },
    cardTitle: { fontFamily: F.semibold, fontSize: 16, lineHeight: 22, color: c.text },
    paragraph: { fontSize: 14, lineHeight: 21 },
    muted: { color: c.textSecondary },
    small: { color: c.textSecondary, fontSize: 13, lineHeight: 18 },
    link: { color: c.textSecondary, fontSize: 13, textDecorationLine: 'underline' },
    button: {
      minHeight: 42,
      borderRadius: Radius,
      borderWidth: 1,
      paddingHorizontal: Spacing.three,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: { fontFamily: F.semibold, fontSize: 14, letterSpacing: 0.5 },
    input: {
      minHeight: 44,
      borderRadius: Radius,
      borderWidth: 1,
      borderColor: c.borderStrong,
      backgroundColor: c.surface2,
      color: c.text,
      paddingHorizontal: 12,
      fontSize: 15,
      fontFamily: F.regular,
    },
    segmented: {
      flexDirection: 'row',
      backgroundColor: c.surface2,
      borderRadius: Radius,
      borderWidth: 1,
      borderColor: c.borderStrong,
      padding: 3,
      gap: 2,
    },
    segment: { flex: 1, paddingVertical: 9, borderRadius: 2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    segmentAtivo: { backgroundColor: c.accent },
    segmentText: { color: c.textSecondary, fontFamily: F.semibold, fontSize: 13 },
    segmentTextAtivo: { color: c.onAccent },
    chip: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.borderStrong,
      borderRadius: 2,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipAtivo: { backgroundColor: c.accent, borderColor: c.accent, borderStyle: 'solid' },
    chipText: { color: c.textSecondary, fontSize: 13, fontFamily: F.medium },
    badge: { borderWidth: 1, borderRadius: 2, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
    badgeText: { fontSize: 10, fontFamily: F.monoMedium, letterSpacing: 1.2, textTransform: 'uppercase' },
    ponto: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: c.textSecondary },
    switch: {
      width: 44,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borderStrong,
      backgroundColor: c.surface3,
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    switchBola: { width: 16, height: 16, borderRadius: 8, backgroundColor: c.textSecondary },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
    toggleLabel: { fontFamily: F.semibold, fontSize: 15 },
    feedback: { fontSize: 13, lineHeight: 19, fontFamily: F.medium },
    aviso: { borderWidth: 1, borderColor: c.accent, paddingHorizontal: 12, paddingVertical: 10 },
    avisoNeutro: { borderWidth: 1, borderColor: c.borderStrong, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
    vazio: { alignItems: 'center', paddingTop: 22, paddingBottom: 6, gap: 4 },
    vazioTitulo: { fontFamily: F.semibold, fontSize: 15 },
    divider: { height: 1, backgroundColor: c.border, marginVertical: Spacing.one },
  });
}
