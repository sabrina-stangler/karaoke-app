defmodule KaraokeApi.Repo.Migrations.CreateSongs do
  use Ecto.Migration

  def change do
    create table(:songs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :session_id, references(:sessions, type: :binary_id, on_delete: :delete_all), null: false
      add :title, :string, null: false
      add :artist, :string, null: false
      add :duration, :integer

      timestamps(type: :utc_datetime)
    end

    create index(:songs, [:session_id])
  end
end
