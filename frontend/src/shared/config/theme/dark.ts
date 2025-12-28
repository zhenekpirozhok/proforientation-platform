import { ThemeConfig } from "antd";

export const darkTheme: ThemeConfig = {
    token: {
        fontFamily:
            "var(--font-inter), system-ui, -apple-system, Segoe UI, Roboto, Arial",

        colorPrimary: "#6366F1",
        colorInfo: "#22D3EE",
        colorBgBase: "#020617",
        colorBgContainer: "#020617",
        colorText: "#E5E7EB",
        colorTextSecondary: "#94A3B8",
        colorTextTertiary: "#64748B",
        colorBorder: "#1E293B",
        borderRadius: 16,
    },

    components: {
        Typography: {
            fontFamily:
                "var(--font-poppins), var(--font-inter), system-ui",
        },
        Button: {
            boxShadow: "none",
            boxShadowSecondary: "none",
            boxShadowTertiary: "none",
            defaultShadow: "none",
            primaryShadow: "none",
        },
    },
};
