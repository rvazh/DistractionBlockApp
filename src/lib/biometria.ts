// Entrar com digital, rosto ou a senha de bloqueio do próprio celular.
import * as LocalAuthentication from 'expo-local-authentication';

export type Disponibilidade = { ok: true; nome: string } | { ok: false; motivo: string };

export async function verificarBiometria(): Promise<Disponibilidade> {
  try {
    const nivel = await LocalAuthentication.getEnrolledLevelAsync();
    if (nivel === LocalAuthentication.SecurityLevel.NONE) {
      return {
        ok: false,
        motivo: 'Este celular não tem digital, rosto nem senha de bloqueio cadastrados. Cadastre nas configurações do aparelho.',
      };
    }
    const tipos = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const temBiometria = nivel !== LocalAuthentication.SecurityLevel.SECRET;
    let nome = 'senha do celular';
    if (temBiometria && tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) nome = 'digital';
    else if (temBiometria && tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) nome = 'rosto';
    return { ok: true, nome };
  } catch {
    return { ok: false, motivo: 'Este aparelho não permite entrar com digital ou senha do celular.' };
  }
}

export async function autenticarNoCelular(mensagem = 'Entrar no Distraction Block'): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: mensagem,
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar senha do celular',
      disableDeviceFallback: false,
    });
    return r.success;
  } catch {
    return false;
  }
}
