// Root layout component that wraps every page in the app with HTML and body tags
import "./globals.css";
import { CustomerProvider } from './customer-provider';

// Metadata for the app: used in the browser tab title and SEO description
export const metadata = { title: "Teyro — T-Shirts", description: "Simple T-shirt store" };

// Root layout component
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><CustomerProvider>{children}</CustomerProvider></body></html>;
}
