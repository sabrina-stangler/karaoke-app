import { Session, Song, QueueEntry, ApiResponse } from './types';

const API_BASE = 'http://localhost:4000/api';

class ApiService {
  // Session endpoints
  async createSession(djName?: string): Promise<Session> {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dj_name: djName }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create session');
    }
    
    const data: ApiResponse<Session> = await response.json();
    return data.data;
  }

  async getSessionByCode(code: string): Promise<Session> {
    const response = await fetch(`${API_BASE}/sessions/${code}`);
    
    if (!response.ok) {
      throw new Error('Session not found');
    }
    
    const data: ApiResponse<Session> = await response.json();
    return data.data;
  }

  async endSession(sessionId: string): Promise<Session> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/end`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Failed to end session');
    }
    
    const data: ApiResponse<Session> = await response.json();
    return data.data;
  }

  // Song endpoints
  async getSongs(sessionId: string): Promise<Song[]> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/songs`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch songs');
    }
    
    const data: ApiResponse<Song[]> = await response.json();
    return data.data;
  }

  async createSongsBulk(sessionId: string, songs: Partial<Song>[]): Promise<number> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/songs/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songs }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create songs');
    }
    
    const data = await response.json();
    return data.message.match(/\d+/)?.[0] || 0;
  }

  async searchSongs(sessionId: string, query: string): Promise<Song[]> {
    const response = await fetch(
      `${API_BASE}/sessions/${sessionId}/songs/search?query=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to search songs');
    }
    
    const data: ApiResponse<Song[]> = await response.json();
    return data.data;
  }

  // Queue endpoints
  async getQueue(sessionId: string): Promise<QueueEntry[]> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/queue`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch queue');
    }
    
    const data: ApiResponse<QueueEntry[]> = await response.json();
    return data.data;
  }

  async completeQueueEntry(entryId: string): Promise<QueueEntry> {
    const response = await fetch(`${API_BASE}/queue/${entryId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Failed to complete queue entry');
    }
    
    const data: ApiResponse<QueueEntry> = await response.json();
    return data.data;
  }

  async skipQueueEntry(entryId: string): Promise<QueueEntry> {
    const response = await fetch(`${API_BASE}/queue/${entryId}/skip`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Failed to skip queue entry');
    }
    
    const data: ApiResponse<QueueEntry> = await response.json();
    return data.data;
  }

  async reorderQueue(updates: { id: string; position: number }[]): Promise<void> {
    const response = await fetch(`${API_BASE}/queue/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to reorder queue');
    }
  }
}

export { ApiService };
export const apiService = new ApiService();
