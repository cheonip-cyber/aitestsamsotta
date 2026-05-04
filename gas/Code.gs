/**
 * AI 활용 진단앱 — Google Apps Script 백엔드
 * =============================================
 * 설치 방법:
 *  1. Google Sheets 새 시트 생성 → 확장 프로그램 → Apps Script
 *  2. 이 코드 전체 붙여넣기
 *  3. 프로젝트 속성 → 스크립트 속성에 ADMIN_PASSWORD 추가
 *  4. 배포 → 새 배포 → 웹 앱 → 액세스: 모든 사용자
 *  5. 배포 URL을 Vercel 환경변수 VITE_GAS_URL에 입력
 *
 * 시트 구조 (자동 생성):
 *  - campaigns : id | slug | name | description | is_active | created_at
 *  - responses : id | campaign_id | respondent_name | group_name | ai_tools |
 *                ai_tools_other | tech_terms | app_dev_experience | dev_tools |
 *                github_skill | deploy_platforms | deploy_other | self_level |
 *                learning_goal | computed_level | created_at
 */

// ── 설정 ─────────────────────────────────────────────────────
const ADMIN_PASSWORD = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD") || "samsotta2026";
const SHEET_CAMPAIGNS = "campaigns";
const SHEET_RESPONSES = "responses";

const CAMPAIGN_COLS = ["id", "slug", "name", "description", "is_active", "created_at"];
const RESPONSE_COLS = [
  "id", "campaign_id", "respondent_name", "group_name",
  "ai_tools", "ai_tools_other", "tech_terms", "app_dev_experience",
  "dev_tools", "github_skill", "deploy_platforms", "deploy_other",
  "self_level", "learning_goal", "computed_level", "created_at"
];

// ── CORS / 진입점 ─────────────────────────────────────────────
function doOptions() {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const result = route(body);
    return respond(result);
  } catch (err) {
    return respond({ ok: false, error: err.message });
  }
}

function doGet(e) {
  // GET 요청으로 헬스체크 지원
  return respond({ ok: true, message: "AI 진단 API 정상 작동 중" });
}

function respond(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ── 라우터 ────────────────────────────────────────────────────
function route(body) {
  const action = body.action;

  // 인증 불필요
  if (action === "login") return actionLogin(body);
  if (action === "get_campaign") return actionGetCampaign(body);
  if (action === "submit_response") return actionSubmitResponse(body);

  // 인증 필요
  if (body._token !== ADMIN_PASSWORD) return { ok: false, error: "인증이 필요합니다" };

  if (action === "list_campaigns") return actionListCampaigns();
  if (action === "list_responses") return actionListResponses(body);
  if (action === "create_campaign") return actionCreateCampaign(body);
  if (action === "toggle_campaign") return actionToggleCampaign(body);
  if (action === "delete_campaign") return actionDeleteCampaign(body);

  return { ok: false, error: "알 수 없는 action: " + action };
}

// ── 액션들 ────────────────────────────────────────────────────

function actionLogin(body) {
  if (!body.password || body.password !== ADMIN_PASSWORD) {
    return { ok: false, error: "비밀번호가 올바르지 않습니다" };
  }
  return { ok: true, token: ADMIN_PASSWORD };
}

function actionGetCampaign(body) {
  const slug = String(body.slug || "").trim();
  if (!slug) return { ok: true, campaign: null };

  const sheet = getOrCreateSheet(SHEET_CAMPAIGNS, CAMPAIGN_COLS);
  const rows = sheetToObjects(sheet, CAMPAIGN_COLS);
  const campaign = rows.find(r => r.slug === slug && r.is_active === true || r.is_active === "TRUE");
  if (!campaign) return { ok: true, campaign: null };

  // response_count 계산
  const respSheet = getOrCreateSheet(SHEET_RESPONSES, RESPONSE_COLS);
  const responses = sheetToObjects(respSheet, RESPONSE_COLS);
  const count = responses.filter(r => r.campaign_id === campaign.id).length;

  return { ok: true, campaign: { ...normalizeCampaign(campaign), response_count: count } };
}

function actionSubmitResponse(body) {
  ensureSheets();
  const sheet = getOrCreateSheet(SHEET_RESPONSES, RESPONSE_COLS);

  // 캠페인 존재 확인
  const cSheet = getOrCreateSheet(SHEET_CAMPAIGNS, CAMPAIGN_COLS);
  const campaigns = sheetToObjects(cSheet, CAMPAIGN_COLS);
  const campaign = campaigns.find(c => c.id === body.campaign_id);
  if (!campaign) return { ok: false, error: "캠페인을 찾을 수 없습니다" };

  const id = generateId();
  const now = new Date().toISOString();

  const row = [
    id,
    String(body.campaign_id || ""),
    String(body.respondent_name || ""),
    String(body.group_name || ""),
    JSON.stringify(body.ai_tools || []),
    String(body.ai_tools_other || ""),
    JSON.stringify(body.tech_terms || []),
    String(body.app_dev_experience || ""),
    JSON.stringify(body.dev_tools || []),
    String(body.github_skill || ""),
    JSON.stringify(body.deploy_platforms || []),
    String(body.deploy_other || ""),
    Number(body.self_level || 1),
    String(body.learning_goal || ""),
    Number(body.computed_level || 1),
    now,
  ];

  sheet.appendRow(row);
  return { ok: true, id };
}

function actionListCampaigns() {
  ensureSheets();
  const cSheet = getOrCreateSheet(SHEET_CAMPAIGNS, CAMPAIGN_COLS);
  const rSheet = getOrCreateSheet(SHEET_RESPONSES, RESPONSE_COLS);

  const campaigns = sheetToObjects(cSheet, CAMPAIGN_COLS);
  const responses = sheetToObjects(rSheet, RESPONSE_COLS);

  // response_count 포함
  const result = campaigns
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(c => ({
      ...normalizeCampaign(c),
      response_count: responses.filter(r => r.campaign_id === c.id).length,
    }));

  return { ok: true, campaigns: result };
}

function actionListResponses(body) {
  ensureSheets();
  const sheet = getOrCreateSheet(SHEET_RESPONSES, RESPONSE_COLS);
  let responses = sheetToObjects(sheet, RESPONSE_COLS)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(normalizeResponse);

  if (body.campaign_id) {
    responses = responses.filter(r => r.campaign_id === body.campaign_id);
  }

  return { ok: true, responses };
}

function actionCreateCampaign(body) {
  ensureSheets();
  const name = String(body.name || "").trim();
  if (!name) return { ok: false, error: "이름을 입력하세요" };

  let slug = String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!slug) slug = "c-" + Math.random().toString(36).slice(2, 8);
  const description = String(body.description || "").trim();

  // 슬러그 중복 확인
  const sheet = getOrCreateSheet(SHEET_CAMPAIGNS, CAMPAIGN_COLS);
  const existing = sheetToObjects(sheet, CAMPAIGN_COLS);
  if (existing.find(c => c.slug === slug)) {
    return { ok: false, error: "이미 사용 중인 슬러그입니다: " + slug };
  }

  const id = generateId();
  const now = new Date().toISOString();
  sheet.appendRow([id, slug, name, description, true, now]);

  const campaign = { id, slug, name, description: description || null, is_active: true, created_at: now, response_count: 0 };
  return { ok: true, campaign };
}

function actionToggleCampaign(body) {
  const sheet = getOrCreateSheet(SHEET_CAMPAIGNS, CAMPAIGN_COLS);
  const idIdx = CAMPAIGN_COLS.indexOf("id") + 1;
  const activeIdx = CAMPAIGN_COLS.indexOf("is_active") + 1;
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx - 1] === body.id) {
      sheet.getRange(i + 1, activeIdx).setValue(body.is_active);
      return { ok: true };
    }
  }
  return { ok: false, error: "캠페인을 찾을 수 없습니다" };
}

function actionDeleteCampaign(body) {
  // 캠페인 삭제
  const cSheet = getOrCreateSheet(SHEET_CAMPAIGNS, CAMPAIGN_COLS);
  deleteRowById(cSheet, body.id, CAMPAIGN_COLS);

  // 연관 응답도 삭제
  const rSheet = getOrCreateSheet(SHEET_RESPONSES, RESPONSE_COLS);
  const cidIdx = RESPONSE_COLS.indexOf("campaign_id");
  const data = rSheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][cidIdx] === body.id) {
      rSheet.deleteRow(i + 1);
    }
  }

  return { ok: true };
}

// ── 유틸 ─────────────────────────────────────────────────────

function ensureSheets() {
  getOrCreateSheet(SHEET_CAMPAIGNS, CAMPAIGN_COLS);
  getOrCreateSheet(SHEET_RESPONSES, RESPONSE_COLS);
}

function getOrCreateSheet(name, cols) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(cols);
    sheet.setFrozenRows(1);
    // 헤더 스타일
    sheet.getRange(1, 1, 1, cols.length)
      .setBackground("#1A2744")
      .setFontColor("white")
      .setFontWeight("bold");
  }
  return sheet;
}

function sheetToObjects(sheet, cols) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function normalizeCampaign(c) {
  return {
    id: String(c.id || ""),
    slug: String(c.slug || ""),
    name: String(c.name || ""),
    description: c.description ? String(c.description) : null,
    is_active: c.is_active === true || c.is_active === "TRUE" || c.is_active === "true",
    created_at: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
  };
}

function normalizeResponse(r) {
  function parseArr(v) {
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v || "[]"); } catch { return []; }
  }
  return {
    id: String(r.id || ""),
    campaign_id: String(r.campaign_id || ""),
    respondent_name: String(r.respondent_name || ""),
    group_name: String(r.group_name || ""),
    ai_tools: parseArr(r.ai_tools),
    ai_tools_other: r.ai_tools_other ? String(r.ai_tools_other) : null,
    tech_terms: parseArr(r.tech_terms),
    app_dev_experience: String(r.app_dev_experience || ""),
    dev_tools: parseArr(r.dev_tools),
    github_skill: String(r.github_skill || ""),
    deploy_platforms: parseArr(r.deploy_platforms),
    deploy_other: r.deploy_other ? String(r.deploy_other) : null,
    self_level: Number(r.self_level || 1),
    learning_goal: r.learning_goal ? String(r.learning_goal) : null,
    computed_level: r.computed_level ? Number(r.computed_level) : null,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
  };
}

function deleteRowById(sheet, id, cols) {
  const idIdx = cols.indexOf("id");
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][idIdx] === id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

function generateId() {
  return Utilities.getUuid();
}
