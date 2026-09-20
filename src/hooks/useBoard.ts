import { useCallback, useEffect, useState } from 'react';
import { loadBoard, NotFoundError } from '../lib/sheets';
import type { SheetData } from '../types';

interface State {
  data: SheetData | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useBoard(slug: string) {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
    notFound: false,
  });

  const runFetch = useCallback(() => {
    loadBoard(slug)
      .then((data) => setState({ data, loading: false, error: null, notFound: false }))
      .catch((err: unknown) =>
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Couldn't load the schedule.",
          notFound: err instanceof NotFoundError,
        }),
      );
  }, [slug]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null, notFound: false }));
    runFetch();
  }, [runFetch]);

  useEffect(() => {
    runFetch();
  }, [runFetch]);

  return { ...state, reload };
}
