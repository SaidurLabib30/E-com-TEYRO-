// Marks this component as a client-side React component (enables hooks and interactivity)
'use client';

// React hooks for state management and side effects
import { useEffect,useState } from 'react';

// Next.js Link component for client-side navigation
import Link from 'next/link';

// useParams hook to access dynamic route parameters (product id)
import { useParams, useRouter } from 'next/navigation';

// Icons from lucide-react for UI elements
import { ArrowLeft, Check, Heart, Minus, Plus, Ruler, ShoppingBag } from 'lucide-react';

// Import product store, size chart data, and sizes list from shared product store
import { getDiscountedPrice, getProduct, getProducts, subscribe, sizeChart, sizes, type Product } from '../../product-store';
import { addCustomerOrder, type CustomerOrderItem } from '../../customer-store';

// Type for delivery location: either inside Dhaka or outside Dhaka
type DeliveryLocation = 'inside-dhaka' | 'outside-dhaka';

// Delivery charge rates for each location type
const deliveryCharges: Record<DeliveryLocation,number> = {
 'inside-dhaka':70,
 'outside-dhaka':150
};
const pendingItemsKey='teyro_pending_order_items';
const customerDraftKey='teyro_pending_customer_details';

// Keywords used to detect if the delivery location is inside Dhaka (includes Bangla and English names)
const dhakaKeywords = ['dhaka','ঢাকা','mirpur','mohammadpur','uttara','gulshan','banani','baridhara','dhanmondi','motijheel','farmgate','tejgaon','bashundhara','shyamoli','jatrabari','demra','kazipara','old dhaka','new market'];
// Keywords used to detect if the delivery location is outside Dhaka
const outsideKeywords = ['outside','বাইরে','bahir'];

// Detects whether the delivery location is inside or outside Dhaka based on keyword matching
const detectDeliveryLocation=(location:string):DeliveryLocation|null=>{
 const normalized=location.trim().toLowerCase();
 if(!normalized) return null;
 if(outsideKeywords.some(keyword=>normalized.includes(keyword))) return 'outside-dhaka';
 if(dhakaKeywords.some(keyword=>normalized.includes(keyword))) return 'inside-dhaka';
 return 'outside-dhaka';
};

// Select 2 related products for the recommendation section (excludes current product)
const getRelatedProducts=(currentId:number,allProducts:Product[])=>allProducts.filter(p=>p.id!==currentId).slice(0,2);

// Product detail page: displays a single product with size selection, quantity, delivery info, and add to cart
export default function ProductPage(){
  // Extract the product id from the URL route parameter
  const {id}=useParams();
  const router=useRouter();
  // Find the matching product from the catalog, or undefined if not found
  // Uses state so the page updates when products change in the store
  const [product,setProduct]=useState(getProduct(Number(id)));
  
  // Subscribe to product store changes so the page updates if the product is modified/deleted
  useEffect(()=>{
   const updateProduct=()=>setProduct(getProduct(Number(id)));
   const unsubscribe=subscribe(updateProduct);
   updateProduct();
   return unsubscribe;
  },[id]);

  // Tracks which product image is currently displayed as the main image
  const [activeImage,setActiveImage]=useState(0);
  // Tracks the selected size for the product
  const [selectedSize,setSelectedSize]=useState<'S'|'M'|'L'|'XL'|'XXL'|null>(null);
  // Tracks the quantity of the product to order
  const [quantity,setQuantity]=useState(1);
  // Stores the receiver's delivery location input text
  const [receiverLocation,setReceiverLocation]=useState('');
  // Stores the customer's name
  const [customerName,setCustomerName]=useState('');
  // Stores the customer's phone number
  const [customerPhone,setCustomerPhone]=useState('');
  // Stores the customer's email address
  const [customerEmail,setCustomerEmail]=useState('');
  // Tracks whether the product was successfully added to cart (for UI feedback)
  const [added,setAdded]=useState(false);
  const [itemAdded,setItemAdded]=useState(false);
  const [pendingItems,setPendingItems]=useState<CustomerOrderItem[]>([]);
  // Tracks the current cart item count from localStorage
  const [cart,setCart]=useState(0);
  // Auto-detects delivery location based on receiver input
  const deliveryLocation=detectDeliveryLocation(receiverLocation);
  // Validates email format using a simple regex
  const isValidEmail=(email:string):boolean=>{
   const regex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   return regex.test(email.trim());
  };

 // Sync cart count from localStorage on mount and listen for cart update events
 useEffect(()=>{
  // Read cart count from localStorage and update state
  const syncCart=()=>setCart(Number(window.localStorage.getItem('thread-cart')||0));
  // Re-sync cart when custom event is dispatched
  const syncUpdated=()=>syncCart();
  syncCart();
  window.addEventListener('thread-cart-updated',syncUpdated);
  // Remove event listener on unmount
  return ()=>window.removeEventListener('thread-cart-updated',syncUpdated);
 },[]);

 useEffect(()=>{
  try{
   const saved=window.localStorage.getItem(customerDraftKey);
   if(!saved) return;
   const details=JSON.parse(saved) as {customerName?:string;customerEmail?:string;customerPhone?:string;receiverLocation?:string};
   setCustomerName(details.customerName||'');
   setCustomerEmail(details.customerEmail||'');
   setCustomerPhone(details.customerPhone||'');
   setReceiverLocation(details.receiverLocation||'');
  }catch{
   window.localStorage.removeItem(customerDraftKey);
  }
 },[]);

 useEffect(()=>{
  try{
   const saved=window.localStorage.getItem(pendingItemsKey);
   if(saved){
    const items=JSON.parse(saved) as CustomerOrderItem[];
    setPendingItems(items);
    setCart(items.reduce((total,item)=>total+item.quantity,0));
   }
  }catch{
   setPendingItems([]);
  }
 },[]);

 // If no product matches the id, show a "product not found" error page
 if(!product){
  return (
   <main className="customer-dashboard min-h-screen px-5 py-16">
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#151a22] p-8 text-center">
     <p className="text-sm font-bold text-[#d8b36a]">Product not found</p>
     <h1 className="mt-3 text-3xl font-black text-[#f8f5ed]">This product is unavailable.</h1>
     {/* Link to go back to the collection page */}
     <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#d8b36a]/40 px-5 py-3 text-sm font-bold text-[#e8d19a] transition hover:bg-[#d8b36a] hover:text-[#11141b]"><ArrowLeft size={16}/> Back to collection</Link>
    </div>
   </main>
  );
 }

 const discountedPrice=getDiscountedPrice(product.price,product.discount);
 const subtotal=discountedPrice*quantity;
 const deliveryCharge=deliveryLocation?deliveryCharges[deliveryLocation]:0;
 const currentItem=selectedSize?{ productId:product.id, name:product.name, size:selectedSize, quantity, unitPrice:discountedPrice, originalPrice:product.price, discount:product.discount, image:product.img }:null;
 const pendingSubtotal=pendingItems.reduce((total,item)=>total+item.unitPrice*item.quantity,0);
 const orderSubtotal=pendingSubtotal+(currentItem?.unitPrice||0)*(currentItem?.quantity||0);

 const addProduct=()=>{
    if(!currentItem) return;
    const nextItems=[...pendingItems,currentItem];
    window.localStorage.setItem(pendingItemsKey,JSON.stringify(nextItems));
    window.localStorage.setItem('thread-cart',String(nextItems.reduce((total,item)=>total+item.quantity,0)));
    setPendingItems(nextItems);
    window.localStorage.setItem(customerDraftKey,JSON.stringify({customerName,customerEmail,customerPhone,receiverLocation}));
    setSelectedSize(null);
    setQuantity(1);
    setItemAdded(true);
    setAdded(false);
    window.dispatchEvent(new Event('thread-cart-updated'));
    router.push('/products');
  };

// Places the current product and any pending products as one order.
  const addToCart=()=>{
    if(!currentItem||!deliveryLocation) return;
    // Validate customer name (required)
    if(!customerName.trim()) return;
    // Validate phone number (required)
    if(!customerPhone.trim()) return;
    // Validate email (required and valid format)
    if(!customerEmail.trim()||!isValidEmail(customerEmail)) return;
    const deliveryCharge=deliveryCharges[deliveryLocation];
    const orderItems=[...pendingItems,currentItem];
    // Save the last order details for order confirmation/summary
    window.localStorage.setItem('thread-last-order',JSON.stringify({items:orderItems,deliveryLocation,receiverLocation,subtotal:orderSubtotal,deliveryCharge,total:orderSubtotal+deliveryCharge,customerName:customerName.trim(),customerPhone:customerPhone.trim(),customerEmail:customerEmail.trim()}));
    addCustomerOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      receivedLocation: receiverLocation.trim(),
      items: orderItems,
      subtotal: orderSubtotal,
      deliveryCharge,
      total: orderSubtotal + deliveryCharge,
    });
    window.localStorage.removeItem(pendingItemsKey);
    window.localStorage.removeItem(customerDraftKey);
    window.localStorage.setItem('thread-cart','0');
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
  <main className="customer-dashboard min-h-screen">
   {/* Sticky header with back link, brand logo, and cart indicator */}
   <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d1017]/90 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
     {/* Back link to the collection page */}
     <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[#aab3c0] transition hover:text-[#e8d19a]"><ArrowLeft size={16}/> Collection</Link>
     {/* Brand logo */}
     <div className="flex items-center gap-2.5">
      <span className="brand-logo inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#11141b] font-black text-sm">T</span>
      <span className="brand-name text-lg font-black tracking-[.22em]">TEYRO</span>
     </div>
     {/* Cart indicator showing item count */}
     <div className="flex items-center gap-2 text-sm font-semibold text-[#f8f5ed]"><ShoppingBag size={17}/> Cart ({cart})</div>
    </div>
   </header>

   {/* Main product detail section: image gallery on left, product info on right */}
   <section className="mx-auto max-w-6xl px-5 py-10 md:py-16">
    {/* Back to collection link */}
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#aab3c0] transition hover:text-[#e8d19a]"><ArrowLeft size={16}/> Back to collection</Link>

    {/* Two-column grid layout: images (left) and details (right) */}
    <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.05fr_.95fr]">
     {/* Left column: product images */}
     <div className="space-y-4">
{/* Main product image display with decorative glow */}
      <div className="relative">
       {/* Decorative glow behind image */}
       <div className="absolute -inset-4 rounded-[2rem] bg-[#d8b36a]/10 blur-3xl"></div>
       <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 bg-[#242b36] shadow-xl shadow-black/20">
        <img key={activeImage} src={product.images[activeImage]} alt={product.name} className="h-full w-full object-cover"/>
        <span className="absolute left-4 top-4 rounded-full border border-[#d8b36a]/20 bg-[#0d1017]/80 px-3 py-1 text-xs font-bold text-[#e8d19a]">{product.color}</span>
       </div>
      </div>
      {/* Thumbnail gallery shown only if the product has more than one image */}
      {product.images.length>1&&
       <div className="grid grid-cols-4 gap-3">
        {product.images.map((image,index)=>(
         <button type="button" key={`${image}-${index}`} onClick={()=>setActiveImage(index)} aria-label={`View product image ${index+1}`} className={`overflow-hidden rounded-xl border p-1 transition ${activeImage===index?'border-[#d8b36a] bg-[#d8b36a]/10':'border-white/10 bg-[#151a22] hover:border-white/30'}`}>
          <img src={image} alt={`${product.name} view ${index+1}`} className="aspect-square w-full object-cover"/>
         </button>
        ))}
       </div>
      }
     </div>

     {/* Right column: product details */}
     <div className="lg:py-4">
      {/* Product color and new arrival label */}
      <p className="text-xs font-bold uppercase tracking-[.25em] text-[#d8b36a]">{product.color} · New arrival</p>
      {/* Product name heading */}
      <h1 className="mt-3 text-4xl font-black leading-tight text-[#f8f5ed] md:text-5xl">{product.name}</h1>
      {/* Product price in Bangladeshi Taka */}
      <div className="mt-4">{product.discount>0?<><p className="text-sm text-[#8f99a8] line-through">৳{product.price}</p><p className="text-2xl font-black text-[#e8d19a]">৳{discountedPrice}</p><p className="mt-1 text-sm font-bold text-emerald-300">{product.discount}% off</p></>:<p className="text-2xl font-black text-[#e8d19a]">৳{product.price}</p>}</div>
      {/* Product description */}
      <p className="mt-5 leading-7 text-[#aab3c0]">{product.description}</p>
      {/* Wishlist button */}
      <button type="button" className="mt-5 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-[#f8f5ed] transition hover:border-rose-300/40 hover:text-rose-300"><Heart size={15}/> Add to Wishlist</button>

      {/* Size selection section */}
      <div className="mt-9">
       <div className="flex items-end justify-between gap-4">
        <div><h2 className="font-bold text-[#f8f5ed]">Select size</h2><p className="mt-1 text-sm text-[#aab3c0]">Pick the fit that feels right.</p></div>
        {/* Size guide reference link */}
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#d8b36a]/10 px-3 py-1.5 text-xs font-bold text-[#e8d19a]"><Ruler size={13}/> Size guide</span>
       </div>
       {/* Size buttons grid: S, M, L, XL, XXL with chest measurement labels */}
       <div className="mt-4 grid grid-cols-5 gap-2">
        {sizes.map(size=>{
         const measurement=sizeChart[size];
         const selected=selectedSize===size;
         return (
          <button type="button" key={size} onClick={()=>{setSelectedSize(size);setAdded(false);}} aria-pressed={selected} className={`rounded-xl border px-2 py-3 text-sm font-bold transition ${selected?'border-[#d8b36a] bg-gradient-to-br from-[#d8b36a] to-[#b9873e] text-[#11141b]':'border-white/15 bg-[#1d2430] text-[#f8f5ed] hover:border-[#d8b36a]/50'}`}>
           <span>{size}</span>
           <span className={`mt-1 block text-[10px] font-semibold ${selected?'text-[#2c2415]':'text-[#aab3c0]'}`}>{measurement.chest} cm chest</span>
          </button>
         );
        })}
       </div>
      </div>

      {/* Quantity selector section with increment/decrement buttons */}
      <div className="mt-8">
       <div className="flex items-end justify-between gap-4">
        <div><h2 className="font-bold text-[#f8f5ed]">Quantity</h2><p className="mt-1 text-sm text-[#aab3c0]">Choose how many you want to order.</p></div>
        {/* Quantity controls: minus, display, plus */}
        <div className="flex items-center rounded-xl border border-white/15 bg-[#1d2430]">
         <button type="button" onClick={()=>setQuantity(value=>Math.max(1,value-1))} disabled={quantity<=1} aria-label="Decrease quantity" className="p-3 text-[#e8d19a] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><Minus size={17}/></button>
         <span className="w-10 text-center text-sm font-black text-[#f8f5ed]">{quantity}</span>
         <button type="button" onClick={()=>setQuantity(value=>Math.min(10,value+1))} disabled={quantity>=10} aria-label="Increase quantity" className="p-3 text-[#e8d19a] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><Plus size={17}/></button>
        </div>
       </div>
      </div>

       {/* Customer contact information section */}
       <div className="mt-8 rounded-2xl border border-white/10 bg-[#151a22] p-5 shadow-lg shadow-black/10">
        <div className="mb-4">
         <h2 className="font-bold text-[#f8f5ed]">Contact information</h2>
         <p className="mt-1 text-sm text-[#aab3c0]">We'll use this to confirm your order.</p>
        </div>
        <div className="space-y-4">
          <label className="block">
           <span className="mb-2 block text-sm font-semibold text-[#f8f5ed]">Name <span className="text-rose-400">*</span></span>
           <input type="text" value={customerName} onChange={e=>{setCustomerName(e.target.value);setAdded(false);}} placeholder="e.g. Rahim Ahmed" className="w-full rounded-xl border border-white/15 bg-[#1d2430] px-4 py-3 text-sm text-[#f8f5ed] placeholder:text-[#8f99a8] outline-none transition focus:border-[#d8b36a]"/>
          </label>
          <label className="block">
           <span className="mb-2 block text-sm font-semibold text-[#f8f5ed]">Email <span className="text-rose-400">*</span></span>
           <input type="email" value={customerEmail} onChange={e=>{setCustomerEmail(e.target.value);setAdded(false);}} placeholder="e.g. you@example.com" className={`w-full rounded-xl border px-4 py-3 text-sm text-[#f8f5ed] placeholder:text-[#8f99a8] outline-none transition ${customerEmail&&!isValidEmail(customerEmail)?'border-rose-400 bg-rose-400/5':'border-white/15 bg-[#1d2430] focus:border-[#d8b36a]'}`}/>
           {customerEmail&&!isValidEmail(customerEmail)&&<p className="mt-2 text-xs text-rose-400">Please enter a valid email address.</p>}
          </label>
          <label className="block">
           <span className="mb-2 block text-sm font-semibold text-[#f8f5ed]">Phone Number <span className="text-rose-400">*</span></span>
           <input type="tel" value={customerPhone} onChange={e=>{setCustomerPhone(e.target.value);setAdded(false);}} placeholder="e.g. 01712345678" className="w-full rounded-xl border border-white/15 bg-[#1d2430] px-4 py-3 text-sm text-[#f8f5ed] placeholder:text-[#8f99a8] outline-none transition focus:border-[#d8b36a]"/>
          </label>
          <label className="block">
           <span className="mb-2 block text-sm font-semibold text-[#f8f5ed]">Received Location <span className="text-rose-400">*</span></span>
           <input value={receiverLocation} onChange={e=>{setReceiverLocation(e.target.value);setAdded(false);}} placeholder="e.g. Mirpur, Dhaka or Chattogram" list="receiver-location-options" className="w-full rounded-xl border border-white/15 bg-[#1d2430] px-4 py-3 text-sm text-[#f8f5ed] placeholder:text-[#8f99a8] outline-none transition focus:border-[#d8b36a]"/>
           <datalist id="receiver-location-options">
            <option value="Mirpur, Dhaka"/>
            <option value="Uttara, Dhaka"/>
            <option value="Gulshan, Dhaka"/>
            <option value="Outside Dhaka"/>
           </datalist>
          </label>
          <div aria-live="polite" className={`rounded-xl border p-4 ${deliveryLocation?'border-[#d8b36a]/30 bg-[#d8b36a]/5':'border-white/10 bg-[#1d2430]'}`}>
           <div className="flex items-center justify-between gap-4 text-sm"><span className="text-[#aab3c0]">Detected delivery area</span><span className="font-bold text-[#f8f5ed]">{deliveryLocation?(deliveryLocation==='inside-dhaka'?'Inside Dhaka':'Outside Dhaka'):'Waiting for location'}</span></div>
           <div className="mt-2 flex items-center justify-between gap-4 text-sm"><span className="text-[#aab3c0]">Delivery charge</span><span className="font-bold text-[#e8d19a]">{deliveryLocation?`৳${deliveryCharges[deliveryLocation]}`:'৳0'}</span></div>
          </div>
          <p className="text-xs leading-5 text-[#8f99a8]"><span className="font-bold text-[#d8b36a]">Delivery condition:</span> enter a Dhaka area for ৳70 charge; any other district is ৳150.</p>
         </div>
       </div>

      {pendingItems.length>0&&<div className="mt-8 rounded-2xl border border-white/10 bg-[#151a22] p-5">
       <div className="flex items-center justify-between gap-4"><h2 className="font-bold text-[#f8f5ed]">Selected products</h2><span className="text-xs font-bold text-[#e8d19a]">{pendingItems.length} added</span></div>
       <div className="mt-4 space-y-2">{pendingItems.map((item,index)=><div key={`${item.productId}-${item.size}-${index}`} className="flex items-center justify-between gap-4 text-sm"><span className="text-[#d7dce3]">{item.name} · {item.size} × {item.quantity}</span><span className="font-bold text-[#e8d19a]">৳{item.unitPrice*item.quantity}</span></div>)}</div>
       <p className="mt-3 text-xs text-[#8f99a8]">Add another product or place this combined order. Delivery is charged once.</p>
      </div>}

      {currentItem&&<div className="mt-4 rounded-xl border border-[#d8b36a]/20 bg-[#d8b36a]/5 px-4 py-3 text-sm"><div className="flex items-center justify-between gap-4"><span className="text-[#d7dce3]">Current product: {currentItem.name} · {currentItem.size} × {currentItem.quantity}</span><span className="font-bold text-[#e8d19a]">৳{currentItem.unitPrice*currentItem.quantity}</span></div></div>}

      {/* Order summary and add to cart section */}
      <div className="mt-9 rounded-2xl border border-[#d8b36a]/20 bg-[#1d2430] p-6 shadow-xl shadow-[#d8b36a]/5">
       {/* Line items: subtotal and delivery charge */}
       <div className="space-y-3">
        <div className="flex items-center justify-between text-sm"><span className="text-[#aab3c0]">Product subtotal</span><span className="font-bold text-[#f8f5ed]">৳{orderSubtotal}</span></div>
        <div className="flex items-center justify-between text-sm"><span className="text-[#aab3c0]">Delivery charge</span><span className="font-bold text-[#e8d19a]">{deliveryLocation?`৳${deliveryCharge}`:'Enter location'}</span></div>
        {/* Total amount calculation */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3"><span className="font-bold text-[#f8f5ed]">Total</span><span className="text-2xl font-black text-[#f8f5ed]">৳{orderSubtotal+deliveryCharge}</span></div>
       </div>
             <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={added||!currentItem} onClick={addProduct} className="rounded-xl border border-[#d8b36a]/40 bg-[#d8b36a]/10 px-4 py-3 text-sm font-bold text-[#e8d19a] transition hover:border-[#d8b36a] hover:bg-[#d8b36a]/20 disabled:cursor-not-allowed disabled:opacity-50">Add Product</button>
        <Link href="/products" className="flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-[#d7dce3] transition hover:bg-white/10">Choose another product</Link>
             </div>
             {itemAdded&&<p role="status" className="mt-3 text-center text-sm font-semibold text-emerald-300">Product added. Choose another product or place your order.</p>}
{/* Add to cart button, disabled until all required fields are filled */}
        <button type="button" disabled={added||!selectedSize||!deliveryLocation||!customerName.trim()||!customerPhone.trim()||!customerEmail.trim()||!isValidEmail(customerEmail)} onClick={addToCart} className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#d8b36a] to-[#b9873e] px-6 py-4 text-base font-black text-[#11141b] shadow-xl shadow-[#d8b36a]/30 transition hover:from-[#e5c57e] hover:to-[#c89a50] hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#8f99a8] disabled:shadow-none">
         {added?<span className="flex items-center justify-center gap-2"><Check size={18}/> Order placed successfully</span>:'Place order'}
        </button>
        {added&&<p role="status" className="mt-3 text-center text-sm font-semibold text-emerald-300">Your order was saved. Enter fresh details to place another order.</p>}
        {/* Helper hints for required selections */}
        {!selectedSize&&<p className="mt-3 text-xs text-[#8f99a8]">Select a size before adding this product to your cart.</p>}
        {selectedSize&&!deliveryLocation&&<p className="mt-3 text-xs text-[#8f99a8]">Enter the receiver location to calculate delivery.</p>}
        {selectedSize&&deliveryLocation&&!customerName.trim()&&<p className="mt-3 text-xs text-[#8f99a8]">Enter your name to continue.</p>}
        {selectedSize&&deliveryLocation&&customerName.trim()&&!customerPhone.trim()&&<p className="mt-3 text-xs text-[#8f99a8]">Enter your phone number to continue.</p>}
        {selectedSize&&deliveryLocation&&customerName.trim()&&customerPhone.trim()&&!customerEmail.trim()&&<p className="mt-3 text-xs text-[#8f99a8]">Enter your email address to continue.</p>}
        {selectedSize&&deliveryLocation&&customerName.trim()&&customerPhone.trim()&&customerEmail.trim()&&!isValidEmail(customerEmail)&&<p className="mt-3 text-xs text-rose-400">Enter a valid email address to continue.</p>}
      </div>
     </div>
    </div>

    {/* Size measurement table section */}
    <section className="mt-16 rounded-3xl border border-white/10 bg-[#151a22] p-5 shadow-lg shadow-black/10 md:p-7">
     <div className="flex items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#d8b36a]">Fit details</p><h2 className="mt-2 text-2xl font-black text-[#f8f5ed]">Size measurement table</h2><p className="mt-2 text-sm text-[#aab3c0]">All measurements are garment measurements in centimeters.</p></div>
      {/* Unit label */}
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#d8b36a]/10 px-3 py-1.5 text-xs font-bold text-[#e8d19a]"><Ruler size={13}/> Centimeters</span>
     </div>
     {/* Scrollable table with size measurements for all sizes */}
     <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[520px] text-left text-sm">
       <thead>
        <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-[#aab3c0]">
         <th className="px-4 py-3">Size</th>
         <th className="px-4 py-3">Chest</th>
         <th className="px-4 py-3">Length</th>
         <th className="px-4 py-3">Shoulder</th>
        </tr>
       </thead>
       <tbody>{sizes.map(size=>{
        const measurement=sizeChart[size];
        const selected=selectedSize===size;
        return (
         <tr key={size} className={`border-b border-white/10 last:border-0 ${selected?'bg-gradient-to-r from-[#d8b36a]/20 to-[#d8b36a]/5 text-[#f8f5ed]':'bg-[#151a22] text-[#d7dce3]'}`}>
          <td className="px-4 py-3 font-bold">{size}</td>
          <td className="px-4 py-3">{measurement.chest} cm</td>
          <td className="px-4 py-3">{measurement.length} cm</td>
          <td className="px-4 py-3">{measurement.shoulder} cm</td>
         </tr>
        );
       })}</tbody>
      </table>
     </div>
    </section>
   </section>

{/* You might also like section - shows 2 related products side by side */}
    <section className="mt-16 rounded-3xl border border-[#d8b36a]/10 bg-[#151a22] p-6 shadow-xl shadow-[#d8b36a]/5 md:p-8">
     <div className="flex items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#d8b36a]">Recommended</p><h2 className="mt-2 text-2xl font-black text-[#f8f5ed]">You might also like</h2></div>
      {/* Shop all link */}
      <Link href="/products" className="text-xs font-bold text-cyan-300 transition hover:text-cyan-200">View all</Link>
     </div>
{/* Related products grid - 2 products side by side */}
      <div className="mt-6 grid grid-cols-2 gap-5">
       {getRelatedProducts(Number(id),getProducts()).map(p=>(
       <Link key={p.id} href={`/products/${p.id}`} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1d2430] transition hover:border-[#d8b36a]/40 hover:shadow-lg hover:shadow-[#d8b36a]/10">
        {/* Related product image - large */}
        <div className="relative aspect-square overflow-hidden">
         <img src={p.img} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110"/>
         <span className="absolute left-3 top-3 rounded-full border border-[#d8b36a]/20 bg-[#0d1017]/80 px-2.5 py-1 text-xs font-bold text-[#e8d19a]">{p.color}</span>
        </div>
        {/* Related product info */}
        <div className="p-4">
         <h3 className="font-semibold text-[#f8f5ed]">{p.name}</h3>
         <p className="mt-1 text-xs text-[#aab3c0]">S · M · L · XL · XXL</p>
         <div className="mt-3 flex items-center justify-between">
          <div className="text-right">{p.discount>0?<><p className="text-xs text-[#8f99a8] line-through">৳{p.price}</p><p className="font-bold text-[#d8b36a]">৳{getDiscountedPrice(p.price,p.discount)}</p></>:<p className="font-bold text-[#d8b36a]">৳{p.price}</p>}</div>
          <span className="rounded-full bg-[#d8b36a]/10 px-3 py-1.5 text-xs font-bold text-[#e8d19a]">Shop now</span>
         </div>
        </div>
       </Link>
      ))}
     </div>
    </section>
   {/* Footer with copyright */}
   <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-[#8f99a8]">© 2026 Teyro. Simple T-shirts, simple shopping.</footer>
  </main>
 );
}
