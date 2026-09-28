'use client';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDiscountedPrice, getProducts, subscribe } from '../product-store';

const NEW_ARRIVAL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

// Collection page with category selection and an optional rolling 14-day arrival filter.
export default function ProductsPage() {
  const [products, setProducts] = useState(getProducts());
  const [activeCategory, setActiveCategory] = useState('all');
  const [newArrivalOnly, setNewArrivalOnly] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Reflect product additions and edits made elsewhere through the shared store.
  useEffect(() => {
    const updateProducts = () => setProducts(getProducts());
    const unsubscribe = subscribe(updateProducts);
    updateProducts();
    return unsubscribe;
  }, []);

  // Read the new-arrivals filter from navigation query parameters on first render.
  useEffect(() => {
    setNewArrivalOnly(new URLSearchParams(window.location.search).get('filter') === 'new-arrivals');
  }, []);

  // Schedule a refresh at the next product's 14-day cutoff so arrivals expire on time.
  useEffect(() => {
    if (!newArrivalOnly) return;

    const currentTime = Date.now();
    const nextExpiration = products.reduce((earliest, product) => {
      const createdAt = Date.parse(product.createdAt ?? '');
      if (!Number.isFinite(createdAt)) return earliest;

      const expiration = createdAt + NEW_ARRIVAL_WINDOW_MS;
      return expiration > currentTime ? Math.min(earliest, expiration) : earliest;
    }, Number.POSITIVE_INFINITY);

    if (!Number.isFinite(nextExpiration)) return;

    const timeoutId = window.setTimeout(
      () => setNow(Date.now()),
      Math.max(0, nextExpiration - currentTime) + 1,
    );
    return () => window.clearTimeout(timeoutId);
  }, [newArrivalOnly, now, products]);

  // Apply the date window first, then narrow the remaining products by category.
  const filteredProducts = products.filter((p) => {
    if (newArrivalOnly) {
      const createdAt = Date.parse(p.createdAt ?? '');
      if (!Number.isFinite(createdAt) || createdAt > now || now - createdAt >= NEW_ARRIVAL_WINDOW_MS) {
        return false;
      }
    }
    if (activeCategory === 'all') return true;
    if (activeCategory === 'tshirt') return p.category === 'T-Shirts';
    if (activeCategory === 'shirt') return p.category === 'Shirts';
    if (activeCategory === 'hoodie') return p.category === 'Hoodies';
    return true;
  });

  // The same category definitions drive the selector buttons and their labels.
  const categories = [
    { id: 'tshirt', label: 'T-Shirts' },
    { id: 'shirt', label: 'Shirts' },
    { id: 'hoodie', label: 'Hoodies' },
    { id: 'all', label: 'All Categories' },
  ];

  const getCategoryLabel = (cat: { id: string; label: string }) =>
    cat.id === 'all' ? 'All Categories' : `All ${cat.label}`;

  return (
    <main className="customer-dashboard min-h-screen text-[#f5f5f4]">
      {/* Shared storefront navigation and cart summary. */}
      <header className="SiteHeader">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="brand-logo inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm">T</span>
              <span className="brand-name text-lg font-black tracking-[0.22em]">TEYRO</span>
            </Link>
          </div>
          <div className="hidden text-sm text-[#b4becf] md:block">Everyday basics done right.</div>
          <button className="button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
            <ShoppingBag size={16} /> Cart
          </button>
        </div>
      </header>

      {/* Collection heading, filter controls, empty state, and product listing. */}
      <section className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 md:px-8 md:pt-20">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#e8c27d]/8 blur-[100px]" />
        <div className="relative">
          <div className="mb-10">
            <p className="section-kicker">Collection</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">
              {newArrivalOnly
                ? 'New Arrivals'
                : activeCategory === 'all'
                ? 'All categories'
                : activeCategory === 'tshirt'
                  ? 'All T-Shirts'
                  : activeCategory === 'shirt'
                    ? 'All Shirts'
                    : 'All Hoodies'}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-[#bec8d6]">
              {filteredProducts.length} {newArrivalOnly ? 'new arrivals' : 'styles available'}. Pick your everyday favorite and order directly.
            </p>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                  activeCategory === cat.id
                    ? 'button-primary text-[#11141b]'
                    : 'button-secondary'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {newArrivalOnly && filteredProducts.length === 0 ? (
            <div className="glass-panel rounded-3xl p-10 text-center text-[#c7d0dd]">
              No products were added in the last 14 days.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map((p) => (
                <article key={p.id} className="product-card group">
                  <Link href={`/products/${p.id}`} className="block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#1b2430]">
                      <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                      <span className="product-card-badge">{p.color}</span>
                    </div>
                  </Link>

                  <div className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{p.name}</h3>
                        <p className="mt-1 text-sm text-[#9aa5b5]">S · M · L · XL · XXL</p>
                      </div>
                      <div className="text-right">
                        {p.discount > 0 ? (
                          <>
                            <p className="text-xs text-[#7f8aa0] line-through">৳{p.price}</p>
                            <p className="font-black text-[#e8c27d]">৳{getDiscountedPrice(p.price, p.discount)}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7ee7b3]">{p.discount}% off</p>
                          </>
                        ) : (
                          <p className="font-black text-[#e8c27d]">৳{p.price}</p>
                        )}
                      </div>
                    </div>

                    <Link href={`/products/${p.id}`} className="button-primary flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-bold">
                      Order now
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-white/8 px-5 py-8 text-center text-xs uppercase tracking-[0.18em] text-[#99a4b5]">
        © 2026 Teyro. Everyday essentials.
      </footer>
    </main>
  );
}