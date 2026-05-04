import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, BarChart3, Link2, Users } from "lucide-react";
import { useEffect } from "react";

export default function Index() {
  useEffect(() => {
    document.title = "AI 활용 진단앱";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="bg-gradient-hero">
        <div className="container py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border shadow-sm mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">교육 사전 진단 도구</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
            AI 활용 수준,<br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">데이터로 진단하세요</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            교육생에게 진단 링크를 보내고, 응답을 그룹별·레벨별로 한눈에 분석합니다.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow">
              <Link to="/admin/login">관리자 로그인</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/s/demo">데모 진단 체험</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Feature icon={<Link2 className="w-5 h-5" />} title="캠페인별 링크 생성" desc="교육 차수마다 별도 링크를 생성해 응답을 분리 관리합니다." />
          <Feature icon={<Users className="w-5 h-5" />} title="그룹별 분석" desc="소속/팀 단위로 응답을 자동 그룹화해 비교 분석합니다." />
          <Feature icon={<BarChart3 className="w-5 h-5" />} title="레벨 시각화" desc="자기 진단 vs 산출 레벨을 차트로 한눈에 확인합니다." />
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardHeader>
        <div className="w-10 h-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center mb-2">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
    </Card>
  );
}
