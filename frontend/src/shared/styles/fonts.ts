import localFont from 'next/font/local';

/* ===== Inter — UI / body ===== */
export const inter = localFont({
  variable: '--font-inter',
  display: 'swap',
  src: [
    { path: '../assets/fonts/inter/Inter-Light.woff2', weight: '300' },
    { path: '../assets/fonts/inter/Inter-Regular.woff2', weight: '400' },
    { path: '../assets/fonts/inter/Inter-Medium.woff2', weight: '500' },
    { path: '../assets/fonts/inter/Inter-SemiBold.woff2', weight: '600' },
    { path: '../assets/fonts/inter/Inter-Bold.woff2', weight: '700' },
  ],
});

/* ===== Poppins — headings ===== */
export const poppins = localFont({
  variable: '--font-poppins',
  display: 'swap',
  src: [
    { path: '../assets/fonts/poppins/Poppins-Medium.ttf', weight: '500' },
    { path: '../assets/fonts/poppins/Poppins-SemiBold.ttf', weight: '600' },
    { path: '../assets/fonts/poppins/Poppins-Bold.ttf', weight: '700' },
    { path: '../assets/fonts/poppins/Poppins-ExtraBold.ttf', weight: '800' },
  ],
});
