defmodule KaraokeApi.Queue.QueueEntry do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "queue_entries" do
    field :singer_name, :string
    field :status, :string, default: "pending"
    field :position, :integer
    field :completed_at, :utc_datetime

    belongs_to :session, KaraokeApi.Sessions.Session
    belongs_to :song, KaraokeApi.Songs.Song

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(queue_entry, attrs) do
    queue_entry
    |> cast(attrs, [:singer_name, :status, :position, :completed_at, :session_id, :song_id])
    |> validate_required([:singer_name, :status, :position, :session_id, :song_id])
    |> validate_inclusion(:status, ["pending", "completed", "skipped"])
    |> validate_number(:position, greater_than_or_equal_to: 0)
    |> foreign_key_constraint(:session_id)
    |> foreign_key_constraint(:song_id)
  end
end
