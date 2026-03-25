#!/usr/bin/env elixir

# WebSocket test script for Karaoke API
# Run with: elixir test_websocket.exs

Mix.install([
  {:websockex, "~> 0.4"},
  {:httpoison, "~> 2.0"},
  {:jason, "~> 1.4"}
])

defmodule KaraokeWebSocketClient do
  use WebSockex

  def start_link(url, session_id) do
    WebSockex.start_link(url, __MODULE__, %{session_id: session_id})
  end

  def handle_frame({:text, msg}, state) do
    IO.puts("\n📨 Received WebSocket message:")
    
    case Jason.decode(msg) do
      {:ok, decoded} ->
        IO.inspect(decoded, pretty: true)
      {:error, _} ->
        IO.puts("Raw: #{msg}")
    end
    
    {:ok, state}
  end

  def handle_frame(_frame, state) do
    {:ok, state}
  end

  def handle_disconnect(_reason, state) do
    IO.puts("\n❌ WebSocket disconnected")
    {:ok, state}
  end
end

defmodule WebSocketTest do
  def run do
    IO.puts("=== Karaoke WebSocket Test ===\n")
    
    # Step 1: Create a session
    IO.puts("1. Creating session...")
    {:ok, session} = create_session()
    session_id = session["id"]
    IO.puts("✅ Session created: #{session["code"]}")
    
    # Step 2: Add songs to catalog
    IO.puts("\n2. Adding songs to catalog...")
    {:ok, _count} = add_songs(session_id)
    IO.puts("✅ Songs added")
    
    # Step 3: Get song list
    IO.puts("\n3. Getting song list...")
    {:ok, songs} = get_songs(session_id)
    song_id = List.first(songs)["id"]
    IO.puts("✅ Found #{length(songs)} songs")
    
    # Step 4: Connect to WebSocket
    IO.puts("\n4. Connecting to WebSocket...")
    ws_url = "ws://localhost:4000/socket/websocket"
    {:ok, pid} = KaraokeWebSocketClient.start_link(ws_url, session_id)
    IO.puts("✅ WebSocket connected")
    
    # Step 5: Join session channel
    IO.puts("\n5. Joining session channel...")
    join_msg = Jason.encode!(%{
      topic: "session:#{session_id}",
      event: "phx_join",
      payload: %{},
      ref: "1"
    })
    WebSockex.send_frame(pid, {:text, join_msg})
    Process.sleep(500)
    
    # Step 6: Send ping
    IO.puts("\n6. Sending ping...")
    ping_msg = Jason.encode!(%{
      topic: "session:#{session_id}",
      event: "ping",
      payload: %{},
      ref: "2"
    })
    WebSockex.send_frame(pid, {:text, ping_msg})
    Process.sleep(500)
    
    # Step 7: Request song via WebSocket
    IO.puts("\n7. Requesting song via WebSocket...")
    request_msg = Jason.encode!(%{
      topic: "session:#{session_id}",
      event: "request_song",
      payload: %{
        song_id: song_id,
        singer_name: "Test Singer WS"
      },
      ref: "3"
    })
    WebSockex.send_frame(pid, {:text, request_msg})
    Process.sleep(500)
    
    # Step 8: Request song via REST API (should broadcast to WebSocket)
    IO.puts("\n8. Requesting song via REST API...")
    add_to_queue(session_id, song_id, "Test Singer REST")
    Process.sleep(1000)
    
    # Step 9: Complete a queue entry
    IO.puts("\n9. Getting queue and completing first entry...")
    {:ok, queue} = get_queue(session_id)
    if length(queue) > 0 do
      first_entry = List.first(queue)
      complete_entry(first_entry["id"])
      Process.sleep(1000)
    end
    
    # Step 10: End session (should broadcast)
    IO.puts("\n10. Ending session...")
    end_session(session_id)
    Process.sleep(1000)
    
    IO.puts("\n✅ All tests completed!")
    IO.puts("\nCheck the WebSocket messages above to verify real-time updates.")
  end
  
  defp create_session do
    url = "http://localhost:4000/api/sessions"
    headers = [{"Content-Type", "application/json"}]
    body = Jason.encode!(%{dj_name: "WebSocket Test DJ"})
    
    case HTTPoison.post(url, body, headers) do
      {:ok, %HTTPoison.Response{status_code: 201, body: response}} ->
        {:ok, json} = Jason.decode(response)
        {:ok, json["data"]}
      {:error, reason} ->
        {:error, reason}
    end
  end
  
  defp add_songs(session_id) do
    url = "http://localhost:4000/api/sessions/#{session_id}/songs/bulk"
    headers = [{"Content-Type", "application/json"}]
    body = Jason.encode!(%{
      songs: [
        %{title: "Bohemian Rhapsody", artist: "Queen", duration: 354},
        %{title: "Sweet Child O' Mine", artist: "Guns N' Roses", duration: 356},
        %{title: "Don't Stop Believin'", artist: "Journey", duration: 251}
      ]
    })
    
    case HTTPoison.post(url, body, headers) do
      {:ok, %HTTPoison.Response{status_code: 201}} ->
        {:ok, 3}
      {:error, reason} ->
        {:error, reason}
    end
  end
  
  defp get_songs(session_id) do
    url = "http://localhost:4000/api/sessions/#{session_id}/songs"
    
    case HTTPoison.get(url) do
      {:ok, %HTTPoison.Response{status_code: 200, body: response}} ->
        {:ok, json} = Jason.decode(response)
        {:ok, json["data"]}
      {:error, reason} ->
        {:error, reason}
    end
  end
  
  defp add_to_queue(session_id, song_id, singer_name) do
    url = "http://localhost:4000/api/sessions/#{session_id}/queue"
    headers = [{"Content-Type", "application/json"}]
    body = Jason.encode!(%{
      song_id: song_id,
      singer_name: singer_name
    })
    
    HTTPoison.post(url, body, headers)
  end
  
  defp get_queue(session_id) do
    url = "http://localhost:4000/api/sessions/#{session_id}/queue"
    
    case HTTPoison.get(url) do
      {:ok, %HTTPoison.Response{status_code: 200, body: response}} ->
        {:ok, json} = Jason.decode(response)
        {:ok, json["data"]}
      {:error, reason} ->
        {:error, reason}
    end
  end
  
  defp complete_entry(entry_id) do
    url = "http://localhost:4000/api/queue/#{entry_id}/complete"
    headers = [{"Content-Type", "application/json"}]
    HTTPoison.put(url, "", headers)
  end
  
  defp end_session(session_id) do
    url = "http://localhost:4000/api/sessions/#{session_id}/end"
    headers = [{"Content-Type", "application/json"}]
    HTTPoison.put(url, "", headers)
  end
end

# Run the test
WebSocketTest.run()
