import { useState, useEffect } from 'react';
import { QueueEntry } from '../types';
import { apiService } from '../api';
import './QueueDisplay.css';

interface QueueDisplayProps {
  sessionId: string;
  onQueueUpdated?: (queue: QueueEntry[]) => void;
}

export function QueueDisplay({ sessionId, onQueueUpdated }: QueueDisplayProps) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending'>('all');

  useEffect(() => {
    loadQueue();
  }, [sessionId]);

  const loadQueue = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getQueue(sessionId);
      setQueue(data);
      onQueueUpdated?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (entryId: string) => {
    try {
      await apiService.completeQueueEntry(entryId);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete entry');
    }
  };

  const handleSkip = async (entryId: string) => {
    try {
      await apiService.skipQueueEntry(entryId);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip entry');
    }
  };

  const filteredQueue = filter === 'pending'
    ? queue.filter(entry => entry.status === 'pending')
    : queue;

  const pendingCount = queue.filter(entry => entry.status === 'pending').length;

  return (
    <div className="queue-display">
      <div className="queue-header">
        <h2>🎤 Request Queue</h2>
        <div className="queue-controls">
          <span className="queue-count">
            {pendingCount} pending
          </span>
          <div className="filter-buttons">
            <button
              onClick={() => setFilter('all')}
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All ({queue.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Pending ({pendingCount})
            </button>
          </div>
          <button onClick={loadQueue} className="btn btn-secondary btn-sm">
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="loading">Loading queue...</div>
      ) : filteredQueue.length === 0 ? (
        <div className="empty-state">
          <p>No song requests yet.</p>
          <p>Singers can request songs by joining with your session code!</p>
        </div>
      ) : (
        <div className="queue-list">
          {filteredQueue.map((entry, index) => (
            <div
              key={entry.id}
              className={`queue-item ${entry.status}`}
            >
              <div className="queue-item-position">
                {filter === 'all' ? entry.position + 1 : index + 1}
              </div>

              <div className="queue-item-content">
                <div className="queue-item-song">
                  <span className="song-title">{entry.song?.title || 'Unknown Song'}</span>
                  <span className="song-artist">{entry.song?.artist || 'Unknown Artist'}</span>
                </div>
                <div className="queue-item-singer">
                  <span className="singer-label">Singer:</span>
                  <span className="singer-name">{entry.singer_name}</span>
                </div>
              </div>

              <div className="queue-item-status">
                {entry.status === 'pending' ? (
                  <span className="status-badge pending">⏳ Pending</span>
                ) : entry.status === 'completed' ? (
                  <span className="status-badge completed">✅ Completed</span>
                ) : (
                  <span className="status-badge skipped">⏭️ Skipped</span>
                )}
              </div>

              {entry.status === 'pending' && (
                <div className="queue-item-actions">
                  <button
                    onClick={() => handleComplete(entry.id)}
                    className="btn btn-success btn-sm"
                    title="Mark as completed"
                  >
                    ✓ Complete
                  </button>
                  <button
                    onClick={() => handleSkip(entry.id)}
                    className="btn btn-warning btn-sm"
                    title="Skip this entry"
                  >
                    ⏭ Skip
                  </button>
                </div>
              )}

              {entry.completed_at && (
                <div className="queue-item-timestamp">
                  Completed: {new Date(entry.completed_at).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
