export type AppDevExperience = "many" | "few" | "none";
export type GithubSkill = "pushed" | "know" | "unknown";

export const AI_TOOLS = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "claude", label: "Claude" },
  { value: "gemini", label: "Gemini" },
  { value: "perplexity", label: "Perplexity" },
  { value: "image_ai", label: "이미지 생성 AI (Midjourney 등)" },
];

export const TECH_TERMS = [
  { value: "hallucination", label: "할루시네이션 (환각 현상)" },
  { value: "llm", label: "LLM (거대언어모델)" },
  { value: "webapp", label: "웹앱 (Web App)" },
  { value: "token", label: "토큰 (Token) 소모량" },
  { value: "json_md", label: "JSON / Markdown 출력 형식" },
  { value: "api_key", label: "API 키 발급 및 관리" },
  { value: "commit_deploy", label: "커밋(Commit) / 배포(Deploy)" },
];

export const APP_DEV_EXPERIENCE: { value: AppDevExperience; label: string }[] = [
  { value: "many", label: "다수의 개발 경험이 있다 (3회 이상)" },
  { value: "few", label: "1~2회 개발해 본 적이 있다" },
  { value: "none", label: "아직 없다" },
];

export const DEV_TOOLS = [
  { value: "llm_chat", label: "LLM (단순 AI 채팅창)" },
  { value: "claude_code", label: "클로드 코드 (Claude Code)" },
  { value: "codex", label: "코덱스 (CodeX)" },
  { value: "cursor", label: "커서 (Cursor)" },
  { value: "antigravity", label: "안티그래비티 (Antigravity)" },
  { value: "lovable", label: "러버블 (Lovable)" },
  { value: "ai_studio", label: "AI Studio (Google 등)" },
];

export const GITHUB_SKILL: { value: GithubSkill; label: string }[] = [
  { value: "pushed", label: "사용 중이며 코드를 직접 올려본 적(Push)이 있다" },
  { value: "know", label: "알지만 사용해 본 적은 없다" },
  { value: "unknown", label: "무엇인지 모른다" },
];

export const DEPLOY_PLATFORMS = [
  { value: "gas", label: "구글 앱스 스크립트 (GAS)" },
  { value: "netlify", label: "네틀리파이 (Netlify)" },
  { value: "vercel", label: "버셀 (Vercel)" },
  { value: "none", label: "배포 경험 없음" },
];

export const SELF_LEVELS = [
  { value: 1, label: "레벨 1 — 단순 채팅", desc: "질문/요약 위주로 사용" },
  { value: 2, label: "레벨 2 — 앱 개발 입문", desc: "간단한 웹페이지/단일 기능 앱 제작" },
  { value: 3, label: "레벨 3 — 심화 데이터 활용", desc: "외부 API·DB 연동 등 복잡한 로직" },
  { value: 4, label: "레벨 4 — 마스터급", desc: "기획부터 배포까지 대부분 가능" },
];

export interface ComputeInput {
  ai_tools: string[];
  ai_tools_other?: string;
  tech_terms: string[];
  app_dev_experience: AppDevExperience;
  dev_tools: string[];
  github_skill: GithubSkill;
  deploy_platforms: string[];
  deploy_other?: string;
  self_level: number;
}

export function computeLevel(r: ComputeInput): number {
  let score = 0;
  score += Math.min(r.ai_tools.length, 5) * 0.6;
  score += r.tech_terms.length * 0.8;
  score += r.app_dev_experience === "many" ? 5 : r.app_dev_experience === "few" ? 2.5 : 0;
  score += Math.min(r.dev_tools.length, 7) * 0.7;
  score += r.github_skill === "pushed" ? 3 : r.github_skill === "know" ? 1 : 0;
  const realDeploy = r.deploy_platforms.filter((p) => p !== "none").length;
  score += realDeploy * 1.5 + (r.deploy_other ? 1.5 : 0);
  score += r.self_level * 1.2;
  if (score >= 22) return 4;
  if (score >= 13) return 3;
  if (score >= 6) return 2;
  return 1;
}

export function labelOf<T extends { value: string; label: string }>(arr: T[], v: string): string {
  return arr.find((o) => o.value === v)?.label || v;
}
