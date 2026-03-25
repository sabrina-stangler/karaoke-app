import { Socket, Channel } from 'phoenix';
import { QueueEntry, Song } from './types';

type QueueUpdateHandler = (queue: QueueEntry[]) => void;
type SongAddedHandler = (song: Song) => void;
type SessionEndedHandler = () => void;

class WebSocketService {
  private socket: Socket | null = null;
  private channel: Channel | null = null;
  private sessionId: string | null = null;

  connect(sessionId: string): boolean {
    if (this.socket && this.sessionId === sessionId) {
      return true; // Already connected to this session
    }

    this.disconnect();
    this.sessionId = sessionId;

    // Create socket connection
    this.socket = new Socket('ws://localhost:4000/socket', {
      params: {},
    });

    this.socket.connect();

    // Join session channel
    this.channel = this.socket.channel(`session:${sessionId}`, {});

    this.channel
      .join()
      .receive('ok', () => {
        console.log('✅ Connected to session channel');
      })
      .receive('error', (resp: unknown) => {
        console.error('❌ Failed to join channel:', resp);
      });

    // Start ping interval to keep connection alive
    setInterval(() => {
      if (this.channel) {
        this.channel.push('ping', {});
      }
    }, 30000);

    return true;
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

    this.sessionId = null;
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

  requestSong(songId: string, singerName: string) {
    if (!this.channel) {
      throw new Error('Not connected to channel');
    }

    return new Promise((resolve, reject) => {
      this.channel!
        .push('request_song', { song_id: songId, singer_name: singerName })
        .receive('ok', resolve)
        .receive('error', reject);
    });
  }
}

export { WebSocketService };
export const wsService = new WebSocketService();
