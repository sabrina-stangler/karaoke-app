defmodule KaraokeApiWeb.Router do
  use KaraokeApiWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {KaraokeApiWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", KaraokeApiWeb do
    pipe_through :browser

    get "/", PageController, :home
  end

  # API routes
  scope "/api", KaraokeApiWeb do
    pipe_through :api

    # Session routes
    post "/sessions", SessionController, :create
    get "/sessions/:code", SessionController, :show_by_code
    put "/sessions/:id/end", SessionController, :end_session

    # Song routes
    get "/sessions/:session_id/songs", SongController, :index
    post "/sessions/:session_id/songs/bulk", SongController, :create_bulk
    get "/sessions/:session_id/songs/search", SongController, :search

    # Queue routes
    get "/sessions/:session_id/queue", QueueController, :index
    post "/sessions/:session_id/queue", QueueController, :create
    put "/queue/:id/complete", QueueController, :complete
    put "/queue/:id/skip", QueueController, :skip
    put "/queue/reorder", QueueController, :reorder
  end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:karaoke_api, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: KaraokeApiWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
