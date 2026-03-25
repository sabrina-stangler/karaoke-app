#!/usr/bin/env elixir

# Test script for Karaoke API
# Run with: elixir test_api.exs

Mix.install([
  {:httpoison, "~> 2.0"},
  {:jason, "~> 1.4"}
])

defmodule KaraokeAPITest do
  def test_create_session do
    url = "http://localhost:4000/api/sessions"
    headers = [{"Content-Type", "application/json"}]
    body = Jason.encode!(%{dj_name: "Test DJ"})
    
    IO.puts("\n=== Testing POST /api/sessions ===")
    IO.puts("Request: POST #{url}")
    IO.puts("Body: #{body}")
    
    case HTTPoison.post(url, body, headers) do
      {:ok, %HTTPoison.Response{status_code: status, body: response}} ->
        IO.puts("Status: #{status}")
        IO.puts("Response: #{response}")
        
        case Jason.decode(response) do
          {:ok, json} ->
            session_code = get_in(json, ["data", "code"])
            IO.puts("\n✅ Session created with code: #{session_code}")
            {:ok, json["data"]}
          {:error, _} ->
            IO.puts("\n❌ Failed to parse JSON response")
            {:error, :parse_error}
        end
        
      {:error, reason} ->
        IO.puts("\n❌ Request failed: #{inspect(reason)}")
        {:error, reason}
    end
  end
  
  def test_get_session(code) do
    url = "http://localhost:4000/api/sessions/#{code}"
    
    IO.puts("\n=== Testing GET /api/sessions/:code ===")
    IO.puts("Request: GET #{url}")
    
    case HTTPoison.get(url) do
      {:ok, %HTTPoison.Response{status_code: status, body: response}} ->
        IO.puts("Status: #{status}")
        IO.puts("Response: #{response}")
        IO.puts("\n✅ Session retrieved")
        {:ok, response}
        
      {:error, reason} ->
        IO.puts("\n❌ Request failed: #{inspect(reason)}")
        {:error, reason}
    end
  end
end

# Run tests
case KaraokeAPITest.test_create_session() do
  {:ok, session} ->
    KaraokeAPITest.test_get_session(session["code"])
  {:error, _} ->
    IO.puts("\n❌ Stopping tests due to failure")
end
