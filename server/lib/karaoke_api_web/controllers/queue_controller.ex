defmodule KaraokeApiWeb.QueueController do
  use KaraokeApiWeb, :controller

  alias KaraokeApi.Queue
  alias KaraokeApi.Queue.QueueEntry

  action_fallback KaraokeApiWeb.FallbackController

  def index(conn, %{"session_id" => session_id}) do
    queue_entries = Queue.list_queue(session_id)
    render(conn, :index, queue_entries: queue_entries)
  end

  def create(conn, %{"session_id" => session_id, "song_id" => song_id, "singer_name" => singer_name}) do
    attrs = %{
      session_id: session_id,
      song_id: song_id,
      singer_name: singer_name
    }

    with {:ok, %QueueEntry{} = queue_entry} <- Queue.create_queue_entry(attrs) do
      queue_entry = Queue.get_queue_entry!(queue_entry.id)  # Reload with preloads

      # Broadcast to WebSocket subscribers
      KaraokeApiWeb.Endpoint.broadcast(
        "session:#{session_id}",
        "queue:updated",
        %{action: "added", entry: format_entry(queue_entry)}
      )

      conn
      |> put_status(:created)
      |> render(:show, queue_entry: queue_entry)
    end
  end

  def complete(conn, %{"id" => id}) do
    queue_entry = Queue.get_queue_entry!(id)

    with {:ok, %QueueEntry{} = queue_entry} <- Queue.complete_queue_entry(queue_entry) do
      # Broadcast to WebSocket subscribers
      KaraokeApiWeb.Endpoint.broadcast(
        "session:#{queue_entry.session_id}",
        "queue:updated",
        %{action: "completed", entry: format_entry(queue_entry)}
      )

      render(conn, :show, queue_entry: queue_entry)
    end
  end

  def skip(conn, %{"id" => id}) do
    queue_entry = Queue.get_queue_entry!(id)

    with {:ok, %QueueEntry{} = queue_entry} <- Queue.skip_queue_entry(queue_entry) do
      # Broadcast to WebSocket subscribers
      KaraokeApiWeb.Endpoint.broadcast(
        "session:#{queue_entry.session_id}",
        "queue:updated",
        %{action: "skipped", entry: format_entry(queue_entry)}
      )

      render(conn, :show, queue_entry: queue_entry)
    end
  end

  def reorder(conn, %{"updates" => updates}) do
    # Extract session_id from first update
    session_id = case List.first(updates) do
      %{"id" => id} ->
        Queue.get_queue_entry!(id).session_id
      _ ->
        nil
    end

    with {:ok, _} <- Queue.reorder_queue(updates) do
      # Broadcast to WebSocket subscribers if we have a session_id
      if session_id do
        KaraokeApiWeb.Endpoint.broadcast(
          "session:#{session_id}",
          "queue:updated",
          %{action: "reordered", updates: updates}
        )
      end

      json(conn, %{message: "Queue reordered successfully"})
    end
  end

  # Helper function to format queue entry for WebSocket broadcast
  defp format_entry(queue_entry) do
    %{
      id: queue_entry.id,
      singer_name: queue_entry.singer_name,
      status: queue_entry.status,
      position: queue_entry.position,
      completed_at: queue_entry.completed_at,
      session_id: queue_entry.session_id,
      song_id: queue_entry.song_id,
      song: format_song(queue_entry.song)
    }
  end

  defp format_song(%Ecto.Association.NotLoaded{}), do: nil
  defp format_song(nil), do: nil
  defp format_song(song) do
    %{
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration
    }
  end
end
