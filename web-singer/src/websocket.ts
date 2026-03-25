import { Socket, Channel } from 'phoenix';
import { QueueEntry, Song } from './types';

type QueueUpdateHandler = (queue: QueueEntry[]) => void;
type SongAddedHandler = (song: Song) => void;
type SessionEndedHandler = () => void;

class WebSocketService {
  private socket: Socket | null = null;
  private channel: Channel | null = null;

  connect(sessionCode: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.disconnect();

      this.socket = new Socket('ws://localhost:4000/socket', { params: {} });
      this.socket.connect();

      this.channel = this.socket.channel(`session:${sessionCode}`, {});
      this.channel
        .join()
        .receive('ok', () => resolve(true))
        .receive('error', () => resolve(false));
    });
  }

  disconnect() {
    if (this.channel) {
      this.channel.leave();
      this.channel = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onQueueUpdate(handler: QueueUpdateHandler) {
    if (!this.channel) return;
    this.channel.on('queue:updated', (payload: { queue: QueueEntry[] }) => {
      handler(payload.queue);
    });
  }

  onSongAdded(handler: SongAddedHandler) {
    if (!this.channel) return;
    this.channel.on('song:added', (payload: { song: Song }) => {
      handler(payload.song);
    });
  }

  onSessionEnded(handler: SessionEndedHandler) {
    if (!this.channel) return;
    this.channel.on('session:ended', (_payload: unknown) => {
      handler();
    });
  }
}

export const wsService = new WebSocketService();
