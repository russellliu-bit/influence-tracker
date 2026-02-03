import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: "keys.env" });

const SERPER_KEY = process.env.serper_key || "";
const X_THREADS_KEY = process.env.x_threads_key || "";
const YT_IG_TIKTOK_KEY = process.env.yt_ig_tiktok_key || "";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-API-KEY");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

const staticDir = process.env.STATIC_DIR || "docs";
app.use(express.static(path.join(__dirname, staticDir)));

function parseAuthHeader(value) {
  if (!value) return null;
  const index = value.indexOf(":");
  if (index === -1) {
    return { key: "Authorization", value };
  }
  return {
    key: value.slice(0, index).trim(),
    value: value.slice(index + 1).trim(),
  };
}

async function proxyJson(req, res, url, headers) {
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(req.body || {}),
    });
    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";
    res.status(upstream.status);
    res.type(contentType);
    res.send(text);
  } catch (error) {
    res.status(500).json({ error: "proxy_failed", message: String(error) });
  }
}

app.post("/api/serper/search", (req, res) => {
  if (!SERPER_KEY) {
    res.status(500).json({ error: "missing_serper_key" });
    return;
  }
  proxyJson(req, res, "https://google.serper.dev/search", {
    "Content-Type": "application/json",
    "X-API-KEY": SERPER_KEY,
  });
});

app.post("/api/serper/news", (req, res) => {
  if (!SERPER_KEY) {
    res.status(500).json({ error: "missing_serper_key" });
    return;
  }
  proxyJson(req, res, "https://google.serper.dev/news", {
    "Content-Type": "application/json",
    "X-API-KEY": SERPER_KEY,
  });
});

app.post("/api/enrich/x", (req, res) => {
  if (!X_THREADS_KEY) {
    res.status(500).json({ error: "missing_x_threads_key" });
    return;
  }
  const parsed = parseAuthHeader(X_THREADS_KEY) || { key: "Authorization", value: X_THREADS_KEY };
  proxyJson(req, res, "https://nexus-data-api.fastgrowth.app/v1/kol/performance/enrichment", {
    "Content-Type": "application/json",
    [parsed.key]: parsed.value,
  });
});

app.post("/api/enrich/yt", (req, res) => {
  if (!YT_IG_TIKTOK_KEY) {
    res.status(500).json({ error: "missing_yt_ig_tiktok_key" });
    return;
  }
  const parsed =
    parseAuthHeader(YT_IG_TIKTOK_KEY) || { key: "Authorization", value: YT_IG_TIKTOK_KEY };
  proxyJson(req, res, "https://uppapi.fastgrowth.app/kol-performance/api/enrichment", {
    "Content-Type": "application/json",
    [parsed.key]: parsed.value,
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT || 5173);
app.listen(port, () => {
  console.log(`Proxy server listening on http://localhost:${port}`);
});
