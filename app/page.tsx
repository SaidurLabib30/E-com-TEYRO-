'use client';
// State management and side effects
import { useEffect, useState } from 'react';

// Client-side navigation
import Link from 'next/link';

// Icons from lucide-react library
import { Search, ShoppingBag } from 'lucide-react';
import { CustomerAuthPanel, CustomerDashboard } from './customer-account';

// Product store - shared between admin and public pages
import { getDiscountedPrice, getProducts, subscribe } from './product-store';

// Main homepage: customer dashboard with hero section and product grid
export default function Home(){
  // Track cart item count from localStorage
  const [cart,setCart]=useState(0);
  // Product catalog state - synced with the shared product store
  const [products,setProducts]=useState(getProducts());
  const [searchTerm,setSearchTerm]=useState('');

  const normalizeSearchText = (value: string) =>
    value.toLowerCase().replace(/[-_\s]+/g, '').replace(/&/g, 'and');

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.trim();
    if (!term) return true;

    const normalizedTerm = normalizeSearchText(term);
    const category = normalizeSearchText(product.category || '');

    if (normalizedTerm.includes('tshirt') || normalizedTerm.includes('tee')) {
      return category === 'tshirts';
    }

    if (normalizedTerm.includes('hoodie')) {
      return category === 'hoodies';
    }

    if (normalizedTerm.includes('shirt')) {
      return category === 'shirts';
    }

    return category.includes(normalizedTerm);
  });

  // Sync cart count from localStorage on mount and listen for cart update events
  useEffect(()=>{
   // Read cart count from localStorage and update state
   const syncCart=()=>setCart(Number(window.localStorage.getItem('thread-cart')||0));
   // Re-sync cart when custom event is dispatched from other pages
   const syncUpdated=()=>syncCart();
   syncCart();
   window.addEventListener('thread-cart-updated',syncUpdated);
   // Remove event listener when component unmounts
   return ()=>window.removeEventListener('thread-cart-updated',syncUpdated);
  },[]);

  // Subscribe to product store changes so new products appear immediately
  useEffect(()=>{
   const updateProducts=()=>setProducts(getProducts());
   const unsubscribe=subscribe(updateProducts);
   // Initial fetch in case products changed before subscription
   updateProducts();
   return unsubscribe;
  },[]);

  return (
   <main className="customer-dashboard min-h-screen">
    <div className="customer-upper-section">
    {/* Sticky header with logo, tagline, and cart button */}
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d1017]/90 backdrop-blur">
     <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-5">
      {/* Brand logo with gold accent color */}
      <div className="flex items-center gap-2.5">
      <span className="brand-logo inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#11141b] font-black text-sm">T</span>
      <span className="brand-name text-xl font-black tracking-[.22em]">TEYRO</span>
     </div>

      {/* Search bar visible on large screens and centered in the header */}
      <div className="hidden flex-1 justify-center md:flex">
        <label className="flex w-full max-w-md items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[#b7bfca] shadow-inner shadow-black/10">
          <Search size={16} className="text-[#d8b36a]" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search t-shirts"
            aria-label="Search products"
            className="w-full bg-transparent text-sm text-[#f8f5ed] placeholder:text-[#8a93a1] outline-none"
          />
        </label>
      </div>

      {/* Tagline visible on medium and larger screens */}
      <div className="hidden text-sm text-[#aab3c0] md:block">Everyday T-shirts. Nothing extra.</div>
      {/* Cart button showing current item count */}
      <div className="ml-auto flex items-center gap-2">
       <button className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-[#f8f5ed] transition hover:bg-white/10"><ShoppingBag size={17}/> Cart ({cart})</button>
       <CustomerAuthPanel />
      </div>
     </div>

     <div className="mx-auto max-w-6xl px-5 pb-4 md:hidden">
      <label className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[#b7bfca] shadow-inner shadow-black/10">
        <Search size={16} className="text-[#d8b36a]" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search t-shirts"
          aria-label="Search products"
          className="w-full bg-transparent text-sm text-[#f8f5ed] placeholder:text-[#8a93a1] outline-none"
        />
      </label>
     </div>
    </header>

    {/* Hero section: collection announcement, headline, description, and CTA */}
    <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 md:pb-20 md:pt-24">
     {/* Decorative glow behind hero content */}
     <div className="pointer-events-none absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#d8b36a]/5 blur-[100px]"></div>
    <div className="relative">
    <div className="max-w-3xl">
      {/* Collection label in uppercase with letter spacing */}
      <p className="mb-5 text-xs font-bold uppercase tracking-[.25em] text-[#d8b36a]">New collection · 2026</p>
      {/* Main headline with gold accent word and responsive sizing */}
      <h1 className="text-5xl font-black leading-[.95] tracking-tight text-[#f8f5ed] md:text-8xl"><span className="text-[#d8b36a]">T-shirts</span> made<br/>to wear daily.</h1>
      {/* Subtitle describing the value proposition */}
      <p className="mt-7 max-w-xl text-base leading-7 text-[#b7bfca] md:text-lg">Clean fits, comfortable fabric and simple colors. Pick your favorite and order directly — no account required.</p>
       {/* Call-to-action button linking to the all products page */}
       <Link href="/products" className="mt-8 flex items-center justify-center rounded-full bg-gradient-to-r from-[#d8b36a] to-[#b9873e] px-6 py-3.5 text-sm font-bold text-[#11141b] shadow-lg shadow-[#d8b36a]/20 transition hover:from-[#e5c57e] hover:to-[#c89a50]">All Categories</Link>
    </div>
    </div>
    </section>

      <CustomerDashboard />
    </div>

    {/* Product collection grid section */}
    <section className="mx-auto max-w-6xl px-5 pb-24 pt-10 md:pt-14">
     {/* Section header with title and product count */}
     <div className="relative mb-7 flex items-end justify-center">
      <div className="text-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-[#d8b36a]">Collection</p><h2 className="mt-1 text-3xl font-bold text-[#f8f5ed]">Best sellers</h2></div>
      <p className="absolute bottom-0 right-0 text-sm text-[#aab3c0]">{filteredProducts.length} styles</p>
     </div>

     {filteredProducts.length === 0 ? (
       <div className="rounded-2xl border border-dashed border-white/15 bg-[#111827]/40 p-10 text-center text-[#b7bfca]">
         No products found
       </div>
     ) : (
       <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {filteredProducts.map(p=><article key={p.id} className="group rounded-2xl border border-white/10 bg-[#151a22]/90 p-3 shadow-lg shadow-black/10">
         {/* Link wrapping product image for navigation to product detail */}
         <Link href={`/products/${p.id}`} className="block">
          {/* Product image container with hover zoom and color badge overlay */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#242b36] sm:aspect-[3/4]">
           <img src={p.img} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
           {/* Color badge on top-left of the product image */}
           <span className="absolute left-3 top-3 rounded-full border border-[#d8b36a]/20 bg-[#d8b36a]/15 px-3 py-1 text-xs font-bold text-[#e8d19a]">{p.color}</span>
          </div>
         </Link>
         {/* Product info: name, available sizes, and price */}
         <div className="flex items-start justify-between pt-4">
          <div><h3 className="font-semibold text-[#f8f5ed]">{p.name}</h3><p className="mt-1 text-sm text-[#aab3c0]">S · M · L · XL · XXL</p></div>
          <div className="text-right">{p.discount>0?<><p className="text-xs text-[#8f99a8] line-through">৳{p.price}</p><p className="font-bold text-[#d8b36a]">৳{getDiscountedPrice(p.price,p.discount)}</p><p className="mt-1 text-[10px] font-bold text-emerald-300">{p.discount}% off</p></>:<p className="font-bold text-[#d8b36a]">৳{p.price}</p>}</div>
         </div>
         {/* "Order now" button linking to product detail page */}
         <Link href={`/products/${p.id}`} className="mt-4 flex w-full items-center justify-center rounded-xl border border-[#d8b36a]/40 bg-[#d8b36a]/10 px-4 py-3 text-sm font-bold text-[#e8d19a] transition hover:border-[#d8b36a] hover:bg-[#d8b36a] hover:text-[#11141b]">Order now</Link>
        </article>)}
       </div>
     )}
     {/* View All button - centered below the grid */}
     <div className="mt-8 flex justify-center">
      <Link href="/products" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#d8b36a] to-[#b9873e] px-8 py-4 text-sm font-bold text-[#11141b] shadow-lg shadow-[#d8b36a]/20 transition hover:from-[#e5c57e] hover:to-[#c89a50] min-w-[200px]">
       View All
      </Link>
     </div>
    </section>

    {/* Footer with copyright */}
    <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-[#8f99a8]">© 2026 Teyro. Simple T-shirts, simple shopping.</footer>
   </main>
  );
}