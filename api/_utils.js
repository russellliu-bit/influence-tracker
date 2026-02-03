function withCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-API-KEY");
}

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
    res.statusCode = upstream.status;
    res.setHeader("Content-Type", contentType);
    res.end(text);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "proxy_failed", message: String(error) }));
  }
}

module.exports = { parseAuthHeader, proxyJson, withCors };
