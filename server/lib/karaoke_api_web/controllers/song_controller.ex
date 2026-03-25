defmodule KaraokeApiWeb.SongController do
  use KaraokeApiWeb, :controller

  alias KaraokeApi.Songs

  action_fallback KaraokeApiWeb.FallbackController

  def index(conn, %{"session_id" => session_id}) do
    songs = Songs.list_songs(session_id)
    render(conn, :index, songs: songs)
  end

  def create_bulk(conn, %{"session_id" => session_id, "songs" => songs_list}) do
    with {:ok, count} <- Songs.create_songs_bulk(session_id, songs_list) do
      # Broadcast to WebSocket subscribers
      KaraokeApiWeb.Endpoint.broadcast(
        "session:#{session_id}",
        "song:added",
        %{count: count}
      )

      conn
      |> put_status(:created)
      |> json(%{message: "Successfully created #{count} songs"})
    end
  end

  def search(conn, %{"session_id" => session_id, "query" => query}) do
    songs = Songs.search_songs(session_id, query)
    render(conn, :index, songs: songs)
  end
end
