import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Virtual Piano - Digital Piano Studio',
  description: 'A modern digital piano studio with realistic acoustic grand piano sound, full 88-key architecture, recording, metronome, and keyboard controls.',
  openGraph: {
    title: 'Virtual Piano - Digital Piano Studio',
    description: 'A modern digital piano studio with realistic acoustic grand piano sound, full 88-key architecture, recording, metronome, and keyboard controls.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virtual Piano - Digital Piano Studio',
    description: 'A modern digital piano studio with realistic acoustic grand piano sound, full 88-key architecture, recording, metronome, and keyboard controls.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
