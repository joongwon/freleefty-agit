import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>404 Not Found</h1>
      <p>요청하신 페이지를 찾을 수 없습니다.</p>
      <Link href="/">소개 페이지로 돌아가기</Link>
    </main>
  );
}
