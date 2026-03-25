defmodule KaraokeApiWeb.QueueJSON do
  alias KaraokeApi.Queue.QueueEntry

  @doc """
  Renders a list of queue entries.
  """
  def index(%{queue_entries: queue_entries}) do
    %{data: for(queue_entry <- queue_entries, do: data(queue_entry))}
  end

  @doc """
  Renders a single queue entry.
  """
  def show(%{queue_entry: queue_entry}) do
    %{data: data(queue_entry)}
  end

  defp data(%QueueEntry{} = queue_entry) do
    %{
      id: queue_entry.id,
      singer_name: queue_entry.singer_name,
      status: queue_entry.status,
      position: queue_entry.position,
      completed_at: queue_entry.completed_at,
      session_id: queue_entry.session_id,
      song_id: queue_entry.song_id,
      song: song_data(queue_entry.song)
    }
  end

  defp song_data(%Ecto.Association.NotLoaded{}), do: nil
  defp song_data(nil), do: nil
  defp song_data(song) do
    %{
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration
    }
  end
end
