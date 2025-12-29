"use client";

import { Card, Input, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";

type Props = {
  value: { q: string; category: string; duration: string };
  onChange: (next: Props["value"]) => void;
  onClear: () => void;
};

export function QuizzesFilters({ value, onChange, onClear }: Props) {
  const t = useTranslations("Quizzes");

  return (
    <Card className="mt-6 rounded-2xl">
      <div className="grid gap-3 md:grid-cols-3">
        <Input
          size="large"
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder={t("searchPlaceholder")}
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          className="rounded-2xl"
        />

        <Select
          size="large"
          value={value.category}
          onChange={(v) => onChange({ ...value, category: v })}
          className="rounded-2xl"
          options={[
            { value: "all", label: t("allCategories") },
            { value: "tech", label: "Technology" },
            { value: "business", label: "Business" },
            { value: "health", label: "Healthcare" },
            { value: "finance", label: "Finance" }
          ]}
        />

        <Select
          size="large"
          value={value.duration}
          onChange={(v) => onChange({ ...value, duration: v })}
          className="rounded-2xl"
          options={[
            { value: "any", label: t("anyDuration") },
            { value: "short", label: "≤ 10 min" },
            { value: "mid", label: "10–20 min" },
            { value: "long", label: "20+ min" }
          ]}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={onClear}
          className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          {t("clearFilters")}
        </button>
      </div>
    </Card>
  );
}
