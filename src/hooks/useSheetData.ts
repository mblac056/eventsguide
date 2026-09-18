import { useCallback, useEffect, useState } from 'react';
import { loadSheetData } from '../lib/sheets';
import type { SheetData } from '../types';

interface State {
  data: SheetData | null;
  loading: boolean;
  error: string | null;
}

export function useSheetData() {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });

  // Only sets state from async callbacks, so it's safe to call inside an effect.
  const runFetch = useCallback(() => {
    loadSheetData()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) =>
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load schedule.',
        }),
      );
  }, []);

  // Triggered by user action (e.g. the refresh button), so a synchronous
  // setState here is fine.
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    runFetch();
  }, [runFetch]);

  useEffect(() => {
    runFetch();
  }, [runFetch]);

  return { ...state, reload };
}
