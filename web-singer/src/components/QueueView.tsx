import { useState, useEffect, useCallback } from 'react';
import { QueueEntry } from '../types';
import { apiService } from '../api';
import { QueueRow } from './QueueRow';

declare global {
  interface Window {
    __singerSetQueue?: React.Dispatch<React.SetStateAction<QueueEntry[]>>;
  }
}

interface QueueViewProps {
  sessionId: string;
  singerName: string;
  refreshTrigger: number;
}

export function QueueView({ sessionId, singerName, refreshTrigger }: QueueViewProps) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showMineOnly, setShowMineOnly] = useState(false);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getQueue(sessionId);
      setQueue(data);
    } catch {
      setError('Failed to load queue');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue, refreshTrigger]);

  // Expose setQueue so parent can push WebSocket updates
  useEffect(() => {
    window.__singerSetQueue = setQueue;
    return () => { delete window.__singerSetQueue; };
  }, []);

  const upcoming = queue.filter((e) => e.status === 'pending');
  const history = queue.filter((e) => e.status === 'completed' || e.status === 'skipped');
  const isMine = (e: QueueEntry) =>
    !!singerName && e.singer_name.toLowerCase() === singerName.toLowerCase();
  const displayedUpcoming = showMineOnly ? upcoming.filter(isMine) : upcoming;
  const displayedHistory = showMineOnly ? history.filter(isMine) : history;
  const hasMySongs = upcoming.some(isMine);

  return (
    <div className="queue-container">
      <div className="queue-header">
        <h2>Queue</h2>
        <div className="queue-header-actions">
          {hasMySongs && (
            <button
              className={`filter-btn ${showMineOnly ? 'filter-btn--active' : ''}`}
              onClick={() => setShowMineOnly((v) => !v)}
            >
              {showMineOnly ? '★ My songs' : '☆ My songs'}
            </button>
          )}
          <button className="refresh-btn" onClick={loadQueue} disabled={isLoading}>
            {isLoading ? '...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {isLoading && queue.length === 0 ? (
        <div className="loading">Loading queue...</div>
      ) : displayedUpcoming.length === 0 ? (
        <div className="empty-state">{showMineOnly ? 'No upcoming songs from you' : 'No upcoming songs'}</div>
      ) : (
        <div className="queue-list">
          {displayedUpcoming.map((entry) => (
            <QueueRow
              key={entry.id}
              entry={entry}
              isMine={isMine(entry)}
            />
          ))}
        </div>
      )}

      {displayedHistory.length > 0 && (
        <div className="history-section">
          <button className="history-toggle" onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? '▲ Hide history' : `▼ Show history (${displayedHistory.length})`}
          </button>
          {showHistory && (
            <div className="queue-list history-list">
              {displayedHistory.map((entry) => (
                <QueueRow key={entry.id} entry={entry} showStatus />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
