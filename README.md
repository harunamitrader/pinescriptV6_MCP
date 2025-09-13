# Pine Script v6 MCP（manual.json 利用）

Repository: https://github.com/harunamitrader/pinescriptV6_MCP

Pine Script v6 のリファレンスマニュアルを JSON 化した `manual.json` を用いて、Claude Code / Codex CLI / Gemini CLI などの MCP クライアントから正確な Pine Script コーディングを支援するシンプルな MCP サーバです。

- 目的: 正確な API 仕様・定数名・用例への素早いアクセス
- 前提: `manual.json`（UTF-8, v6, ja）を同梱済み
- 方針: 最小依存・読み取り専用・メモリ内インデックス

---

## 機能概要

- stdio ベースの MCP サーバ（Node.js）
- 起動時に `manual.json` を読み込み、軽量インデックスを構築
- 提供ツール
  - `search_docs`: クエリで関数/定数/アノテーション等を横断検索
  - `get_entry`: `id` で単一エントリの詳細（最小情報）を取得
  - `complete_symbol`: プレフィックス補完（例: `plot`, `ta.r`, `color.`）
  - `list_categories`: 種別ごとの件数集計（annotation/const/function/type 等）

返却は LLM が引用しやすい JSON（`structuredContent` を含む）です。

---

## ツール詳細（AIコーディング視点）

- search_docs: あいまい探索に最適
  - 用途: 正式名称が曖昧／断片だけ分かるときの横断検索。
  - 強み: 前方一致優先＋部分一致で広く当たりを取得。`kind` で絞り込み可。
  - 例: `{"query":"plot"}` / `{"query":"ta.r","kind":"function"}`
  - 活用: 新規実装の関数候補を洗い出し、未知のアノテーションや定数を探索。

- get_entry: コード確定前の最終確認
  - 用途: 検索/補完で特定した `id` の詳細確認（タイトル・種別・URL、将来的にシグネチャ等）。
  - 強み: LLM が `structuredContent` をそのまま参照でき、引数名や戻り値の取り違えを抑制。
  - 例: `{"id":"fun_color.b"}` → `color.b()` の詳細を返却。
  - 活用: 実装直前の仕様チェック、レビュー時の根拠提示（`source_url` 付き）。

- complete_symbol: 名前空間ベースの高速補完
  - 用途: コーディング中に `ta.` や `color.` のような接頭辞から候補を即時取得。
  - 強み: 前方一致で低オーバーヘッド。名前空間配下の網羅把握にも便利。
  - 例: `{"prefix":"color."}` / `{"prefix":"strategy.","limit":50}`
  - 活用: 実装中の記述補助、同名関数が多い領域の候補比較。

- list_categories: 全体像の把握と探索起点作り
  - 用途: annotation/const/function/type など、領域ごとの件数を把握。
  - 強み: ドキュメントの偏りや対象範囲を俯瞰でき、検索条件の当たりを付けやすい。
  - 例: 引数なしで呼び出し。戻り値は `{kind,count}` の配列。
  - 活用: 初学者のナビゲーション、探索開始時のスコープ設定。

おすすめ構成（CLI で AI が効率良くコーディングする前提）
- コンパクト重視: `complete_symbol` + `get_entry`
- 横断探索重視: `search_docs` + `get_entry`
- 快適性重視: `search_docs` + `complete_symbol` + `get_entry`（通常はこれで十分）
- 補助: 必要に応じて `list_categories` を追加

---

## インストール / 実行

0) クローン導入（推奨）

```
git clone https://github.com/harunamitrader/pinescriptV6_MCP.git
cd pinescriptV6_MCP/pinescriptMCP
```

1) 依存インストール

```
npm i
```

2) 起動（手動起動の例）

```
node server.mjs --manual ./manual.json
# 既存の別の manual.json を使う場合
node server.mjs --manual C:/path/to/manual.json
```

環境変数 `PINE_MANUAL_PATH` でも指定できます。

---

## Codex CLI 設定（TOML）

`~/.codex/config.toml` に以下を追記します。

```toml
[mcp_servers]
[mcp_servers.pinescript_mcp]
command = "C:/Program Files/nodejs/node.exe"
args = [
  "C:/path/to/pinescriptV6_MCP/pinescriptMCP/server.mjs",
  "--manual",
  "C:/path/to/pinescriptV6_MCP/pinescriptMCP/manual.json"
]
```

Codex を再起動し、`/mcp` に `pinescript_mcp` とツール群が表示されることを確認してください。

---

## Claude Desktop（JSON）

設定 → Developer → MCP Servers → Add で、次の JSON を追加します。

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

## Gemini CLI（JSON）

Gemini CLI の MCP 設定に次を追加します（設定パスは CLI 実装に依存）。

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

## 使い方（例）

- `search_docs` で `{"query":"plot"}` を検索 → 候補から `get_entry` で詳細取得
- `complete_symbol` で `{"prefix":"color."}` を補完
- `list_categories` で種別件数を把握

---

## 注意・ライセンス

- 本サーバは読み取り専用です。外部への書き込みや外部呼び出しは行いません。
- `manual.json` は本リポジトリ同梱のユーザー生成データです。出典 URL は含まれますが、配布権限はリポジトリ作者の許諾に基づきます。
