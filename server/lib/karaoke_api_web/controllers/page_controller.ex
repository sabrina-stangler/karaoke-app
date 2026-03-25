defmodule KaraokeApiWeb.PageController do
  use KaraokeApiWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
