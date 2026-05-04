import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCampaignBySlug, submitResponse, type Campaign } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Sparkles } from "lucide-react";
import {
  AI_TOOLS, TECH_TERMS, APP_DEV_EXPERIENCE, DEV_TOOLS,
  GITHUB_SKILL, DEPLOY_PLATFORMS, SELF_LEVELS, computeLevel,
  type AppDevExperience, type GithubSkill,
} from "@/lib/survey";

export default function Survey() {
  const { slug } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [aiTools, setAiTools] = useState<string[]>([]);
  const [aiToolsOther, setAiToolsOther] = useState("");
  const [techTerms, setTechTerms] = useState<string[]>([]);
  const [appDevExp, setAppDevExp] = useState<AppDevExperience | "">("");
  const [devTools, setDevTools] = useState<string[]>([]);
  const [github, setGithub] = useState<GithubSkill | "">("");
  const [deploy, setDeploy] = useState<string[]>([]);
  const [deployOther, setDeployOther] = useState("");
  const [selfLevel, setSelfLevel] = useState<number | null>(null);
  const [goal, setGoal] = useState("");

  useEffect(() => {
    document.title = "AI 활용 진단 설문";
    (async () => {
      if (!slug) return;
      const c = await getCampaignBySlug(slug);
      setCampaign(c);
      setLoading(false);
    })();
  }, [slug]);

  function toggle(arr: string[], v: string, setter: (a: string[]) => void) {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  const skipDevTools = appDevExp === "none";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!campaign) return;
    if (!name.trim() || !groupName.trim()) return toast.error("이름과 소속(그룹)을 입력해주세요");
    if (!appDevExp) return toast.error("앱 개발 경험을 선택해주세요");
    if (!github) return toast.error("GitHub 활용 역량을 선택해주세요");
    if (selfLevel === null) return toast.error("자기 진단 레벨을 선택해주세요");

    setSubmitting(true);
    const computed = computeLevel({
      ai_tools: aiTools,
      ai_tools_other: aiToolsOther,
      tech_terms: techTerms,
      app_dev_experience: appDevExp as AppDevExperience,
      dev_tools: skipDevTools ? [] : devTools,
      github_skill: github as GithubSkill,
      deploy_platforms: deploy,
      deploy_other: deployOther,
      self_level: selfLevel!,
    });

    try {
      await submitResponse({
        campaign_id: campaign.id,
        respondent_name: name.trim(),
        group_name: groupName.trim(),
        ai_tools: aiTools,
        ai_tools_other: aiToolsOther.trim(),
        tech_terms: techTerms,
        app_dev_experience: appDevExp,
        dev_tools: skipDevTools ? [] : devTools,
        github_skill: github,
        deploy_platforms: deploy,
        deploy_other: deployOther.trim(),
        self_level: selfLevel!,
        learning_goal: goal.trim(),
        computed_level: computed,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error("제출 실패: " + (e instanceof Error ? e.message : "알 수 없는 오류"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>유효하지 않은 링크</CardTitle>
            <CardDescription>설문이 비활성화되었거나 존재하지 않습니다. 담당자에게 문의해주세요.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-6">
        <Card className="max-w-lg w-full text-center shadow-elegant">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow mb-2">
              <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">제출이 완료되었습니다</CardTitle>
            <CardDescription className="text-base mt-2">
              참여해 주셔서 감사합니다.<br />
              교육 당일 더욱 알찬 시간이 될 수 있도록 활용하겠습니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="bg-gradient-hero border-b">
        <div className="container max-w-3xl py-10">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">AI 활용 진단</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{campaign.name}</h1>
          {campaign.description && (
            <p className="mt-3 text-muted-foreground">{campaign.description}</p>
          )}
        </div>
      </header>

      <main className="container max-w-3xl py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 응답자 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">응답자 정보</CardTitle>
              <CardDescription>결과는 그룹별 분석에 사용됩니다.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group">소속 / 그룹 *</Label>
                <Input id="group" placeholder="예: 마케팅팀, 1반" value={groupName} onChange={(e) => setGroupName(e.target.value)} maxLength={50} required />
              </div>
            </CardContent>
          </Card>

          {/* 1. AI 도구 */}
          <QuestionCard num={1} title="AI 도구 사용 경험" desc="사용해 본 도구를 모두 선택해 주세요. (복수 선택)">
            <div className="grid sm:grid-cols-2 gap-3">
              {AI_TOOLS.map((o) => (
                <CheckboxRow key={o.value} checked={aiTools.includes(o.value)} onChange={() => toggle(aiTools, o.value, setAiTools)} label={o.label} />
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <Label className="text-sm">기타 (직접 입력)</Label>
              <Input value={aiToolsOther} onChange={(e) => setAiToolsOther(e.target.value)} placeholder="예: Copilot, Notion AI" maxLength={100} />
            </div>
          </QuestionCard>

          {/* 2. 기술 용어 */}
          <QuestionCard num={2} title="기술 용어 숙련도" desc="개념을 이해하거나 실제 사용 시 고려해 본 항목을 모두 선택해 주세요.">
            <div className="grid sm:grid-cols-2 gap-3">
              {TECH_TERMS.map((o) => (
                <CheckboxRow key={o.value} checked={techTerms.includes(o.value)} onChange={() => toggle(techTerms, o.value, setTechTerms)} label={o.label} />
              ))}
            </div>
          </QuestionCard>

          {/* 3. 앱 개발 경험 */}
          <QuestionCard num={3} title="앱 개발 실전 경험" desc="AI와 대화하여 실제 작동하는 앱/서비스를 만들어 본 적이 있나요? (단일 선택)">
            <RadioGroup value={appDevExp} onValueChange={(v) => setAppDevExp(v as AppDevExperience)}>
              {APP_DEV_EXPERIENCE.map((o) => (
                <RadioRow key={o.value} value={o.value} label={o.label} />
              ))}
            </RadioGroup>
          </QuestionCard>

          {/* 4. 개발 도구 (조건부) */}
          {!skipDevTools && (
            <QuestionCard num={4} title="사용해 본 개발 도구" desc="경험이 있다면, 어떤 도구들을 활용해 보셨나요? (복수 선택)">
              <div className="grid sm:grid-cols-2 gap-3">
                {DEV_TOOLS.map((o) => (
                  <CheckboxRow key={o.value} checked={devTools.includes(o.value)} onChange={() => toggle(devTools, o.value, setDevTools)} label={o.label} />
                ))}
              </div>
            </QuestionCard>
          )}

          {/* 5. GitHub */}
          <QuestionCard num={5} title="GitHub 활용 역량" desc="협업 및 코드 관리 도구인 GitHub에 대해 어느 정도 아시나요? (단일 선택)">
            <RadioGroup value={github} onValueChange={(v) => setGithub(v as GithubSkill)}>
              {GITHUB_SKILL.map((o) => (
                <RadioRow key={o.value} value={o.value} label={o.label} />
              ))}
            </RadioGroup>
          </QuestionCard>

          {/* 6. 배포 경험 */}
          <QuestionCard num={6} title="서비스 배포 경험" desc="내가 만든 앱을 외부에서 접속 가능하도록 배포해 본 플랫폼이 있나요? (복수 선택)">
            <div className="grid sm:grid-cols-2 gap-3">
              {DEPLOY_PLATFORMS.map((o) => (
                <CheckboxRow key={o.value} checked={deploy.includes(o.value)} onChange={() => toggle(deploy, o.value, setDeploy)} label={o.label} />
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <Label className="text-sm">기타 (직접 작성)</Label>
              <Input value={deployOther} onChange={(e) => setDeployOther(e.target.value)} placeholder="예: Cloudflare Pages, Render" maxLength={100} />
            </div>
          </QuestionCard>

          {/* 7. 자기 진단 */}
          <QuestionCard num={7} title="종합 자기 진단 (레벨)" desc="본인의 현재 수준을 가장 잘 설명하는 단계를 선택해 주세요.">
            <RadioGroup value={selfLevel?.toString() ?? ""} onValueChange={(v) => setSelfLevel(Number(v))}>
              <div className="grid gap-3">
                {SELF_LEVELS.map((o) => (
                  <label
                    key={o.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/30 ${selfLevel === o.value ? "border-primary bg-accent/40 shadow-sm" : "border-border"}`}
                  >
                    <RadioGroupItem value={o.value.toString()} className="mt-1" />
                    <div>
                      <div className="font-semibold">{o.label}</div>
                      <div className="text-sm text-muted-foreground">{o.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </QuestionCard>

          {/* 8. 자유 응답 */}
          <QuestionCard num={8} title="교육 요구 사항" desc="이번 교육에서 이것만큼은 꼭 배우고 싶은 것이 있다면 무엇인가요? (선택)">
            <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={4} maxLength={500} placeholder="자유롭게 작성해 주세요" />
          </QuestionCard>

          <Button type="submit" disabled={submitting} size="lg" className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow">
            {submitting ? "제출 중..." : "진단 제출하기"}
          </Button>
        </form>
      </main>
    </div>
  );
}

function QuestionCard({ num, title, desc, children }: { num: number; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
            {num}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        {desc && <CardDescription className="ml-11">{desc}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/30 ${checked ? "border-primary bg-accent/40" : "border-border"}`}>
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="text-sm leading-snug">{label}</span>
    </label>
  );
}

function RadioRow({ value, label }: { value: string; label: string }) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/30 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/40">
      <RadioGroupItem value={value} />
      <span className="text-sm leading-snug">{label}</span>
    </label>
  );
}
