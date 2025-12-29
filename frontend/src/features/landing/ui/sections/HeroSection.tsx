"use client";

import { Button, Typography } from "antd";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { fadeUp } from "../../lib/motion";
import { PreviewCard } from "./PreviewCard";

const { Title, Text } = Typography;

export function HeroSection() {
  const t = useTranslations("Landing");
    const router = useRouter();

  return (
    <section className="grid items-center gap-10 lg:grid-cols-2">
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <Title className="!mb-3 !text-4xl !leading-[1.05] md:!text-5xl">
          {t("title")}
        </Title>

        <Text className="text-base text-slate-600 dark:text-slate-300">
          {t("subtitle")}
        </Text>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="primary" size="large" className="rounded-2xl" onClick={() => router.push('/quizzes')}>
            {t("ctaPrimary")}
          </Button>
          <Button size="large" className="rounded-2xl" onClick={() => router.push('/signup')}>
            {t("ctaSecondary")}
          </Button>
        </div>

        <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
          {t("trust")}
        </div>
      </motion.div>

      <PreviewCard />
    </section>
  );
}
