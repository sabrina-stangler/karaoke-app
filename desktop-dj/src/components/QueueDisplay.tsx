import { useState, useEffect } from 'react';
import { QueueEntry } from '../types';
import { apiService } from '../api';

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

  const btnBase = 'px-3 py-1.5 border-0 rounded text-sm font-medium cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 m-0 mb-4">🎤 Request Queue</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <span className="font-semibold text-[#667eea] text-base">{pendingCount} upcoming</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`${btnBase} ${filter === 'all' ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white' : 'bg-gray-500 text-white hover:bg-gray-600'}`}
            >
              All ({queue.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`${btnBase} ${filter === 'pending' ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white' : 'bg-gray-500 text-white hover:bg-gray-600'}`}
            >
              Upcoming ({pendingCount})
            </button>
          </div>
          <button onClick={loadQueue} className={`${btnBase} bg-gray-500 text-white hover:bg-gray-600`}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 px-3 py-3 rounded-lg mb-4 border-l-4 border-red-500">{error}</div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-gray-500 text-base">Loading queue...</div>
      ) : filteredQueue.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="my-2 text-base">No song requests yet.</p>
          <p className="my-2 text-base">Singers can request songs by joining with your session code!</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
          {filteredQueue.map((entry, index) => {
            const isCompleted = entry.status === 'completed';
            const isSkipped = entry.status === 'skipped';
            return (
              <div
                key={entry.id}
                className={[
                  'border-2 rounded-lg p-4 mb-3 flex items-center gap-4 transition-all',
                  isCompleted
                    ? 'opacity-70 bg-green-50 border-green-400'
                    : isSkipped
                    ? 'opacity-60 bg-amber-50 border-amber-400'
                    : 'bg-white border-gray-200 hover:border-[#667eea] hover:shadow-md',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-10 h-10 flex items-center justify-center rounded-full text-white font-bold text-lg shrink-0',
                    isCompleted
                      ? 'bg-green-500'
                      : isSkipped
                      ? 'bg-amber-400'
                      : 'bg-gradient-to-br from-[#667eea] to-[#764ba2]',
                  ].join(' ')}
                >
                  {filter === 'all' ? entry.position + 1 : index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    <span className="block font-semibold text-base text-gray-800 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {entry.song?.title || 'Unknown Song'}
                    </span>
                    <span className="block text-gray-500 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                      {entry.song?.artist || 'Unknown Artist'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Singer:</span>
                    <span className="font-semibold text-[#667eea]">{entry.singer_name}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {entry.status === 'pending' ? (
                    <span className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-blue-50 text-blue-700">⏳ Upcoming</span>
                  ) : entry.status === 'completed' ? (
                    <span className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-green-50 text-green-800">✅ Completed</span>
                  ) : (
                    <span className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-orange-50 text-orange-800">⏭️ Skipped</span>
                  )}
                </div>

                {entry.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleComplete(entry.id)}
                      className={`${btnBase} bg-green-500 text-white hover:bg-green-600`}
                      title="Mark as completed"
                    >
                      ✓ Complete
                    </button>
                    <button
                      onClick={() => handleSkip(entry.id)}
                      className={`${btnBase} bg-amber-400 text-white hover:bg-amber-500`}
                      title="Skip this entry"
                    >
                      ⏭ Skip
                    </button>
                  </div>
                )}

                {entry.completed_at && (
                  <div className="text-xs text-gray-400 mt-2">
                    Completed: {new Date(entry.completed_at).toLocaleTimeString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
