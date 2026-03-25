defmodule KaraokeApi.Songs do
  @moduledoc """
  The Songs context.
  """

  import Ecto.Query, warn: false
  alias KaraokeApi.Repo
  alias KaraokeApi.Songs.Song

  @doc """
  Returns the list of songs for a session.
  """
  def list_songs(session_id) do
    Song
    |> where([s], s.session_id == ^session_id)
    |> order_by([s], [asc: s.artist, asc: s.title])
    |> Repo.all()
  end

  @doc """
  Gets a single song.

  Raises `Ecto.NoResultsError` if the Song does not exist.
  """
  def get_song!(id), do: Repo.get!(Song, id)

  @doc """
  Creates a song.
  """
  def create_song(attrs \\ %{}) do
    %Song{}
    |> Song.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Creates multiple songs in bulk.
  """
  def create_songs_bulk(session_id, songs_list) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    songs_with_timestamps = Enum.map(songs_list, fn song ->
      # Convert string keys to atoms and add required fields
      %{
        id: Ecto.UUID.generate(),
        session_id: session_id,
        title: get_value(song, "title"),
        artist: get_value(song, "artist"),
        duration: get_value(song, "duration"),
        inserted_at: now,
        updated_at: now
      }
    end)

    {count, _} = Repo.insert_all(Song, songs_with_timestamps)
    {:ok, count}
  end

  # Helper to get value from either string or atom key
  defp get_value(map, key) when is_binary(key) do
    Map.get(map, key) || Map.get(map, String.to_atom(key))
  end

  @doc """
  Updates a song.
  """
  def update_song(%Song{} = song, attrs) do
    song
    |> Song.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a song.
  """
  def delete_song(%Song{} = song) do
    Repo.delete(song)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking song changes.
  """
  def change_song(%Song{} = song, attrs \\ %{}) do
    Song.changeset(song, attrs)
  end

  @doc """
  Searches songs by title or artist.
  """
  def search_songs(session_id, query) do
    search_term = "%#{query}%"

    Song
    |> where([s], s.session_id == ^session_id)
    |> where([s], ilike(s.title, ^search_term) or ilike(s.artist, ^search_term))
    |> order_by([s], [asc: s.artist, asc: s.title])
    |> Repo.all()
  end
end
