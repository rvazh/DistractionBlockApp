import * as Crypto from 'expo-crypto';

export function novoId(): string {
  return Crypto.randomUUID();
}

export async function gerarHash(senha: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${senha}`);
}

export async function criarSenha(senha: string): Promise<{ hash: string; salt: string }> {
  const salt = Crypto.randomUUID();
  return { hash: await gerarHash(senha, salt), salt };
}

export async function conferirSenha(senha: string, hash?: string, salt?: string): Promise<boolean> {
  if (!hash || !salt) return false;
  return (await gerarHash(senha, salt)) === hash;
}
