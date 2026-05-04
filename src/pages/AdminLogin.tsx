import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { adminLogin, getAdminToken, setAdminToken } from "@/lib/api";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "관리자 로그인 | AI 진단";
    if (getAdminToken()) nav("/admin");
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await adminLogin(pw);
      setAdminToken(token);
      toast.success("로그인 성공");
      nav("/admin");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-6">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow mb-2">
            <Lock className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">관리자 로그인</CardTitle>
          <CardDescription>AI 활용 진단 대시보드</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw">비밀번호</Label>
              <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus required />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
              {loading ? "확인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
