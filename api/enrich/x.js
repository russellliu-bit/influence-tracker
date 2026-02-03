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
  const raw = process.env.x_threads_key || "";
  if (!raw) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "missing_x_threads_key" }));
    return;
  }
  const parsed = parseAuthHeader(raw) || { key: "Authorization", value: raw };
  await proxyJson(req, res, "https://nexus-data-api.fastgrowth.app/v1/kol/performance/enrichment", {
    "Content-Type": "application/json",
    [parsed.key]: parsed.value,
  });
};
