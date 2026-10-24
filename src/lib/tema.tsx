// Tema do app: as cores mudam conforme Ajustes › Estilo (tema claro/escuro, cor de destaque e imagem de fundo).
// Cada tela pega as cores com useCores() e monta os estilos com useEstilos(), para tudo mudar na hora.
import { createContext, useContext, useMemo } from 'react';

import { montarCores, type Cores } from '@/constants/theme';
import { useStore } from '@/lib/store';

const TemaContext = createContext<Cores>(montarCores('escuro', 'neutro', false));

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const { estado } = useStore();
  const { tema, cor, fundo } = estado.estilo;
  const cores = useMemo(() => montarCores(tema, cor, Boolean(fundo)), [tema, cor, fundo]);
  return <TemaContext.Provider value={cores}>{children}</TemaContext.Provider>;
}

export function useCores(): Cores {
  return useContext(TemaContext);
}

/** Monta os estilos com as cores atuais. Use: const s = useEstilos(criarEstilos). */
export function useEstilos<T>(criar: (c: Cores) => T): T {
  const cores = useCores();
  return useMemo(() => criar(cores), [criar, cores]);
}
