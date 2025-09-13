# Pine Script v6 MCP（manual.json 利用）

Repository: https://github.com/harunamitrader/pinescriptV6_MCP

Pine Script v6 のリファレンスマニュアルを JSON 化した `manual.json` を用いて、Claude Code / Codex CLI / Gemini CLI 等の MCP クライアントから正確な Pine Script コーディングを支援するシンプルな MCP サーバです。

- 目的: 正確な API 仕様・シグネチャ・定数名・用例への素早いアクセス
- 前提: `manual.json`（UTF-8, v6, ja）を同梱済み。
- 方針: 最小依存・自己完結・読み取り専用・メモリ常駐インデックス

---

## 機能概要

- stdio ベースの MCP サーバ（Node.js）
- 起動時に `manual.json` を読み込み、軽量インデックスを構築
- 提供ツール
  - `search_docs`: クエリで関数/定数/アノテーション等を横断検索
  - `get_entry`: `id` で単一エントリの詳細（最小情報）を取得
  - `complete_symbol`: プレフィックス補完（例: `plot`, `ta.r`, `color.`）
  - `list_categories`: 種別ごとの件数集計（annotation/const/function/type 等）

返却は LLM が引用しやすい JSON（structuredContent を含む）です。

---

## インストール / 実行

1) 依存インストール

```
cd pinescriptMCP
npm i
```

2) 起動（手動起動の例）

```
node pinescriptMCP/server.mjs --manual C:/path/to/manual.json
```

環境変数 `PINE_MANUAL_PATH` でも指定できます。

---

## Codex CLI 設定例（TOML）

`~/.codex/config.toml` に以下を追記します。

```toml
[mcp_servers]
[mcp_servers.pinescript_mcp]
command = "C:/Program Files/nodejs/node.exe"
args = [
  "C:/Users/harunami/Desktop/codex/pinescriptMCP/server.mjs",
  "--manual",
  "C:/Users/harunami/Desktop/codex/pinescriptMCP/manual.json"
]
```

Codex を再起動し、`/mcp` に `pinescript_mcp` とツール群が表示されることを確認してください。

---

## Claude Desktop（Claude Code）設定例（JSON）

Claude Desktop の設定（Developer → MCP Servers）で、次の JSON を追加します。

```json
{
  "mcpServers": {
    "pinescript_mcp": {
      "command": "node",
      "args": [
        "C:/Users/harunami/Desktop/codex/pinescriptMCP/server.mjs",
        "--manual",
        "C:/Users/harunami/Desktop/codex/pinescriptMCP/manual.json"
      ]
    }
  }
}
```

Claude Code（VS Code 拡張）をご利用の場合も、同等の MCP サーバ定義を追加してください（拡張機能の MCP 設定場所はバージョンにより異なります）。

---

## Gemini CLI 設定例（JSON）

Gemini CLI が MCP 設定で `mcpServers` を受け付ける場合、次のような JSON を設定に追加します（設定ファイルの配置はお使いの CLI に依存）。

```json
{
  "mcpServers": {
    "pinescript_mcp": {
      "command": "node",
      "args": [
        "C:/Users/harunami/Desktop/codex/pinescriptMCP/server.mjs",
        "--manual",
        "C:/Users/harunami/Desktop/codex/pinescriptMCP/manual.json"
      ]
    }
  }
}
```

---

## 使い方（例）

- `search_docs` で `{"query":"plot"}` を検索 → 候補から `get_entry` で詳細取得
- `complete_symbol` で `{"prefix":"color."}` を補完
- `list_categories` で種別件数を把握

---

## 注意・ライセンス

- 本サーバは読み取り専用です。外部書き込み・外部呼び出しは行いません。
- `manual.json` は本リポジトリ同梱のユーザー生成データです。出典 URL は含まれますが、配布権限はリポジトリ作者の許諾に基づきます。

