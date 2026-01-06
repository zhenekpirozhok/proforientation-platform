import { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    fontFamily:
      'var(--font-inter), system-ui, -apple-system, Segoe UI, Roboto, Arial',

    colorPrimary: '#4F46E5',
    colorInfo: '#06B6D4',
    colorBgBase: '#FAFAFA',
    colorBgContainer: '#FFFFFF',
    colorText: '#0F172A',
    colorTextSecondary: '#475569',
    colorTextTertiary: '#94A3B8',
    colorBorder: '#E2E8F0',
    borderRadius: 16,
  },

  components: {
    Typography: {
      titleMarginBottom: 0,
      titleMarginTop: 0,
      fontFamily: 'var(--font-poppins), var(--font-inter), system-ui',
    },
  },
};
