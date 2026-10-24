// Informações gerais do app Distraction Block. Troque aqui uma vez e o app inteiro é atualizado.

// Site (o mesmo do computador)
export const SITE_URL = 'https://distractionblock.vercel.app';

// ===== Supabase (login na nuvem) =====
// Copie do painel do Supabase, no projeto do Distraction Block (o mesmo que o site usa):
//   Project Settings → API (ou "Connect"): o "Project URL" e a "Publishable key" (sb_publishable_...).
// As duas PODEM ficar no app: quem protege os dados são as regras (RLS) do banco.
// NUNCA coloque aqui a chave secreta (service_role / sb_secret_...).
// Enquanto ficarem vazias, a conta fica só neste celular, como no site sem servidor.
export const SUPABASE_URL = '';
export const SUPABASE_CHAVE_PUBLICA = '';
