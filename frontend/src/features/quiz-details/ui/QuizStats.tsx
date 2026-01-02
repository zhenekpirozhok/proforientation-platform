"use client";

import {
  ClockCircleOutlined,
  QuestionCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 text-left shadow-sm dark:border-slate-800/70 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-2xl font-bold leading-none text-slate-900 dark:text-slate-100">
            {value}
          </div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuizStats({
  questions,
  minutes,
  taken,
  tQuestions,
  tMinutes,
  tTaken,
}: {
  questions: number | null;
  minutes: number | null;
  taken: number | null;
  tQuestions: string;
  tMinutes: string;
  tTaken: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        icon={<QuestionCircleOutlined className="text-lg" />}
        value={questions ?? "—"}
        label={tQuestions}
      />
      <StatCard
        icon={<ClockCircleOutlined className="text-lg" />}
        value={minutes ?? "—"}
        label={tMinutes}
      />
      <StatCard
        icon={<UserOutlined className="text-lg" />}
        value={taken ?? "—"}
        label={tTaken}
      />
    </div>
  );
}
