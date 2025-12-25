"use client";

import { Drawer, Menu, Avatar, Select } from "antd";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileNavDrawer({ open, onClose }: Props) {
  return (
    <Drawer
      placement="right"
      open={open}
      onClose={onClose}
      width={280}
    >
      <div className="flex items-center gap-3 mb-6">
        <Avatar size={48} />
        <div>
          <div className="font-medium">Sophia Rose</div>
        </div>
      </div>

      <Menu
        mode="inline"
        items={[
          { key: "quizzes", label: "Quizzes" },
          { key: "admin", label: "Admin Dashboard" },
          { key: "results", label: "Results" },
          { key: "settings", label: "Settings" },
        ]}
      />

      <div className="mt-6">
        <Select
          value="en"
          options={[
            { value: "en", label: "English" },
            { value: "ru", label: "Русский" },
          ]}
          className="w-full"
        />
      </div>
    </Drawer>
  );
}
