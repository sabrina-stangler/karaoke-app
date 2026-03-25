defmodule KaraokeApi.Songs.Song do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "songs" do
    field :title, :string
    field :artist, :string
    field :duration, :integer

    belongs_to :session, KaraokeApi.Sessions.Session

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(song, attrs) do
    song
    |> cast(attrs, [:title, :artist, :duration, :session_id])
    |> validate_required([:title, :artist, :session_id])
    |> validate_number(:duration, greater_than: 0)
    |> foreign_key_constraint(:session_id)
  end
end
