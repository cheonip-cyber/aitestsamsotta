/**
 * Google Apps Script 웹앱과 통신하는 API 레이어
 * GAS_URL: 환경변수 VITE_GAS_URL 에 배포된 GAS 웹앱 URL을 입력
 */

const GAS_URL = import.meta.env.VITE_GAS_URL as string;

// ── 관리자 토큰 (sessionStorage) ──────────────────────────────
const TOKEN_KEY = "ai_diag_admin_token";
export const getAdminToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setAdminToken = (t: string) => sessionStorage.setItem(TOKEN_KEY, t);
export const clearAdminToken = () => sessionStorage.removeItem(TOKEN_KEY);

// ── 공통 fetch ────────────────────────────────────────────────
async function gasCall<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  if (!GAS_URL) throw new Error("VITE_GAS_URL 환경변수가 설정되지 않았습니다.");
  const token = getAdminToken();
  const body: Record<string, unknown> = { ...payload };
  if (token) body._token = token;

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" }, // GAS CORS 우회
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
  const data = await res.json() as { ok: boolean; error?: string } & T;
  if (!data.ok) throw new Error(data.error || "요청 실패");
  return data;
}

// ── 공개 API (응답자용) ───────────────────────────────────────
export interface Campaign {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  response_count: number;
}

export async function getCampaignBySlug(slug: string): Promise<Campaign | null> {
  try {
    const data = await gasCall<{ campaign: Campaign | null }>({ action: "get_campaign", slug });
    return data.campaign;
  } catch {
    return null;
  }
}

export interface ResponsePayload {
  campaign_id: string;
  respondent_name: string;
  group_name: string;
  ai_tools: string[];
  ai_tools_other: string;
  tech_terms: string[];
  app_dev_experience: string;
  dev_tools: string[];
  github_skill: string;
  deploy_platforms: string[];
  deploy_other: string;
  self_level: number;
  learning_goal: string;
  computed_level: number;
}

export async function submitResponse(payload: ResponsePayload): Promise<void> {
  await gasCall({ action: "submit_response", ...payload });
}

// ── 관리자 API ────────────────────────────────────────────────
export async function adminLogin(password: string): Promise<string> {
  const data = await gasCall<{ token: string }>({ action: "login", password });
  return data.token;
}

export async function listCampaigns(): Promise<Campaign[]> {
  const data = await gasCall<{ campaigns: Campaign[] }>({ action: "list_campaigns" });
  return data.campaigns || [];
}

export interface ResponseRow {
  id: string;
  campaign_id: string;
  respondent_name: string;
  group_name: string;
  ai_tools: string[];
  ai_tools_other: string | null;
  tech_terms: string[];
  app_dev_experience: string;
  dev_tools: string[];
  github_skill: string;
  deploy_platforms: string[];
  deploy_other: string | null;
  self_level: number;
  learning_goal: string | null;
  computed_level: number | null;
  created_at: string;
}

export async function listResponses(): Promise<ResponseRow[]> {
  const data = await gasCall<{ responses: ResponseRow[] }>({ action: "list_responses" });
  return data.responses || [];
}

export async function createCampaign(name: string, slug: string, description: string): Promise<Campaign> {
  const data = await gasCall<{ campaign: Campaign }>({ action: "create_campaign", name, slug, description });
  return data.campaign;
}

export async function toggleCampaign(id: string, is_active: boolean): Promise<void> {
  await gasCall({ action: "toggle_campaign", id, is_active });
}

export async function deleteCampaign(id: string): Promise<void> {
  await gasCall({ action: "delete_campaign", id });
}
