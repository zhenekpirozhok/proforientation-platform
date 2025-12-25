"use client";

import {
  Layout,
  Menu,
  Button,
  Select,
  Avatar,
  Dropdown,
} from "antd";
import {
  MenuOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { MobileNavDrawer } from "./MobileNavDrawer";

const { Header } = Layout;

export function AppHeader() {
  const [open, setOpen] = useState(false);

  const isAuthenticated = false; // TODO: from auth
  const isAdmin = false;

  const menuItems = [
    { key: "quizzes", label: "Quizzes" },
    ...(isAuthenticated
      ? [{ key: "profile", label: "My Career Profile" }]
      : []),
    ...(isAdmin
      ? [{ key: "admin", label: "Admin Dashboard" }]
      : []),
  ];

  return (
    <Header className="flex items-center justify-between bg-white dark:bg-slate-950 px-4 md:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold text-lg">
          🎓 CareerPath
        </div>

        <div className="hidden md:block">
          <Menu
            mode="horizontal"
            items={menuItems}
            selectable={false}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <Select
          value="en"
          options={[
            { value: "en", label: "English" },
            { value: "ru", label: "Русский" },
          ]}
          className="hidden md:block w-[120px]"
        />

        {isAuthenticated ? (
          <Dropdown
            menu={{
              items: [
                { key: "settings", label: "Settings" },
                { key: "logout", label: "Logout" },
              ],
            }}
          >
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar size="small" />
              <span className="hidden md:inline">
                Username
              </span>
              <SettingOutlined />
            </div>
          </Dropdown>
        ) : (
          <Button type="primary">Sign in</Button>
        )}

        <Button
          type="text"
          icon={<MenuOutlined />}
          className="md:hidden"
          onClick={() => setOpen(true)}
        />
      </div>

      <MobileNavDrawer open={open} onClose={() => setOpen(false)} />
    </Header>
  );
}
