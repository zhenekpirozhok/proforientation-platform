"use client";

import { Card, Typography } from "antd";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { fadeUp, stagger } from "../../lib/motion";

const { Title } = Typography;

export function FeaturesSection() {
  const t = useTranslations("Landing");

  const items = [
    { title: t("feature1Title"), text: t("feature1Text") },
    { title: t("feature2Title"), text: t("feature2Text") },
    { title: t("feature3Title"), text: t("feature3Text") },
  ];

  return (
    <section className="mt-14">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
        <Title level={2} className="!mb-6 !text-2xl md:!text-3xl">
          {t("featuresTitle")}
        </Title>
      </motion.div>

      <motion.div
        className="grid gap-4 md:grid-cols-3"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
      >
        {items.map((x) => (
          <motion.div key={x.title} variants={fadeUp}>
            <Card className="rounded-[24px] h-full">
              <div className="text-base font-semibold">{x.title}</div>
              <div className="mt-2 text-slate-600 dark:text-slate-300">
                {x.text}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
