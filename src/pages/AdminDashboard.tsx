import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  listCampaigns, listResponses, createCampaign, toggleCampaign, deleteCampaign,
  clearAdminToken, getAdminToken,
  type Campaign, type ResponseRow,
} from "@/lib/api";
import { exportExcel } from "@/lib/excel";
import { toast } from "sonner";
import { Copy, Download, ExternalLink, LogOut, Plus, Trash2, BarChart3, Users, Sparkles, FileSpreadsheet } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { AI_TOOLS, TECH_TERMS, DEV_TOOLS, DEPLOY_PLATFORMS, APP_DEV_EXPERIENCE, GITHUB_SKILL, SELF_LEVELS, labelOf } from "@/lib/survey";

const LEVEL_COLORS = ["hsl(199 89% 48%)", "hsl(243 75% 58%)", "hsl(263 75% 65%)", "hsl(142 70% 45%)"];
const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: 12,
};

export default function AdminDashboard() {
  const nav = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    document.title = "관리자 대시보드 | AI 진단";
    if (!getAdminToken()) { nav("/admin/login"); return; }
    void load();
  }, [nav]);

  async function load() {
    setLoading(true);
    try {
      const [c, r] = await Promise.all([listCampaigns(), listResponses()]);
      setCampaigns(c);
      setResponses(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "불러오기 실패");
      if (e instanceof Error && e.message.includes("인증")) {
        clearAdminToken(); nav("/admin/login");
      }
    } finally { setLoading(false); }
  }

  function logout() { clearAdminToken(); nav("/admin/login"); }

  const filteredResponses = useMemo(() => {
    if (selectedCampaign === "all") return responses;
    return responses.filter((r) => r.campaign_id === selectedCampaign);
  }, [responses, selectedCampaign]);

  function handleExcelExport() {
    if (filteredResponses.length === 0) {
      toast.error("내보낼 응답이 없습니다.");
      return;
    }
    exportExcel(filteredResponses, campaigns);
    toast.success("Excel 파일이 다운로드됩니다.");
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">AI 활용 진단</h1>
              <p className="text-xs text-muted-foreground">관리자 대시보드</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />로그아웃
          </Button>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 캠페인 */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">캠페인 (설문 링크)</h2>
                  <p className="text-sm text-muted-foreground">교육 차수별로 캠페인을 만들고 링크를 공유하세요.</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />새 캠페인</Button>
                  </DialogTrigger>
                  <CreateCampaignDialog onCreated={() => { setCreateOpen(false); void load(); }} />
                </Dialog>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.length === 0 && (
                  <Card className="md:col-span-2 lg:col-span-3 p-8 text-center text-muted-foreground border-dashed">
                    아직 캠페인이 없습니다. 새 캠페인을 만들어 링크를 생성하세요.
                  </Card>
                )}
                {campaigns.map((c) => (
                  <CampaignCard key={c.id} campaign={c} onChange={load} />
                ))}
              </div>
            </section>

            {/* 필터 + 내보내기 */}
            <section className="flex flex-wrap items-center gap-3">
              <Label className="text-sm font-medium">대시보드 범위:</Label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 캠페인</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.response_count})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">응답 {filteredResponses.length}건</span>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExcelExport} className="gap-2">
                  <FileSpreadsheet className="w-4 h-4" />Excel 내보내기
                </Button>
              </div>
            </section>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-2" />개요</TabsTrigger>
                <TabsTrigger value="groups"><Users className="w-4 h-4 mr-2" />그룹별</TabsTrigger>
                <TabsTrigger value="responses">응답자 목록</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <Overview responses={filteredResponses} />
              </TabsContent>

              <TabsContent value="groups" className="mt-6">
                <GroupBreakdown responses={filteredResponses} />
              </TabsContent>

              <TabsContent value="responses" className="mt-6">
                <ResponseList responses={filteredResponses} campaigns={campaigns} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

// ── 캠페인 카드 ───────────────────────────────────────────────
function CampaignCard({ campaign, onChange }: { campaign: Campaign; onChange: () => void }) {
  const link = `${window.location.origin}/s/${campaign.slug}`;
  async function copy() { await navigator.clipboard.writeText(link); toast.success("링크가 복사되었습니다"); }
  async function toggle(v: boolean) {
    try { await toggleCampaign(campaign.id, v); onChange(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "실패"); }
  }
  async function del() {
    if (!confirm(`'${campaign.name}' 캠페인과 모든 응답을 삭제하시겠습니까?`)) return;
    try { await deleteCampaign(campaign.id); toast.success("삭제됨"); onChange(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "실패"); }
  }
  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{campaign.name}</CardTitle>
            <CardDescription className="text-xs mt-1 truncate">/s/{campaign.slug}</CardDescription>
          </div>
          <Badge variant={campaign.is_active ? "default" : "secondary"}>
            {campaign.is_active ? "활성" : "비활성"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">{campaign.response_count}</span>
          <span className="text-sm text-muted-foreground">응답</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copy} className="flex-1"><Copy className="w-3.5 h-3.5 mr-1.5" />링크 복사</Button>
          <Button size="sm" variant="outline" asChild>
            <a href={link} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
          </Button>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Switch checked={campaign.is_active} onCheckedChange={toggle} />
            <span className="text-xs text-muted-foreground">활성화</span>
          </div>
          <Button size="sm" variant="ghost" onClick={del} className="text-destructive hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── 캠페인 생성 다이얼로그 ───────────────────────────────────
function CreateCampaignDialog({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createCampaign(name, slug, description);
      toast.success("캠페인이 생성되었습니다");
      onCreated();
    } catch (e) { toast.error(e instanceof Error ? e.message : "실패"); }
    finally { setBusy(false); }
  }
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>새 캠페인 만들기</DialogTitle>
        <DialogDescription>각 교육 차수마다 별도의 캠페인을 만들어 응답을 분리할 수 있습니다.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>캠페인 이름 *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 2026년 1차 AI 교육 사전 진단" required maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label>링크 슬러그 (선택)</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="비워두면 자동 생성 (영문/숫자/-)" maxLength={50} />
          <p className="text-xs text-muted-foreground">예: <code>2026-q1</code> → /s/2026-q1</p>
        </div>
        <div className="space-y-2">
          <Label>설명 (선택)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={300} placeholder="응답자에게 보여질 안내" />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={busy} className="bg-gradient-primary text-primary-foreground">{busy ? "생성 중..." : "생성"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// ── 개요 ─────────────────────────────────────────────────────
function Overview({ responses }: { responses: ResponseRow[] }) {
  if (responses.length === 0) return <EmptyState />;

  const levelDist = [1, 2, 3, 4].map((lv) => ({
    name: `Lv ${lv}`,
    산출: responses.filter((r) => r.computed_level === lv).length,
    자기진단: responses.filter((r) => r.self_level === lv).length,
  }));

  const aiToolStats = AI_TOOLS.map((t) => ({
    name: t.label.replace(/ \(.*\)/, ""),
    value: responses.filter((r) => r.ai_tools.includes(t.value)).length,
  })).sort((a, b) => b.value - a.value);

  const termStats = TECH_TERMS.map((t) => ({
    name: t.label.replace(/ \(.*\)/, ""),
    value: responses.filter((r) => r.tech_terms.includes(t.value)).length,
  })).sort((a, b) => b.value - a.value);

  const toolStats = DEV_TOOLS.map((t) => ({
    name: t.label.replace(/ \(.*\)/, ""),
    value: responses.filter((r) => r.dev_tools.includes(t.value)).length,
  })).sort((a, b) => b.value - a.value);

  const deployYes = responses.filter((r) =>
    r.deploy_platforms.some((p) => p !== "none") || (r.deploy_other && r.deploy_other.length > 0)
  ).length;
  const githubPushed = responses.filter((r) => r.github_skill === "pushed").length;
  const avgComputed = (responses.reduce((s, r) => s + (r.computed_level || 0), 0) / responses.length).toFixed(2);
  const avgSelf = (responses.reduce((s, r) => s + r.self_level, 0) / responses.length).toFixed(2);
  const goals = responses.filter((r) => r.learning_goal).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="총 응답" value={responses.length.toString()} />
        <KpiCard label="평균 산출 레벨" value={avgComputed} subtitle={`자기진단 ${avgSelf}`} />
        <KpiCard label="GitHub Push 경험자" value={`${githubPushed} / ${responses.length}`} />
        <KpiCard label="배포 경험자" value={`${deployYes} / ${responses.length}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="레벨 분포" desc="산출 레벨 vs 자기 진단 레벨">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={levelDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="산출" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="자기진단" fill="hsl(199 89% 68%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="레벨 비율 (산출)" desc="응답자의 산출 레벨 비중">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={levelDist.map((d, i) => ({ name: d.name, value: d.산출, color: LEVEL_COLORS[i] }))}
                dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label
              >
                {levelDist.map((_, i) => <Cell key={i} fill={LEVEL_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="AI 도구 사용률" desc="응답자 중 사용 경험자 수">
          <HorizontalBar data={aiToolStats} total={responses.length} />
        </ChartCard>

        <ChartCard title="기술 용어 이해도" desc="개념 이해 또는 사용 시 고려">
          <HorizontalBar data={termStats} total={responses.length} />
        </ChartCard>

        <ChartCard title="개발 도구 사용 경험" desc="복수 응답">
          <HorizontalBar data={toolStats} total={responses.length} />
        </ChartCard>

        <ChartCard title="학습 요구 (자유응답)" desc="최근 응답">
          <div className="space-y-2 max-h-[260px] overflow-auto">
            {goals.length === 0 && <p className="text-sm text-muted-foreground">자유응답이 없습니다.</p>}
            {goals.map((g) => (
              <div key={g.id} className="text-sm p-3 rounded-md bg-muted/50 border">
                <div className="text-xs text-muted-foreground mb-1">{g.respondent_name} · {g.group_name}</div>
                {g.learning_goal}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// ── 그룹별 ────────────────────────────────────────────────────
function GroupBreakdown({ responses }: { responses: ResponseRow[] }) {
  if (responses.length === 0) return <EmptyState />;
  const groups = Array.from(new Set(responses.map((r) => r.group_name))).sort();
  const data = groups.map((g) => {
    const rs = responses.filter((r) => r.group_name === g);
    return {
      group: g,
      count: rs.length,
      avg: +(rs.reduce((s, r) => s + (r.computed_level || 0), 0) / rs.length).toFixed(2),
      lv1: rs.filter((r) => r.computed_level === 1).length,
      lv2: rs.filter((r) => r.computed_level === 2).length,
      lv3: rs.filter((r) => r.computed_level === 3).length,
      lv4: rs.filter((r) => r.computed_level === 4).length,
    };
  });

  return (
    <div className="space-y-6">
      <ChartCard title="그룹별 평균 산출 레벨">
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 40)}>
          <BarChart data={data} layout="vertical" margin={{ left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" domain={[0, 4]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis type="category" dataKey="group" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card>
        <CardHeader><CardTitle className="text-base">그룹별 상세</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>그룹</TableHead>
                <TableHead className="text-right">응답</TableHead>
                <TableHead className="text-right">평균 산출</TableHead>
                <TableHead className="text-right">Lv1</TableHead>
                <TableHead className="text-right">Lv2</TableHead>
                <TableHead className="text-right">Lv3</TableHead>
                <TableHead className="text-right">Lv4</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.group}>
                  <TableCell className="font-medium">{d.group}</TableCell>
                  <TableCell className="text-right">{d.count}</TableCell>
                  <TableCell className="text-right"><Badge variant="secondary">{d.avg}</Badge></TableCell>
                  <TableCell className="text-right">{d.lv1}</TableCell>
                  <TableCell className="text-right">{d.lv2}</TableCell>
                  <TableCell className="text-right">{d.lv3}</TableCell>
                  <TableCell className="text-right">{d.lv4}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── 응답자 목록 ──────────────────────────────────────────────
function ResponseList({ responses, campaigns }: { responses: ResponseRow[]; campaigns: Campaign[] }) {
  const cMap = useMemo(() => Object.fromEntries(campaigns.map((c) => [c.id, c.name])), [campaigns]);
  const [open, setOpen] = useState<ResponseRow | null>(null);

  function exportCsv() {
    const headers = ["시간", "캠페인", "이름", "그룹", "AI도구", "AI도구기타", "기술용어", "앱개발경험", "개발도구", "GitHub", "배포플랫폼", "배포기타", "자기진단레벨", "산출레벨", "학습목표"];
    const rows = responses.map((r) => [
      new Date(r.created_at).toLocaleString("ko-KR"),
      cMap[r.campaign_id] || "",
      r.respondent_name, r.group_name,
      r.ai_tools.map((v) => labelOf(AI_TOOLS, v)).join("|"), r.ai_tools_other || "",
      r.tech_terms.map((v) => labelOf(TECH_TERMS, v)).join("|"),
      labelOf(APP_DEV_EXPERIENCE, r.app_dev_experience),
      r.dev_tools.map((v) => labelOf(DEV_TOOLS, v)).join("|"),
      labelOf(GITHUB_SKILL, r.github_skill),
      r.deploy_platforms.map((v) => labelOf(DEPLOY_PLATFORMS, v)).join("|"), r.deploy_other || "",
      r.self_level.toString(), (r.computed_level ?? "").toString(),
      r.learning_goal || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ai-diagnosis-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  if (responses.length === 0) return <EmptyState />;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">응답자 목록</CardTitle>
          <CardDescription>행을 클릭하면 상세 응답을 볼 수 있습니다.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-4 h-4 mr-2" />CSV 내보내기</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제출일</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>그룹</TableHead>
              <TableHead>캠페인</TableHead>
              <TableHead className="text-center">자기진단</TableHead>
              <TableHead className="text-center">산출 레벨</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpen(r)}>
                <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString("ko-KR")}</TableCell>
                <TableCell className="font-medium">{r.respondent_name}</TableCell>
                <TableCell>{r.group_name}</TableCell>
                <TableCell className="text-sm">{cMap[r.campaign_id] || "—"}</TableCell>
                <TableCell className="text-center">Lv {r.self_level}</TableCell>
                <TableCell className="text-center">
                  <Badge style={{ background: LEVEL_COLORS[(r.computed_level || 1) - 1], color: "white" }}>
                    Lv {r.computed_level}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        {open && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{open.respondent_name} <span className="text-muted-foreground text-sm font-normal">· {open.group_name}</span></DialogTitle>
              <DialogDescription>{new Date(open.created_at).toLocaleString("ko-KR")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <DetailRow label="AI 도구" value={[...open.ai_tools.map((v) => labelOf(AI_TOOLS, v)), open.ai_tools_other].filter(Boolean).join(", ") || "—"} />
              <DetailRow label="기술 용어" value={open.tech_terms.map((v) => labelOf(TECH_TERMS, v)).join(", ") || "—"} />
              <DetailRow label="앱 개발 경험" value={labelOf(APP_DEV_EXPERIENCE, open.app_dev_experience)} />
              <DetailRow label="개발 도구" value={open.dev_tools.map((v) => labelOf(DEV_TOOLS, v)).join(", ") || "—"} />
              <DetailRow label="GitHub" value={labelOf(GITHUB_SKILL, open.github_skill)} />
              <DetailRow label="배포 경험" value={[...open.deploy_platforms.map((v) => labelOf(DEPLOY_PLATFORMS, v)), open.deploy_other].filter(Boolean).join(", ") || "—"} />
              <DetailRow label="자기진단 레벨" value={`Lv ${open.self_level} — ${SELF_LEVELS.find((s) => s.value === open.self_level)?.label}`} />
              <DetailRow label="산출 레벨" value={<Badge style={{ background: LEVEL_COLORS[(open.computed_level || 1) - 1], color: "white" }}>Lv {open.computed_level}</Badge>} />
              {open.learning_goal && <DetailRow label="학습 목표" value={open.learning_goal} />}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}

// ── 공통 컴포넌트 ─────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 pb-3 border-b last:border-0">
      <div className="text-xs font-medium text-muted-foreground pt-0.5">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function HorizontalBar({ data, total }: { data: { name: string; value: number }[]; total: number }) {
  return (
    <div className="space-y-2">
      {data.map((d) => {
        const pct = total ? (d.value / total) * 100 : 0;
        return (
          <div key={d.name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-foreground">{d.name}</span>
              <span className="text-muted-foreground">{d.value} ({pct.toFixed(0)}%)</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle>{desc && <CardDescription className="text-xs">{desc}</CardDescription>}</CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyState() {
  return <Card className="p-12 text-center text-muted-foreground border-dashed">아직 응답이 없습니다.</Card>;
}
