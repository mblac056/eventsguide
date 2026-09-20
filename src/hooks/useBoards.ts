import { useCallback, useEffect, useState } from 'react';
import { loadBoards } from '../lib/sheets';
import type { BoardSummary } from '../lib/boardsApi';

interface State {
  boards: BoardSummary[];
  isMock: boolean;
  loading: boolean;
  error: string | null;
}

export function useBoards() {
  const [state, setState] = useState<State>({
    boards: [],
    isMock: false,
    loading: true,
    error: null,
  });

  const runFetch = useCallback(() => {
    loadBoards()
      .then((data) =>
        setState({
          boards: data.boards,
          isMock: data.isMock,
          loading: false,
          error: null,
        }),
      )
      .catch((err: unknown) =>
        setState({
          boards: [],
          isMock: false,
          loading: false,
          error: err instanceof Error ? err.message : "Couldn't load the schedule.",
        }),
      );
  }, []);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    runFetch();
  }, [runFetch]);

  useEffect(() => {
    runFetch();
  }, [runFetch]);

  return { ...state, reload };
}
