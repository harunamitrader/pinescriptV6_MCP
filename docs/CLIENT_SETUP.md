# クライアント設定ガイド（Codex CLI / Claude / Gemini CLI）

このドキュメントは、Pine Script v6 MCP サーバ（`server.mjs`）を各クライアントから利用するための設定例をまとめたものです。

前提:
- Node.js がインストール済み
- `manual.json` をローカルに用意済み（UTF-8, v6, ja）

---

## Codex CLI（TOML）

ユーザー設定 `~/.codex/config.toml` に MCP サーバ定義を追加します。

```toml
[mcp_servers]
[mcp_servers.pinescript_mcp]
command = "C:/Program Files/nodejs/node.exe"  # node.exe の絶対パス推奨
args = [
  "C:/path/to/pinescriptV6_MCP/pinescriptMCP/server.mjs",
  "--manual",
  "C:/path/to/pinescriptV6_MCP/pinescriptMCP/manual.json"
]
```

Codex CLI を再起動し、`/mcp` でサーバとツールが表示されることを確認します。

---

## Claude Desktop（JSON）

設定 → Developer → MCP Servers → Add から、以下の JSON を追加します。

```json
{
  "mcpServers": {
    "pinescript_mcp": {
      "command": "node",
      "args": [
        "C:/path/to/pinescriptV6_MCP/pinescriptMCP/server.mjs",
        "--manual",
        "C:/path/to/pinescriptV6_MCP/pinescriptMCP/manual.json"
      ]
    }
  }
}
```

Claude Code（VS Code 拡張）でも同様の MCP サーバ定義を設定します（設定箇所はバージョンにより異なります）。

---

## Gemini CLI（JSON）

Gemini CLI の MCP 設定ファイル（実装によりパスが異なります）に次の `mcpServers` を追加します。

```json
{
  "mcpServers": {
    "pinescript_mcp": {
      "command": "node",
      "args": [
        "C:/path/to/pinescriptV6_MCP/pinescriptMCP/server.mjs",
        "--manual",
        "C:/path/to/pinescriptV6_MCP/pinescriptMCP/manual.json"
      ]
    }
  }
}
```

---

## 動作確認のコツ

- 起動ログ: MCP サーバは起動時に stderr に `entries: <n>, version: v6, lang: ja` を出力します。
- 初回は `search_docs` を `{"query":"plot","limit":5}` で実行し、`structuredContent` にヒットが入ることを確認してください。
- `manual.json` のパスは絶対パス推奨。スペースを含む場合は引用符で囲みます。
