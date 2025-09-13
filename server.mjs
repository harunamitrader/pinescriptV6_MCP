// server.mjs — Pine Script v6 manual.json を活用した最小 MCP サーバ
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadManual, normalizeEntries, buildIndex } from "./indexer.mjs";

function parseArgs(argv) {
  const out = { manual: process.env.PINE_MANUAL_PATH || "pinescriptMCP/manual.json" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if ((a === "--manual" || a === "-m") && i + 1 < argv.length) {
      out.manual = argv[++i];
    }
  }
  return out;
}

async function main() {
  const { manual } = parseArgs(process.argv);

  // 起動ログ（stderr に簡易情報）
  console.error(`[pinescript-mcp] loading: ${manual}`);
  const data = loadManual(manual);
  const entries = normalizeEntries(data);
  const idx = buildIndex(entries);
  console.error(`[pinescript-mcp] entries: ${entries.length}, version: ${data?.version}, lang: ${data?.language}`);

  const server = new McpServer({ name: "pinescript-mcp", version: "0.1.0" }, {
    capabilities: {
      tools: {},
      logging: {},
    },
    instructions: "Pine Script v6 の参照を提供します。まず search_docs / complete_symbol で候補を取り、get_entry で詳細を参照してください。",
  });

  // search_docs
  server.tool(
    "search_docs",
    "Pine Script の関数/定数/アノテーション等を横断検索します。",
    {
      query: z.string(),
      limit: z.number().int().positive().max(100).optional(),
      kind: z.string().optional(),
    },
    async ({ query, limit, kind }) => {
      const items = idx.search({ query, limit: limit ?? 20, kind });
      return {
        content: [
          { type: "text", text: `found ${items.length} items for query=\"${query}\"${kind ? ` kind=${kind}` : ""}` },
        ],
        structuredContent: items,
      };
    }
  );

  // get_entry
  server.tool(
    "get_entry",
    "id で単一ドキュメントの詳細を返します（manual.json 由来の範囲）。",
    { id: z.string() },
    async ({ id }) => {
      const item = idx.getById(id);
      if (!item) {
        return {
          content: [{ type: "text", text: `NotFound: ${id}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: `${item.title} (${item.kind})` }],
        structuredContent: item,
      };
    }
  );

  // complete_symbol
  server.tool(
    "complete_symbol",
    "シンボルの前方一致補完を返します（title/id）。",
    {
      prefix: z.string(),
      limit: z.number().int().positive().max(100).optional(),
      kind: z.string().optional(),
    },
    async ({ prefix, limit, kind }) => {
      const items = idx.complete({ prefix, limit: limit ?? 20, kind });
      return {
        content: [{ type: "text", text: `candidates ${items.length} for prefix=\"${prefix}\"` }],
        structuredContent: items,
      };
    }
  );

  // list_categories
  server.tool(
    "list_categories",
    "種別ごとの件数を返します（annotation/const/function/type 等）。",
    {},
    async () => {
      const kinds = idx.listKinds();
      return {
        content: [{ type: "text", text: kinds.map((k) => `${k.kind}:${k.count}`).join(", ") }],
        structuredContent: kinds,
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[pinescript-mcp] fatal:", err?.stack || err?.message || String(err));
  process.exit(1);
});

