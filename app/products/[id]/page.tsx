'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Heart, Minus, Plus, Ruler, ShoppingBag } from 'lucide-react';
import { getDiscountedPrice, getProduct, getProducts, subscribe, sizeChart, sizes, type Product } from '../../product-store';
import { addCustomerOrder, type CustomerOrderItem } from '../../customer-store';

type DeliveryLocation = 'inside-dhaka' | 'outside-dhaka';

const deliveryCharges: Record<DeliveryLocation, number> = {
  'inside-dhaka': 70,
  'outside-dhaka': 150,
};

const pendingItemsKey = 'teyro_pending_order_items';
const customerDraftKey = 'teyro_pending_customer_details';

const dhakaKeywords = ['dhaka', 'ঢাকা', 'mirpur', 'mohammadpur', 'uttara', 'gulshan', 'banani', 'baridhara', 'dhanmondi', 'motijheel', 'farmgate', 'tejgaon', 'bashundhara', 'shyamoli', 'jatrabari', 'demra', 'kazipara', 'old dhaka', 'new market'];
const outsideKeywords = ['outside', 'বাইরে', 'bahir'];

const detectDeliveryLocation = (location: string): DeliveryLocation | null => {
  const normalized = location.trim().toLowerCase();
  if (!normalized) return null;
  if (outsideKeywords.some((keyword) => normalized.includes(keyword))) return 'outside-dhaka';
  if (dhakaKeywords.some((keyword) => normalized.includes(keyword))) return 'inside-dhaka';
  return 'outside-dhaka';
};

const getRelatedProducts = (currentId: number, allProducts: Product[]) =>
  allProducts.filter((p) => p.id !== currentId).slice(0, 2);

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(getProduct(Number(id)));
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [receiverLocation, setReceiverLocation] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [added, setAdded] = useState(false);
  const [itemAdded, setItemAdded] = useState(false);
  const [pendingItems, setPendingItems] = useState<CustomerOrderItem[]>([]);
  const [cart, setCart] = useState(0);

  const returnToHome = () => router.replace('/');

  useEffect(() => {
    const updateProduct = () => setProduct(getProduct(Number(id)));
    const unsubscribe = subscribe(updateProduct);
    updateProduct();
    return unsubscribe;
  }, [id]);

  useEffect(() => {
    const syncCart = () => setCart(Number(window.localStorage.getItem('thread-cart') || 0));
    const syncUpdated = () => syncCart();
    syncCart();
    window.addEventListener('thread-cart-updated', syncUpdated);
    return () => window.removeEventListener('thread-cart-updated', syncUpdated);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(customerDraftKey);
      if (!saved) return;
      const details = JSON.parse(saved) as {
        customerName?: string;
        customerEmail?: string;
        customerPhone?: string;
        receiverLocation?: string;
      };
      setCustomerName(details.customerName || '');
      setCustomerEmail(details.customerEmail || '');
      setCustomerPhone(details.customerPhone || '');
      setReceiverLocation(details.receiverLocation || '');
    } catch {
      window.localStorage.removeItem(customerDraftKey);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(pendingItemsKey);
      if (saved) {
        const items = JSON.parse(saved) as CustomerOrderItem[];
        setPendingItems(items);
        setCart(items.reduce((total, item) => total + item.quantity, 0));
      }
    } catch {
      setPendingItems([]);
    }
  }, []);

  const deliveryLocation = detectDeliveryLocation(receiverLocation);

  const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  };

  if (!product) {
    return (
      <main className="customer-dashboard min-h-screen px-5 py-16">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/8 bg-[#111821]/90 p-8 text-center shadow-[0_24px_60px_rgba(7,10,14,0.35)]">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#e8c27d]">Product not found</p>
          <h1 className="mt-3 text-3xl font-black text-white">This product is unavailable.</h1>
          <Link href="/" className="button-secondary mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold">
            <ArrowLeft size={16} /> Back to collection
          </Link>
        </div>
      </main>
    );
  }

  const discountedPrice = getDiscountedPrice(product.price, product.discount);
  const deliveryCharge = deliveryLocation ? deliveryCharges[deliveryLocation] : 0;
  const currentItem = selectedSize
    ? {
        productId: product.id,
        name: product.name,
        size: selectedSize,
        quantity,
        unitPrice: discountedPrice,
        originalPrice: product.price,
        discount: product.discount,
        image: product.img,
      }
    : null;

  const pendingSubtotal = pendingItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const orderSubtotal = pendingSubtotal + (currentItem?.unitPrice || 0) * (currentItem?.quantity || 0);

  const addProduct = () => {
    if (!currentItem) return;
    const nextItems = [...pendingItems, currentItem];
    window.localStorage.setItem(pendingItemsKey, JSON.stringify(nextItems));
    window.localStorage.setItem('thread-cart', String(nextItems.reduce((total, item) => total + item.quantity, 0)));
    setPendingItems(nextItems);
    window.localStorage.setItem(customerDraftKey, JSON.stringify({ customerName, customerEmail, customerPhone, receiverLocation }));
    setSelectedSize(null);
    setQuantity(1);
    setItemAdded(true);
    setAdded(false);
    window.dispatchEvent(new Event('thread-cart-updated'));
    router.push('/products');
  };

  const addToCart = () => {
    if (!currentItem || !deliveryLocation) return;
    if (!customerName.trim()) return;
    if (!customerPhone.trim()) return;
    if (!customerEmail.trim() || !isValidEmail(customerEmail)) return;

    const orderItems = [...pendingItems, currentItem];
    const finalDeliveryCharge = deliveryCharges[deliveryLocation];

    window.localStorage.setItem(
      'thread-last-order',
      JSON.stringify({
        items: orderItems,
        deliveryLocation,
        receiverLocation,
        subtotal: orderSubtotal,
        deliveryCharge: finalDeliveryCharge,
        total: orderSubtotal + finalDeliveryCharge,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
      }),
    );

    addCustomerOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      receivedLocation: receiverLocation.trim(),
      items: orderItems,
      subtotal: orderSubtotal,
      deliveryCharge: finalDeliveryCharge,
      total: orderSubtotal + finalDeliveryCharge,
    });

    window.localStorage.removeItem(pendingItemsKey);
    window.localStorage.removeItem(customerDraftKey);
    window.localStorage.setItem('thread-cart', '0');
    window.localStorage.removeItem('thread-last-order');
    window.dispatchEvent(new Event('thread-cart-updated'));
    setCart(0);
    setPendingItems([]);
    setSelectedSize(null);
    setQuantity(1);
    setReceiverLocation('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setAdded(true);
  };

  return (
    <main className="customer-dashboard min-h-screen text-[#f5f5f4]">
      <header className="SiteHeader">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <button type="button" onClick={returnToHome} className="flex items-center gap-2 text-sm font-semibold text-[#d7dce3] transition hover:text-[#f5f5f4]">
            <ArrowLeft size={16} /> Collection
          </button>

          <div className="flex items-center gap-2.5">
            <span className="brand-logo inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm">T</span>
            <span className="brand-name text-lg font-black tracking-[0.22em]">TEYRO</span>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-[#f5f5f4]">
            <ShoppingBag size={17} /> Cart ({cart})
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-16">
        <button type="button" onClick={returnToHome} className="button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
          <ArrowLeft size={16} /> Back to collection
        </button>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="mx-auto w-full max-w-[360px] space-y-4">
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-[#e8c27d]/12 blur-3xl" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/8 bg-[#1b2430] shadow-[0_28px_80px_rgba(7,10,14,0.4)]">
                <img key={activeImage} src={product.images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
                <span className="absolute left-4 top-4 rounded-full border border-[#e8c27d]/25 bg-[#0b0d12]/70 px-3 py-1 text-xs font-bold text-[#f3d79b]">
                  {product.color}
                </span>
              </div>
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    onClick={() => setActiveImage(index)}
                    aria-label={`View product image ${index + 1}`}
                    className={`overflow-hidden rounded-2xl border p-1 transition ${
                      activeImage === index ? 'border-[#e8c27d] bg-[#e8c27d]/10' : 'border-white/8 bg-[#111821] hover:border-white/15'
                    }`}
                  >
                    <img src={image} alt={`${product.name} view ${index + 1}`} className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:py-3">
            <p className="section-kicker">{product.color} • New arrival</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">{product.name}</h1>

            <div className="mt-5">
              {product.discount > 0 ? (
                <>
                  <p className="text-sm text-[#8f99a8] line-through">৳{product.price}</p>
                  <p className="text-3xl font-black text-[#e8c27d]">৳{discountedPrice}</p>
                  <p className="mt-1 text-sm font-bold text-[#7ee7b3]">{product.discount}% off</p>
                </>
              ) : (
                <p className="text-3xl font-black text-[#e8c27d]">৳{product.price}</p>
              )}
            </div>

            <p className="mt-5 leading-7 text-[#c3ceda]">{product.description}</p>

            <button type="button" className="button-secondary mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
              <Heart size={15} /> Add to wishlist
            </button>

            <div className="mt-9">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Select size</h2>
                  <p className="mt-1 text-sm text-[#b2becd]">Pick the fit that feels right.</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#e8c27d]/18 bg-[#e8c27d]/8 px-3 py-1.5 text-xs font-bold text-[#f3d79b]">
                  <Ruler size={13} /> Size guide
                </span>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-2">
                {sizes.map((size) => {
                  const measurement = sizeChart[size];
                  const selected = selectedSize === size;
                  return (
                    <button
                      type="button"
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        setAdded(false);
                      }}
                      aria-pressed={selected}
                      className={`rounded-2xl border px-2 py-3 text-sm font-bold transition ${
                        selected
                          ? 'border-[#e8c27d] bg-gradient-to-br from-[#e8c27d] to-[#d39a44] text-[#11141b]'
                          : 'border-white/8 bg-[#111821] text-white hover:border-[#e8c27d]/35'
                      }`}
                    >
                      <span>{size}</span>
                      <span className={`mt-1 block text-[10px] font-semibold ${selected ? 'text-[#2f2519]' : 'text-[#a7b0bf]'}`}>
                        {measurement.chest} cm chest
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Quantity</h2>
                  <p className="mt-1 text-sm text-[#b2becd]">Choose how many you want to order.</p>
                </div>
                <div className="flex items-center rounded-2xl border border-white/8 bg-[#111821]">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="Decrease quantity" className="p-3 text-[#f3d79b] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
                    <Minus size={17} />
                  </button>
                  <span className="w-10 text-center text-sm font-black text-white">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => Math.min(10, value + 1))} disabled={quantity >= 10} aria-label="Increase quantity" className="p-3 text-[#f3d79b] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
                    <Plus size={17} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-white/8 bg-[#111821]/90 p-5 shadow-[0_20px_50px_rgba(7,10,14,0.28)]">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white">Contact information</h2>
                <p className="mt-1 text-sm text-[#b2becd]">We&apos;ll use this to confirm your order.</p>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Name <span className="text-rose-400">*</span></span>
                  <input type="text" value={customerName} onChange={(e) => { setCustomerName(e.target.value); setAdded(false); }} placeholder="e.g. Rahim Ahmed" className="w-full rounded-2xl border border-white/8 bg-[#1a2230] px-4 py-3 text-sm text-white placeholder:text-[#8f99a8] outline-none transition focus:border-[#e8c27d]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Email <span className="text-rose-400">*</span></span>
                  <input type="email" value={customerEmail} onChange={(e) => { setCustomerEmail(e.target.value); setAdded(false); }} placeholder="e.g. you@example.com" className={`w-full rounded-2xl border px-4 py-3 text-sm text-white placeholder:text-[#8f99a8] outline-none transition ${customerEmail && !isValidEmail(customerEmail) ? 'border-rose-400 bg-rose-400/5' : 'border-white/8 bg-[#1a2230] focus:border-[#e8c27d]'}`} />
                  {customerEmail && !isValidEmail(customerEmail) && <p className="mt-2 text-xs text-rose-400">Please enter a valid email address.</p>}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Phone Number <span className="text-rose-400">*</span></span>
                  <input type="tel" value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); setAdded(false); }} placeholder="e.g. 01712345678" className="w-full rounded-2xl border border-white/8 bg-[#1a2230] px-4 py-3 text-sm text-white placeholder:text-[#8f99a8] outline-none transition focus:border-[#e8c27d]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Received Location <span className="text-rose-400">*</span></span>
                  <input value={receiverLocation} onChange={(e) => { setReceiverLocation(e.target.value); setAdded(false); }} placeholder="e.g. Mirpur, Dhaka or Chattogram" list="receiver-location-options" className="w-full rounded-2xl border border-white/8 bg-[#1a2230] px-4 py-3 text-sm text-white placeholder:text-[#8f99a8] outline-none transition focus:border-[#e8c27d]" />
                  <datalist id="receiver-location-options">
                    <option value="Mirpur, Dhaka" />
                    <option value="Uttara, Dhaka" />
                    <option value="Gulshan, Dhaka" />
                    <option value="Outside Dhaka" />
                  </datalist>
                </label>

                <div aria-live="polite" className={`rounded-2xl border p-4 ${deliveryLocation ? 'border-[#e8c27d]/28 bg-[#e8c27d]/8' : 'border-white/8 bg-[#1a2230]'}`}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-[#b2becd]">Detected delivery area</span>
                    <span className="font-bold text-white">{deliveryLocation ? (deliveryLocation === 'inside-dhaka' ? 'Inside Dhaka' : 'Outside Dhaka') : 'Waiting for location'}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                    <span className="text-[#b2becd]">Delivery charge</span>
                    <span className="font-bold text-[#e8c27d]">{deliveryLocation ? `৳${deliveryCharges[deliveryLocation]}` : '৳0'}</span>
                  </div>
                </div>

                <p className="text-xs leading-5 text-[#8f99a8]"><span className="font-bold text-[#e8c27d]">Delivery condition:</span> enter a Dhaka area for ৳70 charge; any other district is ৳150.</p>
              </div>
            </div>

            {pendingItems.length > 0 && (
              <div className="mt-8 rounded-[1.5rem] border border-white/8 bg-[#111821]/80 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-white">Selected products</h2>
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#e8c27d]">{pendingItems.length} added</span>
                </div>
                <div className="mt-4 space-y-2">
                  {pendingItems.map((item, index) => (
                    <div key={`${item.productId}-${item.size}-${index}`} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-[#dce4ef]">{item.name} · {item.size} × {item.quantity}</span>
                      <span className="font-bold text-[#e8c27d]">৳{item.unitPrice * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentItem && (
              <div className="mt-4 rounded-2xl border border-[#e8c27d]/20 bg-[#e8c27d]/8 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#dce4ef]">Current product: {currentItem.name} · {currentItem.size} × {currentItem.quantity}</span>
                  <span className="font-bold text-[#e8c27d]">৳{currentItem.unitPrice * currentItem.quantity}</span>
                </div>
              </div>
            )}

            <div className="mt-9 rounded-[1.75rem] border border-[#e8c27d]/18 bg-[#111821] p-6 shadow-[0_20px_52px_rgba(7,10,14,0.26)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#b2becd]">Product subtotal</span>
                  <span className="font-bold text-white">৳{orderSubtotal}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#b2becd]">Delivery charge</span>
                  <span className="font-bold text-[#e8c27d]">{deliveryLocation ? `৳${deliveryCharge}` : 'Enter location'}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/8 pt-3">
                  <span className="font-bold text-white">Total</span>
                  <span className="text-2xl font-black text-white">৳{orderSubtotal + deliveryCharge}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" disabled={added || !currentItem} onClick={addProduct} className="button-secondary rounded-full px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">
                  Add Product
                </button>
                <Link href="/products" className="button-secondary flex items-center justify-center rounded-full px-4 py-3 text-sm font-bold">
                  Choose another
                </Link>
              </div>

              {itemAdded && <p role="status" className="mt-3 text-center text-sm font-semibold text-[#7ee7b3]">Product added. Choose another product or place your order.</p>}

              <button type="button" disabled={added || !selectedSize || !deliveryLocation || !customerName.trim() || !customerPhone.trim() || !customerEmail.trim() || !isValidEmail(customerEmail)} onClick={addToCart} className="button-primary mt-6 w-full rounded-full px-6 py-4 text-base font-black disabled:cursor-not-allowed disabled:bg-white/6 disabled:text-[#8f99a8] disabled:shadow-none">
                {added ? (
                  <span className="flex items-center justify-center gap-2"><Check size={18} /> Order placed successfully</span>
                ) : (
                  'Place order'
                )}
              </button>

              {added && <p role="status" className="mt-3 text-center text-sm font-semibold text-[#7ee7b3]">Your order was saved. Enter fresh details to place another order.</p>}

              {!selectedSize && <p className="mt-3 text-xs text-[#8f99a8]">Select a size before adding this product to your cart.</p>}
              {selectedSize && !deliveryLocation && <p className="mt-3 text-xs text-[#8f99a8]">Enter the receiver location to calculate delivery.</p>}
              {selectedSize && deliveryLocation && !customerName.trim() && <p className="mt-3 text-xs text-[#8f99a8]">Enter your name to continue.</p>}
              {selectedSize && deliveryLocation && customerName.trim() && !customerPhone.trim() && <p className="mt-3 text-xs text-[#8f99a8]">Enter your phone number to continue.</p>}
              {selectedSize && deliveryLocation && customerName.trim() && customerPhone.trim() && !customerEmail.trim() && <p className="mt-3 text-xs text-[#8f99a8]">Enter your email to continue.</p>}
              {selectedSize && deliveryLocation && customerName.trim() && customerPhone.trim() && customerEmail.trim() && !isValidEmail(customerEmail) && <p className="mt-3 text-xs text-rose-400">Enter a valid email address to continue.</p>}
            </div>
          </div>
        </div>

        <section className="mt-16 rounded-[2rem] border border-white/8 bg-[#111821]/90 p-5 shadow-[0_20px_60px_rgba(7,10,14,0.24)] md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Fit details</p>
              <h2 className="mt-2 text-2xl font-black text-white">Size measurement table</h2>
              <p className="mt-2 text-sm text-[#b2becd]">All measurements are garment measurements in centimeters.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#e8c27d]/18 bg-[#e8c27d]/8 px-3 py-1.5 text-xs font-bold text-[#f3d79b]">
              <Ruler size={13} /> Centimeters
            </span>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/3 text-xs uppercase tracking-[0.12em] text-[#a7b0bf]">
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Chest</th>
                  <th className="px-4 py-3">Length</th>
                  <th className="px-4 py-3">Shoulder</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map((size) => {
                  const measurement = sizeChart[size];
                  const selected = selectedSize === size;
                  return (
                    <tr key={size} className={`border-b border-white/8 last:border-0 ${selected ? 'bg-[#e8c27d]/8 text-white' : 'bg-[#111821] text-[#dce4ef]'}`}>
                      <td className="px-4 py-3 font-bold">{size}</td>
                      <td className="px-4 py-3">{measurement.chest} cm</td>
                      <td className="px-4 py-3">{measurement.length} cm</td>
                      <td className="px-4 py-3">{measurement.shoulder} cm</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="rounded-[2rem] border border-white/8 bg-[#111821]/85 p-6 shadow-[0_20px_60px_rgba(7,10,14,0.26)] md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Recommended</p>
              <h2 className="mt-2 text-2xl font-black text-white">You might also like</h2>
            </div>
            <Link href="/products" className="text-xs font-bold uppercase tracking-[0.18em] text-[#e8c27d] transition hover:text-[#f5dca4]">
              View all
            </Link>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {getRelatedProducts(Number(id), getProducts()).map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group product-card">
                <div className="relative aspect-square overflow-hidden bg-[#1b2430]">
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                  <span className="product-card-badge">{p.color}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <p className="mt-1 text-sm text-[#9aa5b5]">S · M · L · XL · XXL</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      {p.discount > 0 ? (
                        <>
                          <p className="text-xs text-[#7f8aa0] line-through">৳{p.price}</p>
                          <p className="font-black text-[#e8c27d]">৳{getDiscountedPrice(p.price, p.discount)}</p>
                        </>
                      ) : (
                        <p className="font-black text-[#e8c27d]">৳{p.price}</p>
                      )}
                    </div>
                    <span className="rounded-full border border-[#e8c27d]/20 bg-[#e8c27d]/8 px-3 py-1.5 text-xs font-bold text-[#f3d79b]">Shop now</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 px-5 py-8 text-center text-xs uppercase tracking-[0.18em] text-[#99a4b5]">
        © 2026 Teyro. Everyday essentials.
      </footer>
    </main>
  );
}
