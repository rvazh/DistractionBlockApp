// ===== Nuvem (Supabase): login de verdade, igual ao do site =====
// O login (e-mail e senha) é feito pelo Supabase Auth. Os bloqueios continuam neste celular.
// Sem endereço e chave em src/config.ts, a conta fica só no aparelho.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL } from '@/config';

export const NUVEM_ATIVA = Boolean(SUPABASE_URL && SUPABASE_CHAVE_PUBLICA);

export const supabase: SupabaseClient | null = NUVEM_ATIVA
  ? createClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Traduz as mensagens de erro mais comuns do Supabase. */
export function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme o seu e-mail pelo link que enviamos antes de entrar.';
  if (m.includes('already registered')) return 'Este e-mail já tem conta. Toque em "Já tenho conta".';
  if (m.includes('password should be')) return 'A senha é fraca demais. Use pelo menos 6 caracteres.';
  if (m.includes('network') || m.includes('fetch')) return 'Sem conexão com o servidor. Confira a internet.';
  return mensagem;
}
