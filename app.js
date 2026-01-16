const settingsModal = document.getElementById("settingsModal");
const openSettingsBtn = document.getElementById("openSettings");
const closeSettingsBtn = document.getElementById("closeSettings");
const saveSettingsBtn = document.getElementById("saveSettings");
const testApisBtn = document.getElementById("testApisBtn");
const openPresetBtn = document.getElementById("openPreset");
const presetPanel = document.getElementById("presetPanel");
const presetPassphrase = document.getElementById("presetPassphrase");
const presetConfirm = document.getElementById("presetConfirm");
const presetCancel = document.getElementById("presetCancel");
const presetMsg = document.getElementById("presetMsg");
const runSearchBtn = document.getElementById("runSearch");
const exportCsvBtn = document.getElementById("exportCsv");
const resultsGrid = document.getElementById("resultsGrid");
const resultsSummary = document.getElementById("resultsSummary");
const statusState = document.getElementById("statusState");
const statusText = document.getElementById("statusText");
const statusMeta = document.getElementById("statusMeta");
const serperStatus = document.getElementById("serperStatus");
const xStatus = document.getElementById("xStatus");
const ytStatus = document.getElementById("ytStatus");

const defaultSettings = {
  actorId: "",
  serperApi: "",
  geminiApi: "",
  xEndpoint: "https://nexus-data-api.fastgrowth.app/v1/kol/performance/enrichment",
  xAuth: "",
  ytEndpoint: "https://uppapi.fastgrowth.app/kol-performance/api/enrichment",
  ytAuth: "",
  enableGoogle: true,
  enableSocial: true,
};

const defaultFilters = {
  sites: ["youtube"],
  gl: "us",
  hl: "en",
  tbs: "",
  limit: 30,
};

let currentSettings = loadSettings();
let currentResults = [];
let currentFilters = loadFilters();

const presetPass = "FASTLANE";
const presetConfig = {
  actorId: "V1",
  serperApi: "9d8f9797336830655da3739459705c4f40266e1d",
  geminiApi: "AIzaSyBiejasTxtV_7ofDQ41Aqql3LrR9McsGoI",
  xEndpoint: "https://nexus-data-api.fastgrowth.app/v1/kol/performance/enrichment",
  xAuth: "Bearer 8a3e7f2b-1c9d-4a5f-b8c3-6e9a2d7f1b0c",
  ytEndpoint: "https://uppapi.fastgrowth.app/kol-performance/api/enrichment",
  ytAuth: "kqt4Rt6yxKRFe8evDx3shLGguV",
  enableGoogle: true,
  enableSocial: true,
};

const DEFAULT_LIMIT = 12;

const fields = [
  "type",
  "link",
  "cover_image_url",
  "title",
  "hashtag",
  "description",
  "publish_date",
  "views",
  "likes",
  "comments",
  "collections",
  "shares",
  "engagement_rate",
  "audience_comments",
  "channel_link",
  "channel_name",
  "channel_id",
  "profile_picture_url",
  "date",
  "content",
  "dislikes",
  "replies",
];

hydrateSettingsForm();
hydrateFilters();
attachFilterListeners();

if (openSettingsBtn && settingsModal) {
  openSettingsBtn.addEventListener("click", () => {
    if (typeof settingsModal.showModal === "function") {
      settingsModal.showModal();
    } else {
      settingsModal.setAttribute("open", "");
    }
  });
}

if (closeSettingsBtn && settingsModal) {
  closeSettingsBtn.addEventListener("click", (event) => {
    event.preventDefault();
    if (typeof settingsModal.close === "function") {
      settingsModal.close();
    } else {
      settingsModal.removeAttribute("open");
    }
  });
}

if (saveSettingsBtn && settingsModal) {
  saveSettingsBtn.addEventListener("click", (event) => {
    event.preventDefault();
    currentSettings = readSettingsForm();
    persistSettings(currentSettings);
    if (typeof settingsModal.close === "function") {
      settingsModal.close();
    } else {
      settingsModal.removeAttribute("open");
    }
    updateStatus("Saved", "已保存 API 配置", "");
    testApis();
  });
}

if (testApisBtn) {
  testApisBtn.addEventListener("click", async () => {
    currentSettings = readSettingsForm();
    persistSettings(currentSettings);
    await testApis();
  });
}

if (openPresetBtn && presetPanel) {
  openPresetBtn.addEventListener("click", () => {
    presetPanel.classList.add("is-open");
    presetPanel.setAttribute("aria-hidden", "false");
    if (presetPassphrase) presetPassphrase.value = "";
    if (presetMsg) presetMsg.textContent = "";
    if (presetPassphrase) presetPassphrase.focus();
  });
}

if (presetCancel && presetPanel) {
  presetCancel.addEventListener("click", () => {
    presetPanel.classList.remove("is-open");
    presetPanel.setAttribute("aria-hidden", "true");
    if (presetMsg) presetMsg.textContent = "";
  });
}

if (presetConfirm) {
  presetConfirm.addEventListener("click", () => {
    const input = presetPassphrase ? presetPassphrase.value.trim() : "";
    if (!input) {
      if (presetMsg) presetMsg.textContent = "请输入口令";
      return;
    }
    if (input !== presetPass) {
      if (presetMsg) presetMsg.textContent = "口令错误";
      return;
    }
    currentSettings = { ...defaultSettings, ...presetConfig };
    persistSettings(currentSettings);
    hydrateSettingsForm();
    if (presetMsg) presetMsg.textContent = "已加载 ✅";
    updateStatus("Loaded", "已加载预设配置", "");
    testApis();
  });
}

if (runSearchBtn) {
  runSearchBtn.addEventListener("click", async () => {
    const keyword = document.getElementById("keyword").value.trim();
    if (!keyword) {
      updateStatus("Idle", "请输入关键词或 hashtag", "");
      return;
    }
    await runSearch(keyword);
  });
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => {
    if (!currentResults.length) {
      updateStatus("Idle", "暂无可导出的数据", "");
      return;
    }
    const csv = buildCsv(currentResults, fields);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brand-tracker-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

async function runSearch(keyword) {
  updateStatus("Running", "正在抓取数据...", "准备搜索");
  resultsGrid.innerHTML = "";
  currentResults = [];

  const enableGoogle = currentSettings.enableGoogle && currentSettings.serperApi;
  const selectedSites = getSelectedSites();
  currentFilters = readFiltersFromUI();
  persistFilters(currentFilters);
  if (!selectedSites.length) {
    updateStatus("Idle", "请选择至少一个站点", "");
    return;
  }

  let webResults = [];
  if (enableGoogle) {
    try {
      updateStatus("Running", "正在进行 Serper 搜索...", "平台分流查询");
      webResults = await fetchSerperBySites(keyword, selectedSites);
    } catch (error) {
      updateStatus("Warning", "Serper 搜索失败，使用模拟数据", "");
      webResults = demoWeb(keyword, currentFilters.limit || DEFAULT_LIMIT);
    }
  } else {
    webResults = demoWeb(keyword, currentFilters.limit || DEFAULT_LIMIT);
  }

  let enrichedResults = [];
  if (currentSettings.enableSocial) {
    const socialLinks = webResults
      .map((item) => item.link)
      .filter(Boolean)
      .filter(isSocialLink);

    if (socialLinks.length) {
      updateStatus(
        "Running",
        "正在 enrichment 社交媒体链接...",
        `${socialLinks.length} 条链接`
      );
      enrichedResults = await enrichSocialLinks(socialLinks);
    }
  }

  const combined = prioritizeResults(mergeResults(webResults, enrichedResults));
  if (!combined.length) {
    currentResults = demoResults(keyword);
    updateStatus("Demo", "未获取到真实数据，已展示示例", "");
  } else {
    currentResults = combined;
    updateStatus("Done", "抓取完成", `${combined.length} 条结果`);
  }

  renderResults(currentResults);
}

async function fetchSerper(query, limit, filters) {
  const endpoint = filters.endpoint || "https://google.serper.dev/search";
  const resultType = filters.resultType || "web";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": currentSettings.serperApi,
    },
    body: JSON.stringify({
      q: query,
      num: limit,
      ...(filters.page ? { page: filters.page } : {}),
      ...(filters.gl ? { gl: filters.gl } : {}),
      ...(filters.hl ? { hl: filters.hl } : {}),
      ...(filters.tbs ? { tbs: filters.tbs } : {}),
    }),
  });
    if (!response.ok) {
      throw new Error(`Serper error: ${response.status}`);
    }
    const data = await response.json();
    const items = endpoint.includes("/news")
      ? data.news || data.articles || []
      : data.organic || [];
  return items.slice(0, limit).map((item) => ({
    type: resultType,
    link: item.link,
    title: item.title,
    description: item.snippet || item.description || "",
    publish_date: item.date || "",
    source: item.source || "",
  }));
}

async function fetchSerperBySites(keyword, sites) {
  const filters = readSerperFilters();
  const queries = buildSiteQueries(keyword, sites, filters.hl);
  const perSiteLimit = Math.max(5, Math.floor(currentFilters.limit / queries.length));
  const results = await Promise.all(
    queries.map((entry) =>
      fetchSerperPaged(entry.query, perSiteLimit, {
        ...filters,
        endpoint:
          entry.site === "news" || entry.site === "pr"
            ? "https://google.serper.dev/news"
            : undefined,
        resultType: entry.site,
      })
    )
  );
  return results.flat().slice(0, currentFilters.limit);
}

async function fetchSerperPaged(query, limit, filters) {
  const perPage = 10;
  const pages = Math.min(5, Math.ceil(limit / perPage));
  const results = [];
  for (let page = 1; page <= pages; page += 1) {
    const chunk = await fetchSerper(query, perPage, { ...filters, page });
    results.push(...chunk);
  }
  return results.slice(0, limit);
}

async function enrichSocialLinks(links) {
  const results = [];
  for (const link of links) {
    const platform = detectPlatform(link);
    const endpoint = platform === "x" || platform === "threads"
      ? currentSettings.xEndpoint
      : currentSettings.ytEndpoint;
    const authHeader = platform === "x" || platform === "threads"
      ? currentSettings.xAuth
      : currentSettings.ytAuth;

    if (!endpoint) {
      continue;
    }

    const headers = buildAuthHeaders(authHeader);

    const payload = { post_link: link };
    if (currentSettings.actorId) {
      payload.actor_id = currentSettings.actorId;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Enrichment failed: ${response.status}`);
      }
      const data = await response.json();
      results.push(normalizeEnrichment(data, platform, link));
    } catch (error) {
      results.push({
        type: platform,
        link,
        title: "Enrichment 失败",
        description: String(error),
      });
    }
  }
  return results;
}

function normalizeEnrichment(raw, platform, link) {
  const data = raw?.data || raw?.result || raw || {};
  return {
    type: data.type || platform,
    link: data.link || link,
    cover_image_url: data.cover_image_url || data.cover || "",
    title: data.title || data.content || "",
    hashtag: data.hashtag || "",
    description: data.description || "",
    publish_date: data.publish_date || data.date || "",
    source: data.source || "",
    views: data.views || "",
    likes: data.likes || "",
    comments: data.comments || "",
    collections: data.collections || "",
    shares: data.shares || "",
    engagement_rate: data.engagement_rate || "",
    audience_comments: data.audience_comments || "",
    channel_link: data.channel_link || "",
    channel_name: data.channel_name || "",
    channel_id: data.channel_id || "",
    profile_picture_url: data.profile_picture_url || "",
    date: data.date || "",
    content: data.content || "",
    dislikes: data.dislikes || "",
    replies: data.replies || "",
  };
}

function mergeResults(webResults, enrichedResults) {
  const enrichedMap = new Map();
  enrichedResults.forEach((item) => {
    if (item.link) {
      enrichedMap.set(item.link, item);
    }
  });
  const merged = webResults.map((item) => enrichedMap.get(item.link) || item);
  const extra = enrichedResults.filter((item) => !merged.find((m) => m.link === item.link));
  return [...merged, ...extra];
}

function renderResults(items) {
  resultsGrid.innerHTML = "";
  const template = document.getElementById("cardTemplate");
  items.forEach((item, index) => {
    const card = template.content.cloneNode(true);
    const media = card.querySelector(".card-media");
    const chip = card.querySelector(".chip");
    const link = card.querySelector(".card-link");
    const title = card.querySelector(".card-title");
    const desc = card.querySelector(".card-desc");
    const stats = card.querySelector(".card-stats");
    const meta = card.querySelector(".card-meta");
    const article = card.querySelector(".result-card");

    const host = getHostLabel(item.link);
    const displayType = formatTypeLabel(item.type || "web");
    chip.textContent = host ? `${displayType} · ${host}` : displayType;
    chip.classList.add(`chip-${slugifyType(item.type || "web")}`);
    title.textContent = item.title || item.channel_name || "(无标题)";
    desc.textContent = truncateText(item.description || item.content || "", 160);
    link.href = item.link || "#";

    if (item.cover_image_url || item.profile_picture_url) {
      const img = document.createElement("img");
      img.src = item.cover_image_url || item.profile_picture_url;
      img.alt = item.title || "";
      media.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "media-placeholder";
      placeholder.textContent = (item.type || "web").slice(0, 8);
      media.appendChild(placeholder);
    }

    stats.innerHTML = buildStats(item);
    meta.innerHTML = buildMeta(item);

    if (item.link) {
      article.style.cursor = "pointer";
      article.addEventListener("click", () => window.open(item.link, "_blank"));
    }

    article.style.animationDelay = `${index * 0.04}s`;
    resultsGrid.appendChild(card);
  });

  resultsSummary.textContent = `共 ${items.length} 条`;
}

function buildMeta(item) {
  const parts = [];
  if (item.publish_date) parts.push(`发布: ${item.publish_date}`);
  if (item.source) parts.push(`来源: ${item.source}`);
  if (item.channel_name) parts.push(`频道: ${item.channel_name}`);
  if (item.engagement_rate) parts.push(`互动率: ${item.engagement_rate}`);
  return parts.map((part) => `<span>${escapeHtml(part)}</span>`).join("");
}

function buildStats(item) {
  const stats = [];
  if (item.views) stats.push(`浏览 ${item.views}`);
  if (item.likes) stats.push(`点赞 ${item.likes}`);
  if (item.comments) stats.push(`评论 ${item.comments}`);
  if (item.shares) stats.push(`分享 ${item.shares}`);
  if (item.publish_date) stats.push(`发布 ${item.publish_date}`);
  return stats
    .slice(0, 5)
    .map((stat, index) => {
      const tone = index === 0 ? "stat-pill" : "stat-pill light";
      return `<span class="${tone}">${escapeHtml(stat)}</span>`;
    })
    .join("");
}

function updateStatus(state, text, meta) {
  statusState.textContent = state;
  statusText.textContent = text;
  statusMeta.textContent = meta;
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

function getSelectedSites() {
  return Array.from(document.querySelectorAll(".site-filters input:checked")).map(
    (input) => input.value
  );
}

function readSerperFilters() {
  const glEl = document.getElementById("countryGl");
  const hlEl = document.getElementById("languageHl");
  const tbsEl = document.getElementById("dateRange");
  return {
    gl: glEl ? glEl.value.trim() : "",
    hl: hlEl ? hlEl.value.trim() : "",
    tbs: tbsEl ? tbsEl.value.trim() : "",
  };
}

function buildSiteQueries(keyword, sites, hl) {
  const base = `"${keyword}"`;
  const videoSuffix = getVideoSuffix(hl);
  const queries = [];
  sites.forEach((site) => {
    switch (site) {
      case "youtube":
        queries.push({
          site,
          query: `(site:youtube.com OR site:youtu.be) ${base} ${videoSuffix}`,
        });
        break;
      case "instagram":
        queries.push({ site, query: `site:instagram.com ${base}` });
        break;
      case "x":
        queries.push({
          site,
          query: `(site:x.com OR site:twitter.com) ${base}`,
        });
        break;
      case "threads":
        queries.push({
          site,
          query: `(site:threads.net OR site:threads.com) ${base}`,
        });
        break;
      case "tiktok":
        queries.push({ site, query: `site:tiktok.com ${base} ${videoSuffix}` });
        break;
      case "news":
        queries.push({
          site,
          query: `${base}`,
        });
        break;
      case "pr":
        queries.push({
          site,
          query: `${base} ("press release" OR "press statement" OR "media release" OR announcement OR launch OR partnership OR funding OR newsroom OR "PR Newswire" OR "Business Wire")`,
        });
        break;
      default:
        break;
    }
  });
  return queries.length ? queries : [{ site: "news", query: base }];
}

function getVideoSuffix(hl) {
  const suffixMap = {
    en: '(review OR unboxing OR "hands on" OR "first look")',
    "zh-cn": "(评测 OR 开箱 OR 上手 OR 首发)",
    "zh-tw": "(評測 OR 開箱 OR 上手 OR 首發)",
    ja: "(レビュー OR 開封 OR ハンズオン OR 初見)",
    ko: "(리뷰 OR 언박싱 OR 체험기 OR 첫인상)",
    fr: "(test OR déballage OR \"prise en main\" OR \"premières impressions\")",
    de: "(test OR unboxing OR \"hands on\" OR \"erste eindrücke\")",
    es: "(reseña OR unboxing OR \"hands on\" OR \"primeras impresiones\")",
    pt: "(review OR unboxing OR \"hands on\" OR \"primeiras impressões\")",
    it: "(recensione OR unboxing OR \"hands on\" OR \"prime impressioni\")",
    id: "(review OR unboxing OR \"hands on\" OR \"kesan pertama\")",
    vi: "(đánh giá OR mở hộp OR trải nghiệm OR \"ấn tượng đầu\")",
    th: "(รีวิว OR แกะกล่อง OR ทดลองใช้ OR \"ความประทับใจแรก\")",
    ar: "(مراجعة OR \"فتح العلبة\" OR \"تجربة عملية\" OR \"الانطباعات الأولى\")",
  };
  return suffixMap[hl] || suffixMap.en;
}

function buildAuthHeaders(authHeader) {
  const headers = { "Content-Type": "application/json" };
  const parsed = parseAuthHeader(authHeader);
  if (parsed) {
    headers[parsed.key] = parsed.value;
  }
  return headers;
}

function prioritizeResults(items) {
  return [...items].sort((a, b) => scoreResult(b) - scoreResult(a));
}

function scoreResult(item) {
  let score = 0;
  if (item.publish_date || item.date) score += 3;
  if (item.views) score += 3;
  if (item.likes) score += 2;
  if (item.comments) score += 2;
  if (item.shares) score += 1;
  if (item.cover_image_url || item.profile_picture_url) score += 1;
  return score;
}

function truncateText(text, limit) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}...`;
}

async function testApis() {
  updateStatus("Testing", "正在测试 API...", "");
  await Promise.all([testSerper(), testX(), testYt()]);
  updateStatus("Saved", "API 测试完成", "");
}

async function testSerper() {
  if (!currentSettings.serperApi || !currentSettings.enableGoogle) {
    serperStatus.textContent = "❌ 未配置";
    return;
  }
  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": currentSettings.serperApi,
      },
      body: JSON.stringify({ q: "test", num: 1 }),
    });
    serperStatus.textContent = response.ok ? "✅ 正常" : "❌ 失败";
  } catch (error) {
    serperStatus.textContent = "❌ 失败";
  }
}

async function testX() {
  if (!currentSettings.xEndpoint || !currentSettings.xAuth) {
    xStatus.textContent = "❌ 未配置";
    return;
  }
  const payload = { post_link: "https://www.threads.com/@tomiokataoka/post/DRnnuIbE1YT" };
  if (currentSettings.actorId) {
    payload.actor_id = currentSettings.actorId;
  }
  try {
    const response = await fetch(currentSettings.xEndpoint, {
      method: "POST",
      headers: buildAuthHeaders(currentSettings.xAuth),
      body: JSON.stringify(payload),
    });
    xStatus.textContent = response.ok ? "✅ 正常" : "❌ 失败";
  } catch (error) {
    xStatus.textContent = "❌ 失败";
  }
}

async function testYt() {
  if (!currentSettings.ytEndpoint || !currentSettings.ytAuth) {
    ytStatus.textContent = "❌ 未配置";
    return;
  }
  const payload = { post_link: "https://www.instagram.com/reels/DS1fbXvkQXf/" };
  if (currentSettings.actorId) {
    payload.actor_id = currentSettings.actorId;
  }
  try {
    const response = await fetch(currentSettings.ytEndpoint, {
      method: "POST",
      headers: buildAuthHeaders(currentSettings.ytAuth),
      body: JSON.stringify(payload),
    });
    ytStatus.textContent = response.ok ? "✅ 正常" : "❌ 失败";
  } catch (error) {
    ytStatus.textContent = "❌ 失败";
  }
}

function isSocialLink(link) {
  return /(x\.com|twitter\.com|threads\.net|threads\.com|youtube\.com|youtu\.be|instagram\.com|tiktok\.com)/i.test(
    link
  );
}

function detectPlatform(link) {
  if (/threads\.net|threads\.com/i.test(link)) return "threads";
  if (/x\.com|twitter\.com/i.test(link)) return "x";
  if (/youtube\.com|youtu\.be/i.test(link)) return "youtube";
  if (/instagram\.com/i.test(link)) return "instagram";
  if (/tiktok\.com/i.test(link)) return "tiktok";
  return "web";
}

function buildCsv(items, columns) {
  const header = columns.join(",");
  const rows = items.map((item) =>
    columns
      .map((key) => {
        const value = item[key] ?? "";
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [header, ...rows].join("\n");
}

function hydrateSettingsForm() {
  document.getElementById("actorId").value = currentSettings.actorId;
  document.getElementById("serperApi").value = currentSettings.serperApi;
  document.getElementById("geminiApi").value = currentSettings.geminiApi;
  document.getElementById("xEndpoint").value = currentSettings.xEndpoint;
  document.getElementById("xAuth").value = currentSettings.xAuth;
  document.getElementById("ytEndpoint").value = currentSettings.ytEndpoint;
  document.getElementById("ytAuth").value = currentSettings.ytAuth;
  document.getElementById("enableGoogle").checked = currentSettings.enableGoogle;
  document.getElementById("enableSocial").checked = currentSettings.enableSocial;
}

function hydrateFilters() {
  const countryGl = document.getElementById("countryGl");
  const languageHl = document.getElementById("languageHl");
  const dateRange = document.getElementById("dateRange");
  const limitEl = document.getElementById("limit");
  if (!countryGl || !languageHl || !dateRange) {
    return;
  }
  if (currentFilters.gl) countryGl.value = currentFilters.gl;
  if (currentFilters.hl) languageHl.value = currentFilters.hl;
  if (currentFilters.tbs) dateRange.value = currentFilters.tbs;
  if (limitEl && currentFilters.limit) limitEl.value = currentFilters.limit;

  const siteInputs = document.querySelectorAll(".site-filters input");
  siteInputs.forEach((input) => {
    input.checked = currentFilters.sites.includes(input.value);
  });
}

function attachFilterListeners() {
  const siteInputs = document.querySelectorAll(".site-filters input");
  if (!siteInputs.length) {
    return;
  }
  siteInputs.forEach((input) => {
    input.addEventListener("change", () => {
      currentFilters = readFiltersFromUI();
      persistFilters(currentFilters);
    });
  });

  ["countryGl", "languageHl", "dateRange"].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("change", () => {
      currentFilters = readFiltersFromUI();
      persistFilters(currentFilters);
    });
  });

  const limitEl = document.getElementById("limit");
  if (limitEl) {
    limitEl.addEventListener("change", () => {
      currentFilters = readFiltersFromUI();
      persistFilters(currentFilters);
    });
  }
}

function readFiltersFromUI() {
  const limitEl = document.getElementById("limit");
  const limit = limitEl ? Number(limitEl.value || defaultFilters.limit) : defaultFilters.limit;
  return {
    sites: getSelectedSites(),
    ...readSerperFilters(),
    limit: Math.max(5, Math.min(50, Number.isFinite(limit) ? limit : defaultFilters.limit)),
  };
}

function readSettingsForm() {
  return {
    actorId: document.getElementById("actorId").value.trim(),
    serperApi: document.getElementById("serperApi").value.trim(),
    geminiApi: document.getElementById("geminiApi").value.trim(),
    xEndpoint: document.getElementById("xEndpoint").value.trim(),
    xAuth: document.getElementById("xAuth").value.trim(),
    ytEndpoint: document.getElementById("ytEndpoint").value.trim(),
    ytAuth: document.getElementById("ytAuth").value.trim(),
    enableGoogle: document.getElementById("enableGoogle").checked,
    enableSocial: document.getElementById("enableSocial").checked,
  };
}

function persistSettings(settings) {
  localStorage.setItem("brand-tracker-settings", JSON.stringify(settings));
}

function loadSettings() {
  try {
    const stored = localStorage.getItem("brand-tracker-settings");
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : { ...defaultSettings };
  } catch (error) {
    return { ...defaultSettings };
  }
}

function persistFilters(filters) {
  localStorage.setItem("brand-tracker-filters", JSON.stringify(filters));
}

function loadFilters() {
  try {
    const stored = localStorage.getItem("brand-tracker-filters");
    if (!stored) return { ...defaultFilters };
    const parsed = JSON.parse(stored);
    return {
      ...defaultFilters,
      ...parsed,
      sites: Array.isArray(parsed.sites) && parsed.sites.length ? parsed.sites : defaultFilters.sites,
    };
  } catch (error) {
    return { ...defaultFilters };
  }
}

function demoWeb(keyword, limit) {
  const sample = [
    {
      type: "web",
      link: "https://example.com/brand-story",
      title: `${keyword} 品牌故事与新品介绍`,
      description: "品牌发布会摘要，包含新品配置与市场反馈。",
      publish_date: new Date().toISOString().slice(0, 10),
    },
    {
      type: "web",
      link: "https://example.com/launch-news",
      title: `${keyword} Launch 亮点整理`,
      description: "从媒体视角总结发布亮点与社区评价。",
      publish_date: new Date().toISOString().slice(0, 10),
    },
  ];
  return sample.slice(0, limit);
}

function demoResults(keyword) {
  return [
    {
      type: "x",
      link: "https://x.com/example/status/123",
      cover_image_url: "",
      title: `${keyword} community reactions`,
      description: "Fans discuss performance, pricing, and launch expectations.",
      publish_date: "2025-01-05",
      views: "120k",
      likes: "8.2k",
      comments: "1.1k",
      shares: "540",
      engagement_rate: "9.4%",
      channel_name: "Tech Pulse",
      channel_link: "https://x.com/example",
    },
    {
      type: "youtube",
      link: "https://www.youtube.com/watch?v=example",
      cover_image_url: "",
      title: `${keyword} hands-on review`,
      description: "First impressions, benchmarks, and camera samples.",
      publish_date: "2025-01-06",
      views: "98k",
      likes: "4.1k",
      comments: "620",
      shares: "230",
      channel_name: "Gadget Lab",
      channel_link: "https://www.youtube.com/@gadgetlab",
    },
  ];
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getHostLabel(link) {
  if (!link) return "";
  try {
    const host = new URL(link).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    return parts.slice(-2).join(".");
  } catch (error) {
    return "";
  }
}

function formatTypeLabel(type) {
  const key = String(type || "").toLowerCase();
  const map = {
    youtube: "YouTube",
    instagram: "Instagram",
    x: "X",
    twitter: "Twitter",
    threads: "Threads",
    tiktok: "TikTok",
    news: "News",
    pr: "PR",
    web: "Web",
  };
  return map[key] || type;
}

function slugifyType(type) {
  return String(type || "web")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "web";
}
