import * as XLSX from "xlsx";
import type { ResponseRow, Campaign } from "./api";
import {
  AI_TOOLS, TECH_TERMS, APP_DEV_EXPERIENCE,
  DEV_TOOLS, GITHUB_SKILL, DEPLOY_PLATFORMS, SELF_LEVELS, labelOf,
} from "./survey";

export function exportExcel(responses: ResponseRow[], campaigns: Campaign[]) {
  const wb = XLSX.utils.book_new();
  const cMap = Object.fromEntries(campaigns.map((c) => [c.id, c.name]));

  // ── 시트1: 요약 ───────────────────────────────────────────────
  const total = responses.length;
  const avgComputed = total
    ? (responses.reduce((s, r) => s + (r.computed_level || 0), 0) / total).toFixed(2)
    : "—";
  const avgSelf = total
    ? (responses.reduce((s, r) => s + r.self_level, 0) / total).toFixed(2)
    : "—";

  const levelDist = [1, 2, 3, 4].map((lv) => ({
    레벨: `Lv ${lv}`,
    산출레벨: responses.filter((r) => r.computed_level === lv).length,
    자기진단: responses.filter((r) => r.self_level === lv).length,
  }));

  const aiToolStats = AI_TOOLS.map((t) => ({
    도구명: t.label,
    사용자수: responses.filter((r) => r.ai_tools.includes(t.value)).length,
    비율: total ? `${((responses.filter((r) => r.ai_tools.includes(t.value)).length / total) * 100).toFixed(1)}%` : "0%",
  }));

  const githubPushed = responses.filter((r) => r.github_skill === "pushed").length;
  const deployYes = responses.filter(
    (r) => r.deploy_platforms.some((p) => p !== "none") || (r.deploy_other && r.deploy_other.length > 0)
  ).length;

  const summaryData = [
    ["■ 전체 요약"],
    ["총 응답 수", total],
    ["평균 산출 레벨", avgComputed],
    ["평균 자기진단 레벨", avgSelf],
    ["GitHub Push 경험자", `${githubPushed} / ${total}`],
    ["배포 경험자", `${deployYes} / ${total}`],
    [],
    ["■ 레벨 분포"],
    ["레벨", "산출 레벨 인원", "자기진단 인원"],
    ...levelDist.map((d) => [d.레벨, d.산출레벨, d.자기진단]),
    [],
    ["■ AI 도구 사용률"],
    ["도구명", "사용자 수", "비율"],
    ...aiToolStats.map((d) => [d.도구명, d.사용자수, d.비율]),
    [],
    ["■ 그룹별 요약"],
    ["그룹명", "응답 수", "평균 산출 레벨", "Lv1", "Lv2", "Lv3", "Lv4"],
    ...Array.from(new Set(responses.map((r) => r.group_name))).sort().map((g) => {
      const rs = responses.filter((r) => r.group_name === g);
      return [
        g,
        rs.length,
        +(rs.reduce((s, r) => s + (r.computed_level || 0), 0) / rs.length).toFixed(2),
        rs.filter((r) => r.computed_level === 1).length,
        rs.filter((r) => r.computed_level === 2).length,
        rs.filter((r) => r.computed_level === 3).length,
        rs.filter((r) => r.computed_level === 4).length,
      ];
    }),
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws1, "요약");

  // ── 시트2: 응답 원본 ─────────────────────────────────────────
  const headers = [
    "제출일시", "캠페인", "이름", "그룹",
    "AI도구", "AI도구기타",
    "기술용어", "앱개발경험",
    "개발도구", "GitHub역량",
    "배포플랫폼", "배포기타",
    "자기진단레벨", "산출레벨", "학습목표",
  ];

  const rows = responses.map((r) => [
    new Date(r.created_at).toLocaleString("ko-KR"),
    cMap[r.campaign_id] || "",
    r.respondent_name,
    r.group_name,
    r.ai_tools.map((v) => labelOf(AI_TOOLS, v)).join(" | "),
    r.ai_tools_other || "",
    r.tech_terms.map((v) => labelOf(TECH_TERMS, v)).join(" | "),
    labelOf(APP_DEV_EXPERIENCE, r.app_dev_experience),
    r.dev_tools.map((v) => labelOf(DEV_TOOLS, v)).join(" | "),
    labelOf(GITHUB_SKILL, r.github_skill),
    r.deploy_platforms.map((v) => labelOf(DEPLOY_PLATFORMS, v)).join(" | "),
    r.deploy_other || "",
    `Lv ${r.self_level} — ${SELF_LEVELS.find((s) => s.value === r.self_level)?.label || ""}`,
    r.computed_level ? `Lv ${r.computed_level}` : "",
    r.learning_goal || "",
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws2["!cols"] = headers.map((h) =>
    ["제출일시", "AI도구", "기술용어", "개발도구", "배포플랫폼", "학습목표"].includes(h)
      ? { wch: 36 }
      : { wch: 20 }
  );
  XLSX.utils.book_append_sheet(wb, ws2, "응답 원본");

  // ── 다운로드 ─────────────────────────────────────────────────
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ai-diagnosis-${date}.xlsx`);
}
