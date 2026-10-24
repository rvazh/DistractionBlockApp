import { Redirect } from 'expo-router';

// A aba Planos virou Mensagens. O seu plano agora fica em Ajustes. Pode apagar este arquivo.
export default function Planos() {
  return <Redirect href="/mensagens" />;
}
