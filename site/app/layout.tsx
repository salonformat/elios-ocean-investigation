import type { Metadata } from 'next';
import { Della_Respira, Josefin_Sans } from 'next/font/google';
import './globals.css';

const josefin = Josefin_Sans({
  variable: '--font-josefin',
  subsets: ['latin'],
});

const della = Della_Respira({
  variable: '--font-della',
  weight: '400',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Could This Creature Live in the Ocean?',
  description: 'Elio was four when he drew this creature. He was certain it lived in the ocean. So we decided to investigate.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${josefin.variable} ${della.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
