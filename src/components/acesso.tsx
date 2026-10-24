// Tela de acesso: só e-mail, senha e o botão Entrar.
// Abaixo, as outras formas de entrar: digital / senha do celular e criar conta.
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/marca';
import { Aviso, Button, Feedback, Field, LinkTexto, Txt } from '@/components/ui-kit';
import { F, Spacing, type Cores } from '@/constants/theme';
import { useFeedback } from '@/hooks/use-feedback';
import { verificarBiometria, type Disponibilidade } from '@/lib/biometria';
import { NUVEM_ATIVA } from '@/lib/nuvem';
import { useStore } from '@/lib/store';
import { useEstilos } from '@/lib/tema';

/** Decide qual tela de acesso mostrar: entrar (padrão) ou criar conta. */
export function TelaAcesso() {
  const { estado } = useStore();
  const [criando, setCriando] = useState(false);
  if (criando && !estado.conta) return <Cadastro onVoltar={() => setCriando(false)} />;
  return <Entrar onCriarConta={estado.conta ? undefined : () => setCriando(true)} />;
}

function Moldura({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const s = useEstilos(criar);
  return (
    <KeyboardAvoidingView style={s.fundo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.conteudo, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}>
        <View style={s.caixa}>
          <View style={s.logo}>
            <Logo size={112} />
          </View>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Entrar({ onCriarConta }: { onCriarConta?: () => void }) {
  const { estado, entrar, entrarComCelular } = useStore();
  const conta = estado.conta;
  const s = useEstilos(criar);
  const { mensagem, mostrar } = useFeedback();
  const [email, setEmail] = useState(conta?.email ?? '');
  const [senha, setSenha] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [disp, setDisp] = useState<Disponibilidade | null>(null);

  useEffect(() => {
    verificarBiometria().then(setDisp);
  }, []);

  // Se a pessoa escolheu entrar com a digital (Ajustes), já pede ao abrir.
  const pediu = useRef(false);
  useEffect(() => {
    if (conta?.modoEntrada === 'biometria' && disp?.ok && !pediu.current) {
      pediu.current = true;
      entrarComCelular().then((r) => {
        if (!r.ok) mostrar(r);
      });
    }
  }, [conta, disp, entrarComCelular, mostrar]);

  async function enviar() {
    setOcupado(true);
    // Sem a caixa "manter conectado": quem entra fica conectado até tocar em Sair.
    const r = await entrar(email, senha, true);
    setOcupado(false);
    if (!r.ok) mostrar(r);
  }

  async function comCelular() {
    const r = await entrarComCelular();
    if (!r.ok) mostrar(r);
  }

  return (
    <Moldura>
      <View style={s.campos}>
        <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <Field
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={enviar}
        />
        <Feedback resultado={mensagem} />
        <Button grande title={ocupado ? 'Entrando…' : 'Entrar'} onPress={enviar} loading={ocupado} disabled={!email || !senha} />
      </View>

      <View style={s.opcoes}>
        {conta && disp?.ok ? <LinkTexto title={`Entrar com ${disp.nome}`} onPress={comCelular} /> : null}
        {onCriarConta ? <LinkTexto title="Não tem conta? Criar conta" onPress={onCriarConta} /> : null}
      </View>
    </Moldura>
  );
}

function Cadastro({ onVoltar }: { onVoltar: () => void }) {
  const { criarConta } = useStore();
  const s = useEstilos(criar);
  const { mensagem, mostrar } = useFeedback();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function enviar() {
    if (senha !== confirmar) {
      mostrar({ ok: false, erro: 'As senhas não conferem.' });
      return;
    }
    setOcupado(true);
    const r = await criarConta({ nome, email, senha });
    setOcupado(false);
    if (!r.ok) mostrar(r);
  }

  return (
    <Moldura>
      <View style={s.campos}>
        <Field label="Nome" value={nome} onChangeText={setNome} autoCapitalize="words" autoComplete="name" />
        <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <Field label="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="new-password" />
        <Field label="Confirmar senha" value={confirmar} onChangeText={setConfirmar} secureTextEntry autoComplete="new-password" />
        <Aviso>
          A senha também é pedida para concluir desbloqueios. Não existe recuperação de senha, e isso é de propósito.
        </Aviso>
        <Feedback resultado={mensagem} />
        <Button
          grande
          title={ocupado ? 'Criando…' : 'Criar conta'}
          onPress={enviar}
          loading={ocupado}
          disabled={!nome || !email || !senha || !confirmar}
        />
      </View>
      <View style={s.opcoes}>
        <LinkTexto title="Já tenho conta. Entrar" onPress={onVoltar} />
        <Txt style={s.dica}>
          {NUVEM_ATIVA ? 'A conta fica guardada com segurança no servidor.' : 'A conta fica só neste celular.'}
        </Txt>
      </View>
    </Moldura>
  );
}

function criar(c: Cores) {
  return StyleSheet.create({
    fundo: { flex: 1, backgroundColor: c.background },
    conteudo: { paddingHorizontal: Spacing.four, alignItems: 'center', flexGrow: 1, justifyContent: 'center' },
    caixa: { width: '100%', maxWidth: 380 },
    logo: { alignItems: 'center', marginBottom: 36 },
    campos: { gap: 14 },
    opcoes: { alignItems: 'center', gap: 14, marginTop: 22 },
    dica: { color: c.dim, fontSize: 12, fontFamily: F.regular },
  });
}
