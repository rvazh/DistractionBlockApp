import { useCallback, useState } from 'react';

import type { Resultado } from '@/lib/store';

export type Mensagem = { tipo: 'ok' | 'erro'; texto: string } | null;

/** Guarda a última mensagem de sucesso/erro para mostrar na tela. */
export function useFeedback() {
  const [mensagem, setMensagem] = useState<Mensagem>(null);
  const mostrar = useCallback((r: Resultado) => {
    if (r.ok) setMensagem(r.aviso ? { tipo: 'ok', texto: r.aviso } : null);
    else setMensagem({ tipo: 'erro', texto: r.erro });
    return r.ok;
  }, []);
  const limpar = useCallback(() => setMensagem(null), []);
  return { mensagem, mostrar, limpar };
}
