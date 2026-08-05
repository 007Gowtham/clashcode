import Providers from '@/components/Providers';
import './globals.css';

export const metadata = {
  title: 'ClashCode — Battle Arena',
  description: 'Real-time tactical DSA competitive platform. Code. Compete. Conquer.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-vantage-base text-vantage-text">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
