import { Card, Result } from "antd";

type Props = {
  status: "404" | "500" | "403";
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode; 
};

export function ErrorState({ status, title, subtitle, extra }: Props) {
  return (
    <div className="w-full py-10">
      <div className="relative mx-auto max-w-[920px]">
        <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-r from-indigo-500/15 to-cyan-400/15 blur-2xl dark:from-indigo-400/10 dark:to-cyan-300/10" />

        <Card className="relative rounded-[28px] border border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/60">
          <Result
            status={status as any}
            title={<span className="font-semibold">{title}</span>}
            subTitle={subtitle ? subtitle : null}
            extra={extra}
          />
        </Card>
      </div>
    </div>
  );
}
