defmodule KaraokeApiWeb.SongJSON do
  alias KaraokeApi.Songs.Song

  @doc """
  Renders a list of songs.
  """
  def index(%{songs: songs}) do
    %{data: for(song <- songs, do: data(song))}
  end

  defp data(%Song{} = song) do
    %{
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      session_id: song.session_id
    }
  end
end
