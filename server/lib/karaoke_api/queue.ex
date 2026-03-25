defmodule KaraokeApi.Queue do
  @moduledoc """
  The Queue context.
  """

  import Ecto.Query, warn: false
  alias KaraokeApi.Repo
  alias KaraokeApi.Queue.QueueEntry

  @doc """
  Returns the list of queue entries for a session, ordered by position.
  """
  def list_queue(session_id) do
    QueueEntry
    |> where([q], q.session_id == ^session_id)
    |> order_by([q], asc: q.position)
    |> preload(:song)
    |> Repo.all()
  end

  @doc """
  Returns only pending queue entries for a session.
  """
  def list_pending_queue(session_id) do
    QueueEntry
    |> where([q], q.session_id == ^session_id and q.status == "pending")
    |> order_by([q], asc: q.position)
    |> preload(:song)
    |> Repo.all()
  end

  @doc """
  Gets a single queue entry.

  Raises `Ecto.NoResultsError` if the Queue entry does not exist.
  """
  def get_queue_entry!(id) do
    QueueEntry
    |> preload(:song)
    |> Repo.get!(id)
  end

  @doc """
  Creates a queue entry.
  """
  def create_queue_entry(attrs \\ %{}) do
    # If position not provided, append to end of queue
    attrs = if Map.has_key?(attrs, :position) do
      attrs
    else
      session_id = Map.get(attrs, :session_id)
      next_position = get_next_position(session_id)
      Map.put(attrs, :position, next_position)
    end

    %QueueEntry{}
    |> QueueEntry.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a queue entry.
  """
  def update_queue_entry(%QueueEntry{} = queue_entry, attrs) do
    queue_entry
    |> QueueEntry.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a queue entry.
  """
  def delete_queue_entry(%QueueEntry{} = queue_entry) do
    Repo.delete(queue_entry)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking queue entry changes.
  """
  def change_queue_entry(%QueueEntry{} = queue_entry, attrs \\ %{}) do
    QueueEntry.changeset(queue_entry, attrs)
  end

  @doc """
  Marks a queue entry as completed.
  """
  def complete_queue_entry(%QueueEntry{} = queue_entry) do
    update_queue_entry(queue_entry, %{
      status: "completed",
      completed_at: DateTime.utc_now()
    })
  end

  @doc """
  Marks a queue entry as skipped.
  """
  def skip_queue_entry(%QueueEntry{} = queue_entry) do
    update_queue_entry(queue_entry, %{status: "skipped"})
  end

  @doc """
  Reorders queue entries.
  Updates positions for multiple entries in a transaction.
  """
  def reorder_queue(updates) do
    Repo.transaction(fn ->
      Enum.each(updates, fn %{id: id, position: position} ->
        queue_entry = get_queue_entry!(id)
        update_queue_entry(queue_entry, %{position: position})
      end)
    end)
  end

  # Gets the next available position for a session's queue.
  defp get_next_position(session_id) do
    result = QueueEntry
    |> where([q], q.session_id == ^session_id)
    |> select([q], max(q.position))
    |> Repo.one()

    case result do
      nil -> 0
      max_position -> max_position + 1
    end
  end
end
