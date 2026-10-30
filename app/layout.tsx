// Root layout (refs ISSUE-20, ISSUE-27 for the manifest link).
// No em dashes are used in this file.
import React from 'react';
import './globals.css';
import { AuthProvider } from '../lib/auth';
import Nav from '../components/Nav';

export const metadata = { title: 'Closet', description: 'Personal wardrobe app: palette rating and outfit builder.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><link rel="manifest" href="/manifest.webmanifest" /><meta name="theme-color" content="#84a282" /><link rel="apple-touch-icon" href="/icons/icon-192.png" /></head>
      <body>
        <AuthProvider>
          <Nav />
          <main className="mx-auto max-w-3xl px-4 py-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
