// Importa só os pesos usados (o pacote inteiro traria todos os pesos para dentro do app)
import { ChakraPetch_400Regular } from '@expo-google-fonts/chakra-petch/400Regular';
import { ChakraPetch_500Medium } from '@expo-google-fonts/chakra-petch/500Medium';
import { ChakraPetch_600SemiBold } from '@expo-google-fonts/chakra-petch/600SemiBold';
import { ChakraPetch_700Bold } from '@expo-google-fonts/chakra-petch/700Bold';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { TelaAcesso } from '@/components/acesso';
import AppTabs from '@/components/app-tabs';
import { TemaProvider, useCores } from '@/lib/tema';
import { StoreProvider, useStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

function TemaNavegacao({ children }: { children: React.ReactNode }) {
  const c = useCores();
  const tema = {
    ...(c.escuro ? DarkTheme : DefaultTheme),
    colors: {
      ...(c.escuro ? DarkTheme : DefaultTheme).colors,
      background: c.background,
      card: c.background,
      text: c.text,
      border: c.border,
      primary: c.accent,
    },
  };
  return (
    <ThemeProvider value={tema}>
      <StatusBar style={c.escuro ? 'light' : 'dark'} />
      {children}
    </ThemeProvider>
  );
}

function Conteudo() {
  const { carregado, estado, sessaoAtiva } = useStore();
  const [fontes, erroFontes] = useFonts({
    ChakraPetch_400Regular,
    ChakraPetch_500Medium,
    ChakraPetch_600SemiBold,
    ChakraPetch_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  const pronto = carregado && (fontes || Boolean(erroFontes));

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  if (!pronto) return null;

  // Sem conta, ou ainda sem login nesta vez: mostra a tela de acesso.
  const precisaEntrar = !estado.conta || !sessaoAtiva;
  return precisaEntrar ? <TelaAcesso /> : <AppTabs />;
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <TemaProvider>
        <TemaNavegacao>
          <Conteudo />
        </TemaNavegacao>
      </TemaProvider>
    </StoreProvider>
  );
}
