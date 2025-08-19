import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Everything you Ever Wanted to know about Microsoft Orleans or Why Sergey and Reuben are the best',
  description: 'Microsoft Orleans from first principals. Everything about the virtual actor model and more',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}