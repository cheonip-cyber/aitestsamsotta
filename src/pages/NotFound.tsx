import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-6">
      <div>
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <p className="text-xl mb-6">페이지를 찾을 수 없습니다.</p>
        <Link to="/" className="text-primary underline">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}
