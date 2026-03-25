defmodule KaraokeApi.Repo.Migrations.CreateSessions do
  use Ecto.Migration

  def change do
    create table(:sessions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :code, :string, size: 4, null: false
      add :dj_name, :string
      add :status, :string, null: false, default: "active"

      timestamps(type: :utc_datetime)
    end

    create unique_index(:sessions, [:code])
    create index(:sessions, [:status])
  end
end
