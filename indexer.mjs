// indexer.mjs — manual.json を読み込み、簡易インデックス/検索/補完を提供
import fs from "node:fs";

function safeLower(s) {
  return (s ?? "").toString().normalize("NFKC").toLowerCase();
}

function mapKind(prefix) {
  const m = {
    an: "annotation",
    const: "const",
    fun: "function",
    func: "function",
    fn: "function",
    type: "type",
    var: "variable",
    dir: "directive",
  };
  return m[prefix] ?? prefix ?? "unknown";
}

function deriveCategory(id, kind) {
  // 例: const_color.red → color
  if (kind === "const" && id?.startsWith("const_")) {
    const rest = id.slice("const_".length);
    const dot = rest.indexOf(".");
    if (dot > 0) {
      const beforeDot = rest.slice(0, dot);
      const underPos = beforeDot.indexOf("_");
      if (underPos > -1) return beforeDot.slice(0, underPos);
      return beforeDot;
    }
  }
  // 例: an_@function → @function（annotation の場合はそのまま）
  if (kind === "annotation" && id?.startsWith("an_")) {
    return id.slice(3);
  }
  return null;
}

export function loadManual(path) {
  const raw = fs.readFileSync(path, { encoding: "utf8" });
  const data = JSON.parse(raw);
  return data;
}

export function normalizeEntries(data) {
  const entries = [];
  const baseUrl = data?.source_url ?? null;
  const toc = Array.isArray(data?.toc) ? data.toc : [];

  for (const item of toc) {
    const kind = mapKind(item?.category_prefix);
    const entry = {
      id: item?.id ?? "",
      title: item?.title ?? "",
      kind,
      category: deriveCategory(item?.id, kind),
      // 詳細本文は不明なので後で拡張。最低限の URL を推定
      source_url: baseUrl ? `${baseUrl}#${encodeURIComponent(item?.id ?? "")}` : null,
      // 以下は未解決（manual.json に詳細がない場合がある）
      signatures: [],
      description: null,
      args: [],
      returns: null,
      examples: [],
    };
    entries.push(entry);
  }
  return entries;
}

export function buildIndex(entries) {
  // 前方一致/部分一致の簡易スコアリング
  const index = entries.map((e) => ({
    ...e,
    _ltitle: safeLower(e.title),
    _lid: safeLower(e.id),
  }));

  function matchScore(item, q) {
    const t = item._ltitle;
    const i = item._lid;
    if (t.startsWith(q)) return 100;
    if (i.startsWith(q)) return 95;
    if (t.includes(q)) return 60;
    if (i.includes(q)) return 55;
    return 0;
  }

  return {
    entries,
    search({ query, kind, limit = 20 }) {
      const q = safeLower(query);
      const res = [];
      for (const item of index) {
        if (kind && item.kind !== kind) continue;
        const s = matchScore(item, q);
        if (s > 0) res.push({ item, score: s });
      }
      res.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
      return res.slice(0, limit).map(({ item, score }) => ({
        id: item.id,
        title: item.title,
        kind: item.kind,
        score,
      }));
    },
    complete({ prefix, kind, limit = 20 }) {
      const q = safeLower(prefix);
      const res = [];
      for (const item of index) {
        if (kind && item.kind !== kind) continue;
        if (item._ltitle.startsWith(q) || item._lid.startsWith(q)) {
          res.push(item);
        }
      }
      res.sort((a, b) => a.title.localeCompare(b.title));
      return res.slice(0, limit).map((item) => ({ id: item.id, title: item.title, kind: item.kind }));
    },
    getById(id) {
      return entries.find((e) => e.id === id) || null;
    },
    listKinds() {
      const counts = new Map();
      for (const e of entries) {
        counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
      }
      return Array.from(counts.entries()).map(([kind, count]) => ({ kind, count }));
    },
  };
}

