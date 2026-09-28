// Root layout shared by all routes; global styles and customer state are initialized here.
import "./globals.css";
import { CustomerProvider } from './customer-provider';

// Default title and description used by Next.js metadata for every route.
export const metadata = { title: "Teyro — T-Shirts", description: "Simple T-shirt store" };

// Wrap page content in the provider so account controls share one customer session.
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><CustomerProvider>{children}</CustomerProvider></body></html>;
}
