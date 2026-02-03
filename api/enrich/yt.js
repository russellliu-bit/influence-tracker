const { parseAuthHeader, proxyJson, withCors } = require("../_utils");

module.exports = async function handler(req, res) {
  withCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }
  const raw = process.env.yt_ig_tiktok_key || "";
  if (!raw) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "missing_yt_ig_tiktok_key" }));
    return;
  }
  const parsed = parseAuthHeader(raw) || { key: "Authorization", value: raw };
  await proxyJson(req, res, "https://uppapi.fastgrowth.app/kol-performance/api/enrichment", {
    "Content-Type": "application/json",
    [parsed.key]: parsed.value,
  });
};
