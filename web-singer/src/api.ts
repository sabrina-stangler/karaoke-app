import { Session, Song, QueueEntry, ApiResponse } from './types';

const API_BASE = 'http://localhost:4000/api';

class ApiService {
  async getSessionByCode(code: string): Promise<Session> {
    const response = await fetch(`${API_BASE}/sessions/${code}`);
    if (!response.ok) throw new Error('Session not found or not active');
    const data: ApiResponse<Session> = await response.json();
    return data.data;
  }

  async getSongs(sessionId: string): Promise<Song[]> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/songs`);
    if (!response.ok) throw new Error('Failed to fetch songs');
    const data: ApiResponse<Song[]> = await response.json();
    return data.data;
  }

  async searchSongs(sessionId: string, query: string): Promise<Song[]> {
    const response = await fetch(
      `${API_BASE}/sessions/${sessionId}/songs/search?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error('Failed to search songs');
    const data: ApiResponse<Song[]> = await response.json();
    return data.data;
  }

  async getQueue(sessionId: string): Promise<QueueEntry[]> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/queue`);
    if (!response.ok) throw new Error('Failed to fetch queue');
    const data: ApiResponse<QueueEntry[]> = await response.json();
    return data.data;
  }

  async createQueueEntry(
    sessionId: string,
    songId: string,
    singerName: string
  ): Promise<QueueEntry> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: songId, singer_name: singerName }),
    });
    if (!response.ok) throw new Error('Failed to submit song request');
    const data: ApiResponse<QueueEntry> = await response.json();
    return data.data;
  }
}

export const apiService = new ApiService();
