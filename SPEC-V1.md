# Karaoke App Specification - Version 1.0

## Overview

A real-time karaoke management system consisting of two client applications (web and desktop) that communicate through a central Elixir Phoenix server. The system enables DJs to manage karaoke sessions with local music libraries while singers can join remotely to browse songs and submit requests.

---

## System Architecture

### Components

1. **Server** - Elixir Phoenix API with WebSocket support
2. **Web Singer** - React TypeScript web application for singers
3. **Desktop DJ** - Electron desktop application for DJs

### Communication Flow

```
Desktop DJ (Electron) <--WebSocket--> Server (Phoenix) <--WebSocket--> Web Singer (React)
                                          |
                                          v
                                      PostgreSQL
```

---

## User Roles

### DJ (Desktop DJ App)
- Creates and manages karaoke sessions
- Loads local music library
- Views and manages the song request queue
- Controls session lifecycle (start/end)

### Singer (Web Singer App)
- Joins active sessions via 4-digit code
- Browses available songs
- Submits song requests with their name
- Views the current queue position

---

## Core Features

### 1. Session Management

#### DJ Creates Session
**Flow:**
1. DJ opens Desktop DJ app
2. DJ clicks "Create Session"
3. Server generates unique 4-digit code (e.g., "1234")
4. Session is created with status: `active`
5. DJ receives session code and session ID

**Data Model:**
```elixir
%Session{
  id: UUID,
  code: "1234", # 4-digit numeric string
  dj_name: string,
  status: "active" | "ended",
  created_at: DateTime,
  ended_at: DateTime | nil
}
```

#### Singers Join Session
**Flow:**
1. Singer visits web app
2. Singer enters 4-digit code
3. Server validates code
4. If valid, singer joins session and sees song catalog

**Session Validation:**
- Code must be exactly 4 digits
- Session must have status: `active`
- Multiple singers can join same session
- Session persists until DJ ends it

#### DJ Ends Session
**Flow:**
1. DJ clicks "End Session"
2. Server sets session status to `ended`
3. All connected singers are notified
4. Queue is archived
5. New singer joins are blocked

---

### 2. Music Library Management

#### DJ Music Library Upload
**Flow:**
1. DJ selects local music folder/files
2. Desktop app scans files and extracts metadata:
   - Song title
   - Artist name
   - File path (local only)
   - Duration (optional)
3. App creates song catalog dictionary
4. Catalog is sent to server
5. Server associates catalog with session

**Data Model:**
```elixir
%Song{
  id: UUID,
  session_id: UUID,
  title: string,
  artist: string,
  duration: integer | nil, # seconds
  created_at: DateTime
}
```

**Catalog Structure (JSON):**
```json
[
  {
    "id": "song-uuid-1",
    "title": "Don't Stop Believin'",
    "artist": "Journey",
    "duration": 250
  },
  {
    "id": "song-uuid-2",
    "title": "Bohemian Rhapsody",
    "artist": "Queen",
    "duration": 355
  }
]
```

**File Handling:**
- Files remain on DJ's local machine
- Only metadata is shared with server
- File paths are NOT sent to server (security)
- Supported formats: MP3, M4A, WAV, FLAC (TBD)

#### Singer Song Browsing
**Flow:**
1. Singer sees searchable/filterable song list
2. Can search by: song title, artist name
3. Results update in real-time
4. Song list updates when DJ adds more songs

**UI Features:**
- Search bar with instant filtering
- Sort by: artist (A-Z), title (A-Z)
- Pagination or infinite scroll
- Display: "Song Title - Artist Name"

---

### 3. Queue Management

#### Singer Submits Request
**Flow:**
1. Singer selects a song from catalog
2. Singer enters their name
3. Singer clicks "Request Song"
4. Request is added to queue with timestamp
5. Queue updates for all connected users

**Data Model:**
```elixir
%QueueEntry{
  id: UUID,
  session_id: UUID,
  song_id: UUID,
  singer_name: string,
  status: "pending" | "completed" | "skipped",
  position: integer,
  requested_at: DateTime,
  completed_at: DateTime | nil
}
```

**Business Rules:**
- Queue position is auto-assigned (FIFO)
- Same singer can request multiple songs
- DJ can reorder queue (optional enhancement)
- DJ can mark songs as completed or skipped

#### View Queue (Both Apps)
**Display Format:**
```
Position | Singer Name | Song Title - Artist | Status
---------|-------------|---------------------|--------
1        | John        | Sweet Caroline - Neil Diamond | Pending
2        | Sarah       | I Will Survive - Gloria Gaynor | Pending
3        | Mike        | Livin' on a Prayer - Bon Jovi | Pending
```

**Real-time Updates:**
- Queue updates via WebSocket
- Changes reflect immediately for all users
- Position numbers recalculate automatically

#### Queue Operations (DJ Only)
- Mark as completed
- Mark as skipped
- Clear completed/skipped entries
- Reorder queue (drag-and-drop)

---

## API Endpoints

### REST API

#### Sessions
```
POST   /api/sessions
  Body: { dj_name: string }
  Response: { id, code, status, created_at }

GET    /api/sessions/:code
  Response: { id, code, status, dj_name, created_at }

PUT    /api/sessions/:id/end
  Response: { id, status: "ended", ended_at }
```

#### Songs
```
POST   /api/sessions/:session_id/songs/bulk
  Body: [{ title, artist, duration }]
  Response: { count, songs: [...] }

GET    /api/sessions/:session_id/songs
  Query: ?search=query
  Response: { songs: [...] }
```

#### Queue
```
POST   /api/sessions/:session_id/queue
  Body: { song_id, singer_name }
  Response: { id, position, requested_at, ... }

GET    /api/sessions/:session_id/queue
  Response: { entries: [...] }

PUT    /api/queue/:id
  Body: { status: "completed" | "skipped" }
  Response: { id, status, completed_at }
```

### WebSocket Channels

#### Session Channel
**Topic:** `session:{session_id}`

**Events (Server → Client):**
- `queue:updated` - Queue changed
- `song:added` - New song added to catalog
- `session:ended` - Session ended by DJ

**Events (Client → Server):**
- `ping` - Keep-alive
- `request_song` - Submit song request

---

## Data Flow Examples

### Example 1: DJ Creates Session & Adds Songs

1. **DJ creates session**
   ```
   Desktop DJ → POST /api/sessions
   ← { id: "sess-123", code: "5678" }
   ```

2. **DJ loads music files**
   ```
   Desktop DJ scans local folder
   Extracts: 50 songs with metadata
   ```

3. **DJ uploads catalog**
   ```
   Desktop DJ → POST /api/sessions/sess-123/songs/bulk
   Body: [{ title: "...", artist: "..." }, ...]
   ← { count: 50 }
   ```

4. **DJ connects to WebSocket**
   ```
   Desktop DJ → Connect WS: session:sess-123
   ← Connected
   ```

### Example 2: Singer Joins & Requests Song

1. **Singer enters code**
   ```
   Web Singer → GET /api/sessions/5678
   ← { id: "sess-123", status: "active" }
   ```

2. **Singer browses songs**
   ```
   Web Singer → GET /api/sessions/sess-123/songs
   ← { songs: [{...}, {...}] }
   ```

3. **Singer connects to WebSocket**
   ```
   Web Singer → Connect WS: session:sess-123
   ← Connected
   ```

4. **Singer requests song**
   ```
   Web Singer → POST /api/sessions/sess-123/queue
   Body: { song_id: "song-42", singer_name: "Alice" }
   ← { id: "q-1", position: 3 }
   ```

5. **All clients receive update**
   ```
   Server → Broadcast session:sess-123
   Event: "queue:updated"
   Data: { entries: [...] }
   ```

### Example 3: DJ Manages Queue

1. **DJ views queue**
   ```
   Desktop DJ receives WS: queue:updated
   Displays: 3 pending requests
   ```

2. **DJ marks song completed**
   ```
   Desktop DJ → PUT /api/queue/q-1
   Body: { status: "completed" }
   ← { id: "q-1", status: "completed" }
   ```

3. **Queue updates for all**
   ```
   Server → Broadcast session:sess-123
   Event: "queue:updated"
   Data: { entries: [...] } # q-1 now completed
   ```

---

## UI/UX Requirements

### Desktop DJ App

#### Main Screens
1. **Home Screen**
   - "Create Session" button
   - Session code display (large, readable)
   - "End Session" button

2. **Music Library Screen**
   - "Load Music Folder" button
   - File count display
   - Upload progress
   - Song list preview

3. **Queue Screen**
   - Table view of queue
   - Action buttons per entry:
     - ✓ Complete
     - ✗ Skip
   - Filter: Show pending only / Show all
   - Auto-refresh via WebSocket

#### Design Notes
- Native desktop UI feel
- Large, touch-friendly buttons
- High contrast for stage visibility
- Fullscreen mode option

### Web Singer App

#### Main Screens
1. **Join Screen**
   - 4-digit code input (numeric keyboard)
   - "Join Session" button
   - Error message display

2. **Song Browser**
   - Search bar (sticky header)
   - Song list with infinite scroll
   - "Request" button per song
   - Filter/sort controls

3. **Request Modal**
   - Song details display
   - "Your Name" input
   - "Submit Request" button
   - "Cancel" button

4. **Queue View**
   - Current queue display
   - User's requests highlighted
   - Position indicator
   - Real-time updates

#### Design Notes
- Mobile-first responsive design
- Simple, intuitive navigation
- Clear feedback messages
- Minimal data usage

---

## Technical Requirements

### Server (Phoenix)

#### Core Dependencies
- Phoenix Framework 1.8+
- Ecto (PostgreSQL)
- Phoenix PubSub
- Phoenix Channels (WebSocket)
- CORS support

#### Database Schema
```sql
-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  code VARCHAR(4) UNIQUE NOT NULL,
  dj_name VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_status (status)
);

-- Songs table
CREATE TABLE songs (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  duration INTEGER,
  created_at TIMESTAMP NOT NULL,
  INDEX idx_session_id (session_id)
);

-- Queue entries table
CREATE TABLE queue_entries (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  singer_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,
  position INTEGER NOT NULL,
  requested_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  INDEX idx_session_id (session_id),
  INDEX idx_position (session_id, position)
);
```

#### Key Features
- Auto-generate unique 4-digit codes
- Code collision detection
- Session expiration (optional)
- Rate limiting on song requests
- Input validation and sanitization

### Desktop DJ App (Electron)

#### Core Dependencies
- Electron
- React + TypeScript
- Vite
- WebSocket client
- File system access (Node.js APIs)

#### File Metadata Extraction
- Use: `music-metadata` npm package
- Extract: title, artist, duration
- Handle: ID3 tags, M4A metadata

#### Local Storage
- Store session ID
- Store recent catalogs (cache)
- User preferences

### Web Singer App (React)

#### Core Dependencies
- React + TypeScript
- Vite
- Tailwind CSS
- WebSocket client
- React Router

#### State Management
- React Context or Zustand
- WebSocket connection state
- Session state
- Queue state

#### Offline Handling
- Display connection status
- Reconnection logic
- Queue cached requests

---

## Security Considerations

1. **Session Codes**
   - 4-digit codes (10,000 possible combinations)
   - Short lifespan (24 hours max)
   - Rate limit code attempts (prevent brute force)

2. **Input Validation**
   - Sanitize singer names (prevent XSS)
   - Validate song data
   - Limit request frequency per user

3. **File Security**
   - File paths never leave DJ's machine
   - Only metadata transmitted
   - No direct file access from web

4. **WebSocket Security**
   - Validate session membership
   - Token-based authentication (optional)
   - Connection rate limiting

---

## Performance Requirements

1. **Response Times**
   - API response: < 200ms
   - WebSocket message delivery: < 100ms
   - Search results: < 300ms

2. **Scalability**
   - Support 50+ concurrent singers per session
   - Handle 1000+ songs in catalog
   - Support 100+ queue entries

3. **Data Limits**
   - Max singers per session: 100
   - Max songs per session: 5000
   - Max queue length: 500
   - Singer name max length: 50 characters

---

## Future Enhancements (V2+)

1. **Enhanced Features**
   - DJ can reorder queue (drag-and-drop)
   - Singer voting/likes on requests
   - Song history and stats
   - Multiple DJs per session
   - Singer profiles and favorites

2. **Advanced Music**
   - Key/tempo information
   - Genre filtering
   - YouTube integration
   - Spotify integration

3. **Social Features**
   - Chat between singers
   - Reactions/emojis
   - Singer leaderboard
   - Share session on social media

4. **Analytics**
   - Most requested songs
   - Peak activity times
   - Singer engagement metrics
   - Export session data

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-3)
- [ ] Session creation and joining
- [ ] Basic song catalog upload
- [ ] Simple queue management
- [ ] WebSocket real-time updates
- [ ] Basic UI for both apps

### Phase 2: Polish (Weeks 4-6)
- [ ] Search and filtering
- [ ] Queue operations (complete/skip)
- [ ] Improved UI/UX
- [ ] Error handling
- [ ] Loading states

### Phase 3: Production Ready (Weeks 7-8)
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Testing (unit + integration)
- [ ] Documentation
- [ ] Deployment setup

---

## Success Metrics

1. **Functionality**
   - DJ can create session within 10 seconds
   - Singer can find and request song within 30 seconds
   - Queue updates appear in < 1 second

2. **Reliability**
   - 99% uptime during active sessions
   - WebSocket reconnection < 5 seconds
   - Zero data loss on disconnection

3. **Usability**
   - DJ can operate without training
   - Singers can join without instructions
   - Mobile-friendly web interface

---

## Glossary

- **Session**: A single karaoke night event managed by a DJ
- **Session Code**: 4-digit numeric code used by singers to join
- **Catalog**: Collection of songs available for a session
- **Queue**: Ordered list of requested songs
- **Request**: A singer's submission of their name + song choice
- **DJ**: User managing the karaoke session via desktop app
- **Singer**: User joining via web to browse and request songs

---

**Document Version:** 1.0  
**Last Updated:** March 25, 2026  
**Status:** Draft for Implementation