import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Virtual Piano - Digital Piano Studio',
  description: 'A realistic browser-based digital piano and keyboard workstation featuring 37 studio instruments, physical acoustic modeling, 3-pedal system, MIDI export, and stage performance mode.',
  openGraph: {
    title: 'Virtual Piano - Digital Piano Studio',
    description: 'A realistic browser-based digital piano and keyboard workstation featuring 37 studio instruments, physical acoustic modeling, 3-pedal system, MIDI export, and stage performance mode.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virtual Piano - Digital Piano Studio',
    description: 'A realistic browser-based digital piano and keyboard workstation featuring 37 studio instruments, physical acoustic modeling, 3-pedal system, MIDI export, and stage performance mode.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
