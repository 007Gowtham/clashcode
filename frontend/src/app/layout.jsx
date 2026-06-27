import Providers from '@/components/Providers';
import './globals.css';

export const metadata = {
  title: "ClashCode - Battle Arena",
  description: "Real-time tactical DSA competitive platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white text-slate-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
