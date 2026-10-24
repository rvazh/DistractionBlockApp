// Imagem de fundo (Ajustes › Estilo): escolhe uma foto e guarda uma cópia dentro do app.
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export async function escolherImagemDeFundo(): Promise<{ uri?: string; erro?: string }> {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [9, 16],
    quality: 0.7,
  });
  if (r.canceled || !r.assets?.length) return {};
  const origem = r.assets[0].uri;
  if (Platform.OS === 'web') return { uri: origem };
  try {
    const pasta = new Directory(Paths.document, 'fundo');
    if (!pasta.exists) pasta.create();
    const destino = new File(pasta, `fundo-${Date.now()}.jpg`);
    await new File(origem).copy(destino);
    return { uri: destino.uri };
  } catch {
    return { erro: 'Não foi possível guardar a imagem. Tente outra foto.' };
  }
}

export function apagarImagemDeFundo(uri?: string) {
  if (!uri || Platform.OS === 'web') return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    /* ignora */
  }
}
