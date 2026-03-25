import { useState, useEffect, useCallback } from 'react';
import { QueueEntry } from '../types';
import { apiService } from '../api';

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

  const pendingQueue = queue.filter((e) => e.status === 'pending');
  const myEntries = pendingQueue.filter(
    (e) => singerName && e.singer_name.toLowerCase() === singerName.toLowerCase()
  );

  const statusBadge = (status: QueueEntry['status']) => {
    const cls = {
      pending: 'badge-pending',
      completed: 'badge-completed',
      skipped: 'badge-skipped',
    }[status];
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  return (
    <div className="queue-container">
      <div className="queue-header">
        <h2>Queue</h2>
        <button className="refresh-btn" onClick={loadQueue} disabled={isLoading}>
          {isLoading ? '...' : '↻ Refresh'}
        </button>
      </div>

      {myEntries.length > 0 && (
        <div className="my-entries">
          <h3>Your requests</h3>
          {myEntries.map((entry) => (
            <div key={entry.id} className="my-entry-row">
              <span className="entry-position">#{entry.position}</span>
              <div className="entry-song">
                <span className="entry-title">{entry.song?.title ?? 'Unknown'}</span>
                <span className="entry-artist">{entry.song?.artist ?? ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {isLoading && queue.length === 0 ? (
        <div className="loading">Loading queue...</div>
      ) : pendingQueue.length === 0 ? (
        <div className="empty-state">Queue is empty</div>
      ) : (
        <div className="queue-list">
          {pendingQueue.map((entry) => (
            <div
              key={entry.id}
              className={`queue-row ${singerName && entry.singer_name.toLowerCase() === singerName.toLowerCase() ? 'queue-row-mine' : ''}`}
            >
              <span className="queue-position">{entry.position}</span>
              <div className="queue-song">
                <span className="queue-title">{entry.song?.title ?? 'Unknown'}</span>
                <span className="queue-artist">{entry.song?.artist ?? ''}</span>
              </div>
              <span className="queue-singer">{entry.singer_name}</span>
              {statusBadge(entry.status)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
