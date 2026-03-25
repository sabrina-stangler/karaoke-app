defmodule KaraokeApi.Sessions do
  @moduledoc """
  The Sessions context.
  """

  import Ecto.Query, warn: false
  alias KaraokeApi.Repo
  alias KaraokeApi.Sessions.Session

  @doc """
  Returns the list of sessions.
  """
  def list_sessions do
    Repo.all(Session)
  end

  @doc """
  Gets a single session.

  Raises `Ecto.NoResultsError` if the Session does not exist.
  """
  def get_session!(id), do: Repo.get!(Session, id)

  @doc """
  Gets a single session by code.

  Returns `nil` if the Session does not exist.
  """
  def get_session_by_code(code) do
    Repo.get_by(Session, code: code)
  end

  @doc """
  Creates a session.
  """
  def create_session(attrs \\ %{}) do
    # Generate a unique code if not provided
    attrs = if Map.has_key?(attrs, :code) do
      attrs
    else
      Map.put(attrs, :code, generate_unique_code())
    end

    %Session{}
    |> Session.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a session.
  """
  def update_session(%Session{} = session, attrs) do
    session
    |> Session.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a session.
  """
  def delete_session(%Session{} = session) do
    Repo.delete(session)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking session changes.
  """
  def change_session(%Session{} = session, attrs \\ %{}) do
    Session.changeset(session, attrs)
  end

  @doc """
  Ends a session by updating its status to "ended".
  """
  def end_session(%Session{} = session) do
    update_session(session, %{status: "ended"})
  end

  defp generate_unique_code do
    code = Session.generate_code()

    case get_session_by_code(code) do
      nil -> code
      _ -> generate_unique_code()  # Recursively generate until unique
    end
  end
end
