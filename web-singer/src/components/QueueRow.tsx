import { QueueEntry } from '../types';

interface QueueRowProps {
  entry: QueueEntry;
  isMine?: boolean;
  showStatus?: boolean;
}

export function QueueRow({ entry, isMine = false, showStatus = false }: QueueRowProps) {
  return (
    <div className={`queue-row ${isMine ? 'queue-row-mine' : ''}`}>
      <div className="queue-position-col">
        <span className="queue-position">{entry.position}</span>
        {showStatus && entry.status === 'completed' && (
          <span className="badge badge-completed" title="Completed">✓</span>
        )}
        {showStatus && entry.status === 'skipped' && (
          <span className="badge badge-skipped" title="Skipped">⏭</span>
        )}
      </div>
      <div className="queue-song">
        <span className="queue-title">{entry.song?.title ?? 'Unknown'}</span>
        <span className="queue-artist">{entry.song?.artist ?? ''}</span>
        <span className="queue-singer">{entry.singer_name}</span>
      </div>
    </div>
  );
}
