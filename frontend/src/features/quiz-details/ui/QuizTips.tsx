"use client";

export function QuizTips({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="mt-8 rounded-2xl border border-slate-200/70 bg-slate-50 p-6 dark:border-slate-800/70 dark:bg-slate-900/40">
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </div>
<ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
  {items.map((x, i) => (
    <li key={i} className="flex items-start gap-3">
      <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
      <span className="leading-relaxed">{x}</span>
    </li>
  ))}
</ul>
    </div>
  );
}
