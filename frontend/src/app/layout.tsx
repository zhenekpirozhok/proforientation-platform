import './globals.css';
import Providers from './providers';
import type { Metadata } from 'next';
import { inter, poppins } from '@/shared/styles/fonts';

export const metadata: Metadata = {
  title: {
    default: 'CareerPath',
    template: '%s | CareerPath',
  },
  description: 'Proforientation Tests Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
