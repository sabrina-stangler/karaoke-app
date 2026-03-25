defmodule KaraokeApi.Repo.Migrations.CreateQueueEntries do
  use Ecto.Migration

  def change do
    create table(:queue_entries, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :session_id, references(:sessions, type: :binary_id, on_delete: :delete_all), null: false
      add :song_id, references(:songs, type: :binary_id, on_delete: :delete_all), null: false
      add :singer_name, :string, null: false
      add :status, :string, null: false, default: "pending"
      add :position, :integer, null: false
      add :completed_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:queue_entries, [:session_id])
    create index(:queue_entries, [:session_id, :position])
  end
end
