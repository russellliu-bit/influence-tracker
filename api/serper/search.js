const { proxyJson, withCors } = require("../_utils");

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
  const key = process.env.serper_key || "";
  if (!key) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "missing_serper_key" }));
    return;
  }
  await proxyJson(req, res, "https://google.serper.dev/search", {
    "Content-Type": "application/json",
    "X-API-KEY": key,
  });
};
