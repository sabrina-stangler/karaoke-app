defmodule KaraokeApiWeb.SessionChannel do
  use KaraokeApiWeb, :channel

  @impl true
  def join("session:" <> session_code, _payload, socket) do
    # Look up by code (4-digit string), then verify active
    case KaraokeApi.Sessions.get_session_by_code(session_code) do
      nil ->
        {:error, %{reason: "session not found"}}

      session ->
        if session.status == "active" do
          {:ok, assign(socket, :session_id, session.id)}
        else
          {:error, %{reason: "session not active"}}
        end
    end
  end

  @impl true
  def handle_in("ping", _payload, socket) do
    {:reply, {:ok, %{status: "pong"}}, socket}
  end

  @impl true
  def handle_in("request_song", %{"song_id" => song_id, "singer_name" => singer_name}, socket) do
    session_id = socket.assigns.session_id

    attrs = %{
      session_id: session_id,
      song_id: song_id,
      singer_name: singer_name
    }

    case KaraokeApi.Queue.create_queue_entry(attrs) do
      {:ok, queue_entry} ->
        # Load the entry with song preloaded
        entry = KaraokeApi.Queue.get_queue_entry!(queue_entry.id)

        # Broadcast to all connected clients
        broadcast!(socket, "queue:updated", %{
          action: "added",
          entry: format_queue_entry(entry)
        })

        {:reply, {:ok, %{entry: format_queue_entry(entry)}}, socket}

      {:error, changeset} ->
        {:reply, {:error, %{errors: format_errors(changeset)}}, socket}
    end
  end

  # Helper to format queue entry for JSON
  defp format_queue_entry(entry) do
    %{
      id: entry.id,
      singer_name: entry.singer_name,
      status: entry.status,
      position: entry.position,
      completed_at: entry.completed_at,
      session_id: entry.session_id,
      song_id: entry.song_id,
      song: format_song(entry.song)
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

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
