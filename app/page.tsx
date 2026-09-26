'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { CustomerAuthPanel, CustomerDashboard } from './customer-account';
import { getDiscountedPrice, getProducts, subscribe } from './product-store';
import ImageStreamHero from '@/components/ui/image-stream-hero';

const discountReturnKey = 'teyro_discount_product_return';

export default function Home() {
  const [cart, setCart] = useState(0);
  const [products, setProducts] = useState(getProducts());
  const [searchTerm, setSearchTerm] = useState('');
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);

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
  const visibleProducts = showDiscountedOnly
    ? filteredProducts.filter((product) => product.discount > 0)
    : filteredProducts;

  const toggleDiscountedProducts = () => {
    setShowDiscountedOnly((current) => !current);
    window.requestAnimationFrame(() => {
      document.getElementById('collection')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    });
  };

  const markDiscountProductNavigation = () => {
    if (showDiscountedOnly) {
      window.sessionStorage.setItem(discountReturnKey, 'true');
    }
  };

  useEffect(() => {
    const syncCart = () => setCart(Number(window.localStorage.getItem('thread-cart') || 0));
    const syncUpdated = () => syncCart();
    syncCart();
    window.addEventListener('thread-cart-updated', syncUpdated);
    return () => window.removeEventListener('thread-cart-updated', syncUpdated);
  }, []);

  useEffect(() => {
    const updateProducts = () => setProducts(getProducts());
    const unsubscribe = subscribe(updateProducts);
    updateProducts();
    return unsubscribe;
  }, []);

  useEffect(() => {
    const resetDiscountReturn = () => {
      const cameFromDiscount =
        new URLSearchParams(window.location.search).get('from') === 'discount' ||
        window.sessionStorage.getItem(discountReturnKey) === 'true';
      if (!cameFromDiscount) return;

      window.sessionStorage.removeItem(discountReturnKey);
      setShowDiscountedOnly(false);
      window.history.replaceState(window.history.state, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    resetDiscountReturn();
    window.addEventListener('pageshow', resetDiscountReturn);
    window.addEventListener('popstate', resetDiscountReturn);
    return () => {
      window.removeEventListener('pageshow', resetDiscountReturn);
      window.removeEventListener('popstate', resetDiscountReturn);
    };
  }, []);

  return (
    <main className="customer-dashboard min-h-screen text-[#f5f5f4]">
      <div className="customer-upper-section">
        <header className="SiteHeader">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-4 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="brand-logo inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm">T</span>
              <span className="brand-name text-lg font-black tracking-[0.22em]">TEYRO</span>
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
              <Link href="/" className="nav-link">Home</Link>
              <Link href="/products" className="nav-link">Collection</Link>
              <Link href="/products?filter=new-arrivals" className="nav-link">New Arrivals</Link>
            </nav>

            <div className="hidden flex-1 justify-center md:flex">
              <label className="flex w-full max-w-md items-center gap-2 rounded-full border border-white/10 bg-white/3 px-4 py-2.5 text-[#d1d6df] shadow-inner shadow-black/10">
                <Search size={16} className="text-[#e8c27d]" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search T-shirts"
                  aria-label="Search products"
                  className="w-full bg-transparent text-sm text-[#f5f5f4] placeholder:text-[#8e97a5] outline-none"
                />
              </label>
            </div>

            <div className="ml-auto flex items-center gap-2.5">
              <button className="button-secondary hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold md:inline-flex">
                <ShoppingBag size={16} /> Cart ({cart})
              </button>
              <CustomerAuthPanel />
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-5 pb-4 md:hidden">
            <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-4 py-2.5 text-[#d1d6df] shadow-inner shadow-black/10">
              <Search size={16} className="text-[#e8c27d]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search T-shirts"
                aria-label="Search products"
                className="w-full bg-transparent text-sm text-[#f5f5f4] placeholder:text-[#8e97a5] outline-none"
              />
            </label>
          </div>
        </header>

        <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-8 md:px-8 lg:pb-20 lg:pt-12">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="section-kicker">New season / 2026</div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/3 px-3 py-1.5 text-xs font-medium text-[#d9dfeb]">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#7ee7b3]" />
              Free shipping in Dhaka on orders above ৳1,500
            </div>
          </div>

          <ImageStreamHero
            images={products.map((product) => ({
              src: product.img,
              alt: product.name,
            }))}
            cards={7}
            speed={18}
            axis={56}
            imageArea={{ top: '28%', bottom: '28%' }}
            className="min-h-[680px] w-full rounded-3xl border-2 border-[#e8c27d]/70 bg-[#0d1117] shadow-[0_0_36px_rgba(232,194,125,0.12)] sm:min-h-[640px] lg:min-h-[620px]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[#080b10]/65" />
            <div className="dusing-content relative z-10 flex min-h-[680px] w-full flex-col items-center justify-between gap-12 px-6 pt-10 pb-6 text-center sm:min-h-[640px] sm:px-10 sm:pt-12 sm:pb-8 lg:min-h-[620px] lg:px-16">
              <div className="w-full space-y-5">
                <span className="inline-flex rounded-full border border-[#e8c27d]/40 bg-[#0d1117]/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#efd49a]">
                  Everyday essentials
                </span>
                <h1 className="mx-auto max-w-4xl text-xl font-black leading-tight text-white sm:text-3xl lg:text-4xl">
                  Total comfort.
                  <span className="block text-[#e8c27d]">Made to wear daily.</span>
                </h1>
              </div>

              <div className="w-full max-w-2xl space-y-6">
                <p className="mx-auto text-sm leading-7 text-[#e0e4eb] sm:text-base">
                  Thoughtful everyday staples with premium feel, soft fabric, and a smarter fit for whatever your day brings.
                </p>
                <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/products" className="button-primary inline-flex w-full max-w-[240px] items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold sm:w-auto">
                    Shop collection <ArrowRight size={16} />
                  </Link>
                  <button
                    type="button"
                    aria-pressed={showDiscountedOnly}
                    onClick={toggleDiscountedProducts}
                    className="button-primary inline-flex w-full max-w-[240px] items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold sm:w-auto"
                  >
                    Discount
                  </button>
                </div>
              </div>
            </div>
          </ImageStreamHero>
        </section>
      </div>

      <CustomerDashboard />

      <section id="collection" className="mx-auto max-w-7xl px-5 pb-24 pt-16 md:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">Collection</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
              {showDiscountedOnly ? 'Discounted products' : 'Best sellers'}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/2 px-3 py-1.5 text-sm text-[#c7d0dd]">
              {visibleProducts.length} {showDiscountedOnly ? 'discounted styles' : 'styles available'}
            </div>
            {showDiscountedOnly && (
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}
          </div>
        </div>

        {visibleProducts.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 text-center text-[#c7d0dd]">
            {showDiscountedOnly ? 'No discounted products found' : 'No products found'}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {visibleProducts.map((p) => (
              <article key={p.id} className="product-card group">
                <Link href={`/products/${p.id}${showDiscountedOnly ? '?from=discount' : ''}`} onClick={markDiscountProductNavigation} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#1b2430]">
                    <img src={p.img} alt={p.name} className="absolute inset-0 m-auto h-[88%] w-[88%] object-cover" />
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
                          <p className="text-xs text-[#7c8697] line-through">৳{p.price}</p>
                          <p className="font-black text-[#e8c27d]">৳{getDiscountedPrice(p.price, p.discount)}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7ee7b3]">{p.discount}% off</p>
                        </>
                      ) : (
                        <p className="font-black text-[#e8c27d]">৳{p.price}</p>
                      )}
                    </div>
                  </div>

                  <Link href={`/products/${p.id}${showDiscountedOnly ? '?from=discount' : ''}`} onClick={markDiscountProductNavigation} className="button-primary flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-bold">
                    Order now
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link href="/products" className="button-primary inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-bold">
            View all styles <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/8 px-5 py-8 text-center text-xs uppercase tracking-[0.18em] text-[#99a4b5]">
        © 2026 Teyro. Everyday essentials.
      </footer>
    </main>
  );
}