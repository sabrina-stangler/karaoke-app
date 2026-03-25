# Karaoke API Documentation

## Overview
Backend API for the Karaoke application built with Elixir Phoenix. Provides REST endpoints for managing karaoke sessions, songs, and queues.

## Base URL
```
http://localhost:4000
```

## API Endpoints

### Sessions

#### Create Session
Create a new karaoke session with a unique 4-digit code.

**POST** `/api/sessions`

**Request Body:**
```json
{
  "dj_name": "DJ Name"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "code": "1234",
    "dj_name": "DJ Name",
    "status": "active",
    "inserted_at": "2026-03-25T17:06:20Z",
    "updated_at": "2026-03-25T17:06:20Z"
  }
}
```

#### Get Session by Code
Retrieve session details using the 4-digit code.

**GET** `/api/sessions/:code`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "code": "1234",
    "dj_name": "DJ Name",
    "status": "active",
    "inserted_at": "2026-03-25T17:06:20Z",
    "updated_at": "2026-03-25T17:06:20Z"
  }
}
```

**Response:** `404 Not Found`
```json
{
  "error": "Session not found"
}
```

#### End Session
Mark a session as ended.

**PUT** `/api/sessions/:id/end`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "code": "1234",
    "dj_name": "DJ Name",
    "status": "ended",
    "inserted_at": "2026-03-25T17:06:20Z",
    "updated_at": "2026-03-25T17:06:20Z"
  }
}
```

---

### Songs

#### List Songs
Get all songs in a session's catalog.

**GET** `/api/sessions/:session_id/songs`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Song Title",
      "artist": "Artist Name",
      "duration": 180,
      "session_id": "uuid"
    }
  ]
}
```

#### Bulk Create Songs
Upload multiple songs to a session at once.

**POST** `/api/sessions/:session_id/songs/bulk`

**Request Body:**
```json
{
  "songs": [
    {
      "title": "Song 1",
      "artist": "Artist 1",
      "duration": 180
    },
    {
      "title": "Song 2",
      "artist": "Artist 2",
      "duration": 210
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "message": "Successfully created 2 songs"
}
```

#### Search Songs
Search songs by title or artist.

**GET** `/api/sessions/:session_id/songs/search?query=search_term`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Matching Song",
      "artist": "Artist Name",
      "duration": 180,
      "session_id": "uuid"
    }
  ]
}
```

---

### Queue

#### List Queue
Get all queue entries for a session, ordered by position.

**GET** `/api/sessions/:session_id/queue`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "singer_name": "John Doe",
      "status": "pending",
      "position": 0,
      "completed_at": null,
      "session_id": "uuid",
      "song_id": "uuid",
      "song": {
        "id": "uuid",
        "title": "Song Title",
        "artist": "Artist Name",
        "duration": 180
      }
    }
  ]
}
```

#### Add to Queue
Add a song request to the queue.

**POST** `/api/sessions/:session_id/queue`

**Request Body:**
```json
{
  "song_id": "uuid",
  "singer_name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "singer_name": "John Doe",
    "status": "pending",
    "position": 0,
    "completed_at": null,
    "session_id": "uuid",
    "song_id": "uuid",
    "song": {
      "id": "uuid",
      "title": "Song Title",
      "artist": "Artist Name",
      "duration": 180
    }
  }
}
```

#### Complete Queue Entry
Mark a queue entry as completed.

**PUT** `/api/queue/:id/complete`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "singer_name": "John Doe",
    "status": "completed",
    "position": 0,
    "completed_at": "2026-03-25T17:10:00Z",
    "session_id": "uuid",
    "song_id": "uuid",
    "song": {...}
  }
}
```

#### Skip Queue Entry
Mark a queue entry as skipped.

**PUT** `/api/queue/:id/skip`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "singer_name": "John Doe",
    "status": "skipped",
    "position": 0,
    "completed_at": null,
    "session_id": "uuid",
    "song_id": "uuid",
    "song": {...}
  }
}
```

#### Reorder Queue
Update positions of multiple queue entries.

**PUT** `/api/queue/reorder`

**Request Body:**
```json
{
  "updates": [
    {"id": "uuid1", "position": 0},
    {"id": "uuid2", "position": 1},
    {"id": "uuid3", "position": 2}
  ]
}
```

**Response:** `200 OK`
```json
{
  "message": "Queue reordered successfully"
}
```

---

## WebSocket Real-Time Updates

### Connection
Connect to the WebSocket endpoint:
```
ws://localhost:4000/socket/websocket
```

### Session Channel
Join a session channel to receive real-time updates:

**Topic:** `session:{session_id}`

#### Joining the Channel
```json
{
  "topic": "session:SESSION_ID",
  "event": "phx_join",
  "payload": {},
  "ref": "1"
}
```

**Response:**
```json
{
  "event": "phx_reply",
  "payload": {
    "response": {},
    "status": "ok"
  },
  "ref": "1",
  "topic": "session:SESSION_ID"
}
```

#### Keep-Alive (Ping)
```json
{
  "topic": "session:SESSION_ID",
  "event": "ping",
  "payload": {},
  "ref": "2"
}
```

**Response:**
```json
{
  "event": "phx_reply",
  "payload": {
    "response": {"status": "pong"},
    "status": "ok"
  },
  "ref": "2",
  "topic": "session:SESSION_ID"
}
```

#### Request Song via WebSocket
```json
{
  "topic": "session:SESSION_ID",
  "event": "request_song",
  "payload": {
    "song_id": "UUID",
    "singer_name": "John Doe"
  },
  "ref": "3"
}
```

**Response:**
```json
{
  "event": "phx_reply",
  "payload": {
    "response": {
      "entry": {
        "id": "UUID",
        "singer_name": "John Doe",
        "status": "pending",
        "position": 0,
        "song": {...}
      }
    },
    "status": "ok"
  },
  "ref": "3",
  "topic": "session:SESSION_ID"
}
```

### Server → Client Events

#### Queue Updated
Broadcast when any queue operation occurs (add, complete, skip, reorder).

```json
{
  "event": "queue:updated",
  "payload": {
    "action": "added|completed|skipped|reordered",
    "entry": {
      "id": "UUID",
      "singer_name": "John Doe",
      "status": "pending|completed|skipped",
      "position": 0,
      "completed_at": "2026-03-25T17:15:09Z",
      "session_id": "UUID",
      "song_id": "UUID",
      "song": {
        "id": "UUID",
        "title": "Song Title",
        "artist": "Artist Name",
        "duration": 180
      }
    }
  },
  "ref": null,
  "topic": "session:SESSION_ID"
}
```

#### Song Added
Broadcast when songs are added to the catalog.

```json
{
  "event": "song:added",
  "payload": {
    "count": 50
  },
  "ref": null,
  "topic": "session:SESSION_ID"
}
```

#### Session Ended
Broadcast when the DJ ends the session.

```json
{
  "event": "session:ended",
  "payload": {
    "session_id": "UUID"
  },
  "ref": null,
  "topic": "session:SESSION_ID"
}
```

---

## Error Responses

### Validation Errors
**Status:** `422 Unprocessable Entity`
```json
{
  "errors": {
    "field_name": ["error message"]
  }
}
```

### Not Found
**Status:** `404 Not Found`
```json
{
  "error": "Resource not found"
}
```

---

## Database Schema

### Sessions
- `id` (UUID, Primary Key)
- `code` (String, 4 digits, unique)
- `dj_name` (String, optional)
- `status` (String: "active" | "ended")
- `inserted_at` (DateTime)
- `updated_at` (DateTime)

**Indexes:**
- Unique index on `code`
- Index on `status`

### Songs
- `id` (UUID, Primary Key)
- `session_id` (UUID, Foreign Key → sessions)
- `title` (String)
- `artist` (String)
- `duration` (Integer, seconds, optional)
- `inserted_at` (DateTime)
- `updated_at` (DateTime)

**Indexes:**
- Index on `session_id`

**Relationships:**
- Belongs to Session (cascade delete)

### Queue Entries
- `id` (UUID, Primary Key)
- `session_id` (UUID, Foreign Key → sessions)
- `song_id` (UUID, Foreign Key → songs)
- `singer_name` (String)
- `status` (String: "pending" | "completed" | "skipped")
- `position` (Integer)
- `completed_at` (DateTime, optional)
- `inserted_at` (DateTime)
- `updated_at` (DateTime)

**Indexes:**
- Composite index on `(session_id, position)`

**Relationships:**
- Belongs to Session (cascade delete)
- Belongs to Song (cascade delete)

---

## Context Modules

### KaraokeApi.Sessions
Business logic for session management.

**Functions:**
- `list_sessions()` - Get all sessions
- `get_session!(id)` - Get session by ID (raises if not found)
- `get_session_by_code(code)` - Get session by 4-digit code
- `create_session(attrs)` - Create new session with unique code
- `update_session(session, attrs)` - Update session
- `delete_session(session)` - Delete session
- `end_session(session)` - Mark session as ended

### KaraokeApi.Songs
Business logic for song catalog management.

**Functions:**
- `list_songs(session_id)` - Get all songs for a session (ordered by artist, title)
- `get_song!(id)` - Get song by ID (raises if not found)
- `create_song(attrs)` - Create a single song
- `create_songs_bulk(session_id, songs_list)` - Create multiple songs efficiently
- `update_song(song, attrs)` - Update song
- `delete_song(song)` - Delete song
- `search_songs(session_id, query)` - Search by title or artist (case-insensitive)

### KaraokeApi.Queue
Business logic for queue management.

**Functions:**
- `list_queue(session_id)` - Get all queue entries for a session (with song preloaded)
- `list_pending_queue(session_id)` - Get only pending entries
- `get_queue_entry!(id)` - Get queue entry by ID (raises if not found)
- `create_queue_entry(attrs)` - Add to queue (auto-assigns position)
- `update_queue_entry(entry, attrs)` - Update queue entry
- `delete_queue_entry(entry)` - Delete queue entry
- `complete_queue_entry(entry)` - Mark as completed with timestamp
- `skip_queue_entry(entry)` - Mark as skipped
- `reorder_queue(updates)` - Update positions in transaction

---

## Development

### Running the Server
```bash
cd server
mix phx.server
```

Server runs on `http://localhost:4000`

### Running Migrations
```bash
cd server
mix ecto.migrate
```

### Resetting Database
```bash
cd server
mix ecto.reset
```

### Testing API
Use the included test script:
```bash
cd server
elixir test_api.exs
```

### Testing WebSocket
Use the included WebSocket test script:
```bash
cd server
elixir test_websocket.exs
```

This test will:
1. Create a session
2. Add songs to catalog
3. Connect to WebSocket
4. Join session channel
5. Send ping/pong
6. Request songs via WebSocket and REST API
7. Complete a queue entry
8. End the session

Watch for WebSocket broadcast messages in the output!

---

## Next Steps (Phase 2)

- [x] Implement Phoenix Channels for WebSocket real-time updates
- [x] Add Channel events: session_updated, song_added, queue_updated
- [ ] Build Web Singer UI with React
- [ ] Build Desktop DJ UI with Electron
- [ ] Implement file upload and metadata extraction for songs
- [ ] Add audio playback controls
