defmodule KaraokeApiWeb.SessionJSON do
  alias KaraokeApi.Sessions.Session

  @doc """
  Renders a single session.
  """
  def show(%{session: session}) do
    %{data: data(session)}
  end

  defp data(%Session{} = session) do
    %{
      id: session.id,
      code: session.code,
      dj_name: session.dj_name,
      status: session.status,
      inserted_at: session.inserted_at,
      updated_at: session.updated_at
    }
  end
end
