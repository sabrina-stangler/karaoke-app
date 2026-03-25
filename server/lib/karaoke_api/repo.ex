defmodule KaraokeApi.Repo do
  use Ecto.Repo,
    otp_app: :karaoke_api,
    adapter: Ecto.Adapters.Postgres
end
