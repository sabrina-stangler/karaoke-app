defmodule KaraokeApiWeb.SessionController do
  use KaraokeApiWeb, :controller

  alias KaraokeApi.Sessions
  alias KaraokeApi.Sessions.Session

  action_fallback KaraokeApiWeb.FallbackController

  def create(conn, %{"dj_name" => dj_name}) do
    with {:ok, %Session{} = session} <- Sessions.create_session(%{dj_name: dj_name}) do
      conn
      |> put_status(:created)
      |> render(:show, session: session)
    end
  end

  def show_by_code(conn, %{"code" => code}) do
    case Sessions.get_session_by_code(code) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Session not found"})
      session ->
        render(conn, :show, session: session)
    end
  end

  def end_session(conn, %{"id" => id}) do
    session = Sessions.get_session!(id)

    with {:ok, %Session{} = session} <- Sessions.end_session(session) do
      # Broadcast to WebSocket subscribers
      KaraokeApiWeb.Endpoint.broadcast(
        "session:#{id}",
        "session:ended",
        %{session_id: id}
      )

      render(conn, :show, session: session)
    end
  end
end
