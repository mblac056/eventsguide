import { Link } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { useBoards } from '../hooks/useBoards';

export function HomePage() {
  const { boards, isMock, loading, error, reload } = useBoards();

  return (
    <div className="app">
      <Topbar subtitle="All events" onRefresh={reload} />

      {isMock && (
        <div className="banner">
          Showing <strong>sample data</strong>. Run <code>npm run dev:live</code> to load your folder.
        </div>
      )}

      <main className="content">
        {loading && <div className="state state--loading">Loading events…</div>}

        {error && (
          <div className="state state--error">
            <p>{error}</p>
            <button className="btn" onClick={reload}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && boards.length === 0 && (
          <div className="empty">No events yet.</div>
        )}

        {!loading && !error && boards.length > 0 && (
          <nav className="board-list" aria-label="Events">
            {boards.map((board) => (
              <Link key={board.slug} className="board-list__link" to={`/${board.slug}`}>
                {board.title}
              </Link>
            ))}
          </nav>
        )}
      </main>
    </div>
  );
}
