"use client";

export function QuizPlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-[820px]">{children}</div>
    </main>
  );
}
