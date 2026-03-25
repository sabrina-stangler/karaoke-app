export interface Session {
  id: string;
  code: string;
  dj_name?: string;
  status: 'active' | 'ended';
  inserted_at: string;
  updated_at: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  session_id: string;
}

export interface QueueEntry {
  id: string;
  singer_name: string;
  status: 'pending' | 'completed' | 'skipped';
  position: number;
  completed_at?: string;
  session_id: string;
  song_id: string;
  song?: Song;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  errors?: Record<string, string[]>;
  error?: string;
}
