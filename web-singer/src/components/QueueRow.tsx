import { QueueEntry } from '../types';

interface QueueRowProps {
  entry: QueueEntry;
  isMine?: boolean;
  showStatus?: boolean;
  displayPosition?: number;
}

export function QueueRow({ entry, isMine = false, showStatus = false, displayPosition }: QueueRowProps) {
  const pos = displayPosition ?? entry.position;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 ${isMine ? 'bg-violet-50' : ''}`}>
      <div className="flex flex-col items-center gap-4 shrink-0">
        <span className="text-sm font-extrabold text-white bg-violet-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
          {pos}
        </span>
        {showStatus && entry.status === 'completed' && (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap leading-none bg-emerald-100 text-emerald-600" title="Completed">
            ✓
          </span>
        )}
        {showStatus && entry.status === 'skipped' && (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap leading-none bg-amber-100 text-amber-700" title="Skipped">
            ⏭
          </span>
        )}
      </div>
      <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-semibold text-gray-800 wrap-break-word text-left">{entry.song?.title ?? 'Unknown'}</span>
        <span className="text-xs text-gray-400 text-left">{entry.song?.artist ?? ''}</span>
        <span className="text-[13px] text-violet-600 font-semibold wrap-break-word text-left">{entry.singer_name}</span>
      </div>
    </div>
  );
}
