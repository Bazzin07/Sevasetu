import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import { I18nProvider } from '@/lib/i18n';
import NavBar from '@/app/components/NavBar';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-heading', display: 'swap' });
const inter  = Inter({ subsets: ['latin'], variable: '--font-body',    display: 'swap', weight: ['300','400','500','600','700'] });

export const metadata: Metadata = {
  title: 'SevaSetu — AI-Powered Resource Allocation for India',
  description: 'Matching community humanitarian needs with qualified volunteers across India using a 5-signal AI matching engine.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <I18nProvider>
          <NavBar />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
