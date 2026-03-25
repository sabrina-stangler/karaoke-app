defmodule KaraokeApi.Sessions.Session do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "sessions" do
    field :code, :string
    field :dj_name, :string
    field :status, :string, default: "active"

    has_many :songs, KaraokeApi.Songs.Song
    has_many :queue_entries, KaraokeApi.Queue.QueueEntry

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(session, attrs) do
    session
    |> cast(attrs, [:code, :dj_name, :status])
    |> validate_required([:code, :status])
    |> validate_length(:code, is: 4)
    |> validate_format(:code, ~r/^\d{4}$/, message: "must be 4 digits")
    |> validate_inclusion(:status, ["active", "ended"])
    |> unique_constraint(:code)
  end

  @doc "Generate a random 4-digit code"
  def generate_code do
    Enum.random(1000..9999) |> to_string()
  end
end
