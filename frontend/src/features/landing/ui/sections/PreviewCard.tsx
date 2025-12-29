"use client";

import { Card } from "antd";
import { motion } from "framer-motion";

export function PreviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.05 }}
      className="relative"
    >
      <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-r from-indigo-500/20 to-cyan-400/20 blur-xl" />
      <Card className="relative rounded-[28px] shadow-glow">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Preview
          </div>
          <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:ring-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Question 12/40
            </div>
            <div className="mt-1 font-medium">
              “I enjoy solving complex problems.”
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {["Strongly agree", "Agree", "Disagree", "Strongly disagree"].map(
                (x) => (
                  <div
                    key={x}
                    className="rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
                  >
                    {x}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "R", w: "w-[68%]" },
              { label: "I", w: "w-[86%]" },
              { label: "A", w: "w-[54%]" },
            ].map((b) => (
              <div
                key={b.label}
                className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-900/40 dark:ring-slate-800"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {b.label}
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className={`h-2 rounded-full bg-indigo-500 ${b.w}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
