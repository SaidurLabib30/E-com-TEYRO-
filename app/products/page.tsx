// Product listing page: shows all available T-shirts
'use client';

// Next.js Link component for client-side navigation
import Link from 'next/link';

// Icons from lucide-react
import { ShoppingBag } from 'lucide-react';

// Product store - shared between admin and public pages
import { getDiscountedPrice, getProducts, subscribe } from '../product-store';

// React hooks
import { useEffect, useState } from 'react';

// Product listing page: displays all available T-shirts in a grid
export default function ProductsPage(){
  // Product catalog state - synced with the shared product store
  const [products,setProducts]=useState(getProducts());
  // Active category filter state: 'all' | 'tshirt' | 'shirt' | 'hoodie'
  const [activeCategory,setActiveCategory]=useState('all');

  // Subscribe to product store changes so new products appear immediately
  useEffect(()=>{
   const updateProducts=()=>setProducts(getProducts());
   const unsubscribe=subscribe(updateProducts);
   updateProducts();
   return unsubscribe;
  },[]);

  // Filter products based on active category
  // Uses the category field set in the Admin Panel
  const filteredProducts=products.filter(p=>{
   if(activeCategory==='all') return true;
   if(activeCategory==='tshirt') return p.category==='T-Shirts';
   if(activeCategory==='shirt') return p.category==='Shirts';
   if(activeCategory==='hoodie') return p.category==='Hoodies';
   return true;
  });

  // Category button definitions
  const categories=[
   {id:'tshirt',label:'T-Shirts'},
   {id:'shirt',label:'Shirts'},
   {id:'hoodie',label:'Hoodies'},
   {id:'all',label:'All Categories'}
  ];

  // Helper to get the display label for a category button
  // Active button shows "All {CategoryName}" format
  const getCategoryLabel=(cat:{id:string;label:string})=>{
   if(cat.id==='all') return 'All Categories';
   return `All ${cat.label}`;
  };

  return (
   <main className="customer-dashboard min-h-screen">
    {/* Sticky header with logo and cart button */}
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d1017]/90 backdrop-blur">
     <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      {/* Brand logo */}
      <div className="flex items-center gap-2.5">
      <span className="brand-logo inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#11141b] font-black text-sm">T</span>
      <span className="brand-name text-xl font-black tracking-[.22em]">TEYRO</span>
     </div>
      {/* Tagline visible on medium and larger screens */}
      <div className="hidden text-sm text-[#aab3c0] md:block">Everyday T-shirts. Nothing extra.</div>
      {/* Cart button */}
      <button className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-[#f8f5ed] transition hover:bg-white/10"><ShoppingBag size={17}/> Cart</button>
     </div>
    </header>

    {/* Page content */}
    <section className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 md:pt-28">
     {/* Decorative glow */}
     <div className="pointer-events-none absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#d8b36a]/5 blur-[100px]"></div>
     <div className="relative">
{/* Page header with dynamic title based on selected category */}
       <div className="mb-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#d8b36a]">Collection</p>
        <h1 className="text-4xl font-black leading-tight text-[#f8f5ed] md:text-5xl">{activeCategory==='all'?'All Categories':activeCategory==='tshirt'?'All T-Shirts':activeCategory==='shirt'?'All Shirts':'All Hoodies'}</h1>
        <p className="mt-3 text-base leading-7 text-[#b7bfca]">{filteredProducts.length} styles available. Pick your favorite and order directly.</p>
       </div>

       {/* Category filter buttons - horizontal row on desktop, scrollable on mobile */}
       <div className="mb-8 flex flex-wrap gap-3">
        {categories.map(cat=>(
         <button
          key={cat.id}
          onClick={()=>setActiveCategory(cat.id)}
          className={`rounded-full px-6 py-3 text-sm font-bold transition ${
           activeCategory===cat.id
            ?'bg-gradient-to-r from-[#d8b36a] to-[#b9873e] text-[#11141b] shadow-lg shadow-[#d8b36a]/20'
            :'border border-white/15 bg-white/5 text-[#f8f5ed] hover:border-[#d8b36a]/50 hover:bg-white/10'
          }`}
         >
          {getCategoryLabel(cat)}
         </button>
        ))}
       </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
       {filteredProducts.map(p=><article key={p.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#151a22] p-3 shadow-lg shadow-black/10 transition hover:border-[#d8b36a]/30 hover:shadow-xl hover:shadow-[#d8b36a]/5">
        {/* Link wrapping product image */}
        <Link href={`/products/${p.id}`} className="block">
         {/* Product image with hover zoom and color badge */}
         <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#242b36] sm:aspect-[3/4]">
          <img src={p.img} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
          <span className="absolute left-3 top-3 rounded-full border border-[#d8b36a]/20 bg-[#d8b36a]/15 px-3 py-1 text-xs font-bold text-[#e8d19a]">{p.color}</span>
         </div>
        </Link>
        {/* Product info */}
        <div className="flex items-start justify-between pt-4">
         <div><h3 className="font-semibold text-[#f8f5ed]">{p.name}</h3><p className="mt-1 text-sm text-[#aab3c0]">S · M · L · XL · XXL</p></div>
         <div className="text-right">{p.discount>0?<><p className="text-xs text-[#8f99a8] line-through">৳{p.price}</p><p className="font-bold text-[#d8b36a]">৳{getDiscountedPrice(p.price,p.discount)}</p><p className="mt-1 text-[10px] font-bold text-emerald-300">{p.discount}% off</p></>:<p className="font-bold text-[#d8b36a]">৳{p.price}</p>}</div>
        </div>
        {/* Order now button */}
        <Link href={`/products/${p.id}`} className="mt-4 flex w-full items-center justify-center rounded-xl border border-[#d8b36a]/40 bg-[#d8b36a]/10 px-4 py-3 text-sm font-bold text-[#e8d19a] transition hover:border-[#d8b36a] hover:bg-[#d8b36a] hover:text-[#11141b]">Order now</Link>
       </article>)}
      </div>
     </div>
    </section>

    {/* Footer with copyright */}
    <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-[#8f99a8]">© 2026 Teyro. Simple T-shirts, simple shopping.</footer>
   </main>
  );
}