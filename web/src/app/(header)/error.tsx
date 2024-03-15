"use client";
export default function Error(p: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <h1>알 수 없는 오류!</h1>
      <button onClick={() => p.reset()}>다시 시도</button>
      <p>오류가 계속되면 아래 내용을 관리자에게 문의하세요</p>
      <p>{p.error.message}</p>
      <p>digest: {p.error.digest}</p>
    </main>
  );
}
