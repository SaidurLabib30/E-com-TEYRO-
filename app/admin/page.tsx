// Marks this component as a client-side React component (enables hooks and interactivity)
'use client';

// React useState hook for managing component state
import { useState, useEffect } from 'react';

// Next.js Link component for client-side navigation
import Link from 'next/link';

// Icons from lucide-react for the admin UI
import { LayoutDashboard, Package, ShoppingCart, Plus, Pencil, Trash2, CheckCircle2, Clock3, Truck, AlertCircle, X, Home } from 'lucide-react';

// Import product store, size list, and Size type from shared product store
import { getProducts, addProduct, updateProduct, deleteProduct, subscribe, sizes, type Size, type Product } from '../product-store';
import { getAllOrders, subscribeOrdersChanged, updateCustomerOrderStatus, type CustomerOrder } from '../customer-store';

// Type definition for the product form used in add/edit operations
type ProductForm = {
  name:string;
  price:string;
  discount:string;
  color:string;
  category:string;
  img:string;
  images:string[];
  description:string;
  sizeStock:Record<Size,number>;
};

// Default empty form state for resetting the product form
const emptyProductForm: ProductForm = {
  name: '',
  price: '',
  discount: '',
  color: 'Black',
  category: 'T-Shirts',
  img: '',
  images: [],
  description: '',
  sizeStock: {S:0,M:0,L:0,XL:0,XXL:0}
};

// Pre-populated admin product list is now managed by the product store
// No static initialProducts needed here

// Helper: calculates the total stock quantity across all sizes for a given product
const totalStock=(stock:Record<Size,number>)=>sizes.reduce((total,size)=>total+(stock[size]||0),0);

// Helper: generates a human-readable stock string showing each size and its quantity
const stockText=(stock:Record<Size,number>)=>sizes.map(size=>`${size}: ${stock[size]||0}`).join(' · ');

// Helper: calculates the discounted price based on original price and discount percentage
const getDiscountedPrice=(price:number,discount:number)=>Math.max(0,Math.round(price*(1-Math.min(100,Math.max(0,discount))/100)));

const compressProductImage=(dataUrl:string):Promise<string>=>new Promise(resolve=>{
 const image=new Image();
 image.onload=()=>{
  const maxDimension=1200;
  const scale=Math.min(1,maxDimension/Math.max(image.width,image.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.width*scale));
  canvas.height=Math.max(1,Math.round(image.height*scale));
  const context=canvas.getContext('2d');
  if(!context){resolve(dataUrl);return;}
  context.drawImage(image,0,0,canvas.width,canvas.height);
  resolve(canvas.toDataURL('image/jpeg',0.78));
 };
 image.onerror=()=>resolve(dataUrl);
 image.src=dataUrl;
});

// Helper: renders a styled status badge for order status (Delivered, Shipped, Pending, Processing, etc.)
const orderStatus=(s:string)=>{
  const base="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold";
  if(s==='Delivered') return <span className={`${base} border-emerald-300/20 bg-emerald-400/10 text-emerald-300`}><CheckCircle2 size={14}/>Delivered</span>;
  if(s==='Shipped') return <span className={`${base} border-cyan-300/20 bg-cyan-400/10 text-cyan-300`}><Truck size={14}/>Shipped</span>;
  if(s==='Pending') return <span className={`${base} border-amber-300/20 bg-amber-400/10 text-amber-300`}><Clock3 size={14}/>Pending</span>;
  if(s==='Processing') return <span className={`${base} border-violet-300/20 bg-violet-400/10 text-violet-300`}><Clock3 size={14}/>Processing</span>;
  return <span className={`${base} border-rose-300/20 bg-rose-400/10 text-rose-300`}><AlertCircle size={14}/>{s}</span>;
};

// Main Admin panel component with dashboard, products management, and orders management tabs
export default function Admin(){
 // Admin authentication is intentionally scoped to this browser session.
 const [authReady,setAuthReady]=useState(false);
 const [isAuthenticated,setIsAuthenticated]=useState(false);
 const [loginEmail,setLoginEmail]=useState('');
 const [loginPassword,setLoginPassword]=useState('');
 const [loginError,setLoginError]=useState('');
 const ADMIN_SESSION_KEY='teyro_admin_session';

 useEffect(()=>{
  setIsAuthenticated(window.localStorage.getItem(ADMIN_SESSION_KEY)==='active');
  setAuthReady(true);
 },[]);

 const handleLogin=(event:React.FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(loginEmail.trim().toLowerCase()!=='admin@gmail.com'||loginPassword!=='admin'){
   setLoginError('Invalid admin email or password.');
   return;
  }
  window.localStorage.setItem(ADMIN_SESSION_KEY,'active');
  setIsAuthenticated(true);
  setLoginError('');
  setLoginEmail('');
  setLoginPassword('');
 };

 const handleLogout=()=>{
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  setIsAuthenticated(false);
 };

 // Active tab state: controls which section is displayed (dashboard, products, or orders)
 const [tab,setTab]=useState<'dashboard'|'products'|'orders'>('dashboard');
// State for the list of products managed in the admin panel - synced with shared product store
  const [products,setProducts]=useState(getProducts());
  const [orderList,setOrderList]=useState<CustomerOrder[]>([]);
  const [selectedOrder,setSelectedOrder]=useState<CustomerOrder|null>(null);
  // Controls whether the add/edit product form modal is open
  const [isProductFormOpen,setIsProductFormOpen]=useState(false);
  // Holds the product being edited, null when adding a new product
  const [editingProduct,setEditingProduct]=useState<Product|null>(null);
  // Form state for product name, price, discount, image, and size stock
  const [form,setForm]=useState<ProductForm>(emptyProductForm);
  // Holds any validation error messages for the product form
  const [formError,setFormError]=useState('');
// Controls mobile sidebar visibility
   const [sidebarOpen,setSidebarOpen]=useState(false);
   // Search query for filtering products in the products tab
   const [searchQuery,setSearchQuery]=useState('');
   // Navigation items for the sidebar: each entry is [key, label, icon]
   const nav=[['dashboard','Dashboard',LayoutDashboard],['products','Products',Package],['orders','Orders',ShoppingCart]] as const;
// Helper to delete a product - uses the store's deleteProduct function
  const del=(id:number)=>deleteProduct(id);
  // Derived values from the form for price, discount percentage, and discounted price
  const basePrice=Number(form.price)||0;
  const discountPercent=Math.min(100,Math.max(0,Number(form.discount)||0));
  const discountedPriceValue=getDiscountedPrice(basePrice,discountPercent);

  // Subscribe to product store changes so admin sees updates in real-time
  useEffect(()=>{
   const updateProducts=()=>setProducts(getProducts());
   const unsubscribe=subscribe(updateProducts);
   updateProducts();
   return unsubscribe;
  },[]);

  useEffect(()=>{
   const updateOrders=()=>setOrderList(getAllOrders());
   updateOrders();
   return subscribeOrdersChanged(updateOrders);
  },[]);

 if(!authReady||!isAuthenticated){
  return (
   <main className="admin-dashboard flex min-h-screen items-center justify-center px-5 py-10">
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[.04] p-7 shadow-2xl shadow-black/20 backdrop-blur sm:p-9">
     <div className="mb-8 text-center"><span className="brand-logo inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#06121f] font-black">T</span><p className="mt-5 text-xs font-bold uppercase tracking-[.25em] text-cyan-300">Admin Panel</p><h1 className="mt-2 text-3xl font-black text-white">Admin Login</h1><p className="mt-2 text-sm text-slate-400">Sign in to manage your store.</p></div>
     <form onSubmit={handleLogin} className="space-y-4">
      <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-200">Email</span><input required type="email" value={loginEmail} onChange={event=>setLoginEmail(event.target.value)} placeholder="admin@gmail.com" className="w-full rounded-xl border border-white/15 bg-[#172033] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/50"/></label>
      <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-200">Password</span><input required type="password" value={loginPassword} onChange={event=>setLoginPassword(event.target.value)} placeholder="Password" className="w-full rounded-xl border border-white/15 bg-[#172033] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/50"/></label>
      {loginError&&<p role="alert" className="text-sm text-rose-300">{loginError}</p>}
      <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-3 text-sm font-black text-[#06121f] shadow-lg shadow-cyan-500/20 transition hover:brightness-110">Login</button>
     </form>
    </section>
   </main>
  );
 }

// Opens the product form for adding a new product or editing an existing one
  const openProductForm=(product?:Product)=>{
   if(product){
    // Pre-fill form with existing product data when editing
    setForm({
      name:product.name,
      price:String(product.price),
      discount:String(product.discount||0),
      color:product.color||'Black',
      category:product.category||'T-Shirts',
      img:product.img,
      images:product.images&&product.images.length>0?[...product.images]:[product.img],
      description:product.description||'',
      sizeStock:{...(product.sizeStock||{S:0,M:0,L:0,XL:0,XXL:0})}
    });
    setEditingProduct(product);
   }else{
    // Reset form to empty state for adding a new product
    setForm(emptyProductForm);
    setEditingProduct(null);
   }
   setFormError('');
   setIsProductFormOpen(true);
  };

 // Updates the stock quantity for a specific size in the form state
 const updateSizeStock=(size:Size,value:string)=>{
  setForm(prev=>({...prev,sizeStock:{...prev.sizeStock,[size]:Math.max(0,Number(value)||0)}}));
 };

// Handles image file upload: reads selected files as data URLs and stores them in form state
  const handleImageFile=(event:React.ChangeEvent<HTMLInputElement>)=>{
   const files=event.target.files;
   if(!files||files.length===0) return;
  const newImages: string[]=[];
   let processed=0;
   Array.from(files).forEach(file=>{
    const reader=new FileReader();
    reader.onload=async()=>{
     newImages.push(await compressProductImage(String(reader.result)));
     processed++;
     if(processed===files.length){
      setForm(prev=>({...prev,images:[...prev.images,...newImages],img:newImages[0]||prev.img}));
     }
    };
    reader.readAsDataURL(file);
   });
  };

  // Removes an image from the form's image list
  const removeImage=(index:number)=>{
   setForm(prev=>{
    const newImages=prev.images.filter((_,i)=>i!==index);
    return {...prev,images:newImages,img:newImages[0]||''};
   });
  };

// Saves the product: validates input, then either updates an existing product or adds a new one
  const saveProduct=()=>{
   const price=Number(form.price);
   const discount=Math.min(100,Math.max(0,Number(form.discount)||0));
   const stock=totalStock(form.sizeStock);
   const images=form.images.length>0?[...form.images]:(form.img?[form.img]:[]);
   // Validation: ensure all required fields are filled and stock is greater than zero
   if(!form.name.trim()||price<=0||images.length===0||stock<=0||!form.category){
    setFormError('Add a product name, valid price, product image(s), category, and at least one size quantity.');
    return;
   }
   // Convert form data to product store format
   const productData:Partial<Product>={
    name:form.name.trim(),
    price,
    discount,
    color:form.color,
    category:form.category,
    img:images[0],
    images,
    description:form.description.trim()||`${form.name.trim()} - Quality T-shirt at a great price.`,
    sizeStock:form.sizeStock,
    status:stock>0?'Active':'Out of stock'
   };
   if(editingProduct){
    // Update existing product in the store
    updateProduct(editingProduct.id,productData);
   }else{
    // Add a new product to the store
    addProduct(productData as Omit<Product,'id'>);
   }
   // Reset form and close modal after saving
   setForm(emptyProductForm);
   setEditingProduct(null);
   setFormError('');
   setIsProductFormOpen(false);
  };

return (
   <div className="admin-dashboard">
    {/* Mobile sidebar overlay - appears when sidebar is open on mobile */}
    {sidebarOpen&&<div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={()=>setSidebarOpen(false)}></div>}
    
    {/* Fixed left sidebar with navigation menu and admin info */}
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#0b1220]/95 p-5 backdrop-blur transition-transform duration-300 md:translate-x-0 ${sidebarOpen?'translate-x-0':'-translate-x-full md:translate-x-0'}`}>
     {/* Brand logo in the sidebar with gradient text */}
     <div className="mb-12 flex items-center justify-between">
      <div className="px-2 text-lg font-black tracking-[.2em]"><span className="brand-logo inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#06121f] font-black text-sm mr-2">T</span><span className="brand-name">TEYRO</span></div>
      {/* Close button on mobile */}
      <button type="button" onClick={()=>setSidebarOpen(false)} className="rounded-lg border border-white/15 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white md:hidden" aria-label="Close sidebar">
       <X size={18}/>
      </button>
     </div>
     {/* Navigation buttons for switching between dashboard, products, and orders tabs */}
     <div className="space-y-1">{nav.map(([key,label,Icon])=><button key={key} onClick={()=>{setTab(key);setSidebarOpen(false);}} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition ${tab===key?'border-cyan-300/30 bg-gradient-to-r from-cyan-400/20 to-emerald-400/10 text-cyan-100':'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200'}`}><Icon size={18}/>{label}</button>)}</div>
     {/* Public Dashboard link - navigates to the public website homepage */}
     <Link href="/" className="mt-2 flex w-full items-center gap-3 rounded-xl border border-[#d8b36a]/30 bg-gradient-to-r from-[#d8b36a]/10 to-[#d8b36a]/5 px-3 py-3 text-sm font-bold text-[#e8d19a] transition hover:border-[#d8b36a] hover:bg-[#d8b36a] hover:text-[#11141b]"><Home size={18}/> Public Dashboard</Link>
     {/* Admin contact info pinned at the bottom of the sidebar */}
     <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">Admin Panel<br/><b className="text-cyan-200">admin@teyro.store</b></div>
    </aside>

    {/* Main content area offset by sidebar width on medium and larger screens */}
    <main className="md:ml-64">
     {/* Top header bar with current page title, mobile menu button, and logout button */}
     <header className="flex items-center justify-between border-b border-white/10 bg-[#0b1220]/85 px-5 py-4 backdrop-blur md:px-8">
<div className="flex items-center gap-3">
        {/* Mobile menu toggle button */}
        <button type="button" onClick={()=>setSidebarOpen(!sidebarOpen)} className="rounded-lg border border-white/15 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden" aria-label="Toggle sidebar">
         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div><p className="text-xs text-slate-400">Admin</p><h1 className="text-xl font-bold capitalize text-white">{tab}</h1></div>
       </div>
       <div className="flex items-center gap-3">
        {/* Search bar - visible on medium and larger screens */}
        <div className="relative hidden md:block">
         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
         <input type="text" value={searchQuery} onChange={event=>setSearchQuery(event.target.value)} placeholder="Search products..." className="w-64 rounded-xl border border-white/15 bg-[#172033] py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/50"/>
        </div>
        <button type="button" onClick={handleLogout} className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-300/20">Logout</button>
       </div>
     </header>

    {/* Page content wrapper with padding */}
    <div className="mx-auto max-w-6xl p-5 md:p-8">
     {/* Dashboard tab: stats cards and recent orders table */}
     {tab==='dashboard'&&<>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
       {/* Render stat cards for total products, orders, pending orders, and processing orders */}
       {[['Total Products',products.length],['Total Orders',orderList.length],['Pending Orders',orderList.filter(o=>o.status==='Pending').length],['Processing',orderList.filter(o=>o.status==='Processing').length]].map(x=><div className="rounded-2xl border border-white/10 bg-white/[.04] p-5 shadow-lg shadow-black/10 backdrop-blur" key={x[0]}><p className="text-sm text-slate-400">{x[0]}</p><p className="mt-2 text-3xl font-black text-white">{x[1]}</p></div>)}
      </div>
      {/* Recent orders preview card */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.04] p-5 shadow-lg shadow-black/10 backdrop-blur">
       <div className="mb-5 flex items-center justify-between"><h2 className="font-bold text-white">Recent Orders</h2><button onClick={()=>setTab('orders')} className="text-xs font-bold text-cyan-300 transition hover:text-cyan-200">View all</button></div>
      <OrdersTable orders={orderList} setSelectedOrder={setSelectedOrder}/>
      </div>
     </>}

     {/* Orders tab: full customer orders table with editable status */}
     {tab==='orders'&&
      <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5 shadow-lg shadow-black/10 backdrop-blur">
       <div className="mb-5"><h2 className="text-xl font-bold text-white">Customer Orders</h2><p className="text-sm text-slate-400">Process and update order status.</p></div>
      <OrdersTable orders={orderList} setSelectedOrder={setSelectedOrder}/>
      </div>
     }

{/* Products tab: product management table with add, edit, and delete functionality */}
      {tab==='products'&&
       <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5 shadow-lg shadow-black/10 backdrop-blur">
        <div className="mb-5 flex items-center justify-between">
         <div><h2 className="text-xl font-bold text-white">Products</h2><p className="text-sm text-slate-400">Add, edit or delete T-shirts.</p></div>
         {/* Add product button */}
         <button onClick={()=>openProductForm()} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2.5 text-sm font-bold text-[#06121f] shadow-lg shadow-cyan-500/20 transition hover:brightness-110"><Plus size={17}/> Add product</button>
        </div>
        {/* Search bar for products - visible on smaller screens too */}
        <div className="mb-5 relative">
         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
         <input type="text" value={searchQuery} onChange={event=>setSearchQuery(event.target.value)} placeholder="Search products by name..." className="w-full rounded-xl border border-white/15 bg-[#172033] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/50"/>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10">
         <table className="w-full min-w-[760px] text-left text-sm text-slate-200">
          <thead>
           <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-slate-400">
            <th className="px-4 pb-3">Product</th>
            <th className="px-4 pb-3">Price</th>
            <th className="px-4 pb-3">Size inventory</th>
            <th className="px-4 pb-3">Status</th>
            <th className="px-4 pb-3">Actions</th>
           </tr>
          </thead>
 <tbody>{(()=>{
            const query=searchQuery.trim().toLowerCase();
            const filtered=products.filter(p=>{
             if(!query) return true;
             const nameMatch=p.name.toLowerCase().includes(query);
             const categoryMatch=(p.category||'').toLowerCase().includes(query);
             return nameMatch||categoryMatch;
            });
            if(filtered.length===0){
             return <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No products found</td></tr>;
            }
            return filtered.map(p=>{
             // Calculate total stock and discounted price for each product row
             // Use optional chaining since sizeStock and discount may not exist on all products
             const stock=p.sizeStock?totalStock(p.sizeStock):0;
             const price=getDiscountedPrice(p.price,p.discount||0);
             return (
              <tr className="border-b border-white/10 last:border-0 transition hover:bg-white/[.03]" key={p.id}>
               {/* Product name and image */}
               <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                 <div className="h-14 w-14 overflow-hidden rounded-lg border border-white/10 bg-[#0f172a]">
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover"/>
                 </div>
                 <span className="font-semibold text-white">{p.name}</span>
                </div>
              </td>
              {/* Price display with discount strikethrough and discount percentage if applicable */}
              <td className="px-4 py-3">
               {p.discount&&p.discount>0?
                <>
                 <span className="block text-xs text-slate-500 line-through">৳{p.price}</span>
                 <span className="font-bold text-cyan-200">৳{price}</span>
                 <span className="mt-1 block text-xs font-bold text-emerald-300">{p.discount}% off</span>
                </>
                :
                <span className="font-bold text-cyan-200">৳{p.price}</span>
               }
              </td>
              {/* Total stock and per-size breakdown */}
              <td className="px-4 py-3">
               <span className="font-bold text-white">{stock} pcs</span>
               <span className="mt-1 block text-xs text-slate-400">{p.sizeStock?stockText(p.sizeStock):'N/A'}</span>
              </td>
              {/* Stock status badge: Active if stock > 0, otherwise Out of stock */}
              <td className="px-4 py-3">
               <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${stock?'border-emerald-300/20 bg-emerald-400/10 text-emerald-300':'border-rose-300/20 bg-rose-400/10 text-rose-300'}`}>{stock?'Active':'Out of stock'}</span>
              </td>
              {/* Action buttons: edit (pencil) and delete (trash) */}
              <td className="px-4 py-3">
               <div className="flex gap-2">
                <button onClick={()=>openProductForm(p)} className="rounded-lg border border-white/15 bg-white/5 p-2 text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"><Pencil size={15}/></button>
                <button onClick={()=>del(p.id)} className="rounded-lg border border-white/15 bg-white/5 p-2 text-rose-300 transition hover:border-rose-300/40 hover:text-rose-200"><Trash2 size={15}/></button>
               </div>
              </td>
             </tr>
            );
           })})()}</tbody>
         </table>
        </div>
       </div>
      }
    </div>
   </main>

  {selectedOrder&&<OrderDetails order={selectedOrder} onClose={()=>setSelectedOrder(null)} />}

   {/* Product form modal overlay: shown when adding or editing a product */}
   {isProductFormOpen&&
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-5" onClick={()=>setIsProductFormOpen(false)}>
     {/* Modal container with scrollable content */}
     <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0f172a] p-5 shadow-2xl shadow-black/40 sm:rounded-3xl sm:p-7" onClick={e=>e.stopPropagation()}>
      {/* Modal header with title and close button */}
      <div className="flex items-start justify-between gap-4">
       <div>
        <p className="text-xs font-bold uppercase tracking-[.25em] text-cyan-300">{editingProduct?'Edit product':'Add product'}</p>
        <h2 className="mt-1 text-2xl font-black text-white">{editingProduct?'Update product':'Create a new product'}</h2>
       </div>
       <button type="button" onClick={()=>setIsProductFormOpen(false)} aria-label="Close product form" className="rounded-full border border-white/15 p-2 text-slate-300 transition hover:bg-white/10"><X size={18}/></button>
      </div>

      {/* Two-column layout for form fields and size inventory */}
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
       {/* Left column: product details form fields */}
       <div className="space-y-4">
        {/* Product name input field */}
        <label className="block">
         <span className="mb-2 block text-sm font-semibold text-slate-200">Product name</span>
         <input value={form.name} onChange={e=>setForm(prev=>({...prev,name:e.target.value}))} placeholder="e.g. Essential Black Tee" className="w-full rounded-xl border border-white/15 bg-[#172033] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/50"/>
        </label>
        {/* Price input field with currency prefix */}
        <label className="block">
         <span className="mb-2 block text-sm font-semibold text-slate-200">Price</span>
         <div className="flex items-center rounded-xl border border-white/15 bg-[#172033] px-4">
          <span className="text-cyan-200">৳</span>
          <input type="number" min="1" value={form.price} onChange={e=>setForm(prev=>({...prev,price:e.target.value}))} placeholder="799" className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-slate-500 outline-none"/>
         </div>
        </label>
        {/* Discount percentage input field */}
        <label className="block">
         <span className="mb-2 block text-sm font-semibold text-slate-200">Discount (%)</span>
         <div className="flex items-center rounded-xl border border-white/15 bg-[#172033] px-4">
          <input type="number" min="0" max="100" value={form.discount} onChange={e=>setForm(prev=>({...prev,discount:e.target.value}))} placeholder="0" className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-slate-500 outline-none"/>
<span className="text-slate-400">%</span>
          </div>
         </label>
         {/* Category dropdown field */}
         <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-200">Category</span>
          <select value={form.category} onChange={e=>setForm(prev=>({...prev,category:e.target.value}))} className="w-full rounded-xl border border-white/15 bg-[#172033] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/50">
           <option value="T-Shirts">T-Shirts</option>
           <option value="Shirts">Shirts</option>
           <option value="Hoodies">Hoodies</option>
          </select>
         </label>
         {/* Color input field */}
         <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-200">Color</span>
          <input value={form.color} onChange={e=>setForm(prev=>({...prev,color:e.target.value}))} placeholder="e.g. Black" className="w-full rounded-xl border border-white/15 bg-[#172033] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/50"/>
         </label>
         {/* Description input field */}
         <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-200">Description</span>
          <textarea value={form.description} onChange={e=>setForm(prev=>({...prev,description:e.target.value}))} placeholder="e.g. A clean everyday tee..." rows={3} className="w-full rounded-xl border border-white/15 bg-[#172033] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/50 resize-none"></textarea>
         </label>
        {/* Live price calculation preview card */}
        <div className="rounded-xl border border-white/10 bg-[#172033] p-4">
         <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Base price</span><span className="font-bold text-white">৳{basePrice}</span></div>
         <div className="mt-2 flex items-center justify-between text-sm"><span className="text-slate-400">Discount</span><span className="font-bold text-emerald-300">{discountPercent}%</span></div>
         <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2"><span className="font-bold text-white">Discounted price</span><span className="text-lg font-black text-cyan-200">৳{discountedPriceValue}</span></div>
        </div>
{/* Image file upload input - supports multiple images */}
         <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-200">Upload product images</span>
          <input type="file" accept="image/*" multiple onChange={handleImageFile} className="block w-full rounded-xl border border-dashed border-white/20 bg-[#172033] px-4 py-3 text-xs text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400/15 file:px-3 file:py-2 file:text-cyan-200"/>
         </label>
         {/* Image previews - shows all selected images with remove option */}
         {form.images&&form.images.length>0?
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
           {form.images.map((img,idx)=>(
            <div key={idx} className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#172033]">
             <img src={img} alt={`Preview ${idx+1}`} className="aspect-square w-full object-cover"/>
             <button type="button" onClick={()=>removeImage(idx)} className="absolute right-2 top-2 rounded-full bg-rose-500/80 p-1 text-white opacity-0 transition group-hover:opacity-100" aria-label={`Remove image ${idx+1}`}>
              <X size={14}/>
             </button>
            </div>
           ))}
          </div>
          :
          <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-white/20 bg-[#172033] text-slate-500">
           <div className="flex flex-col items-center gap-2"><Package size={24}/><span className="text-xs">No images uploaded</span></div>
          </div>
         }
       </div>

       {/* Right column: size inventory management */}
       <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
        {/* Size inventory header with total stock count */}
        <div className="flex items-center justify-between">
         <div>
          <h3 className="font-bold text-white">Size inventory</h3>
          <p className="mt-1 text-xs text-slate-400">Set the available quantity for every size.</p>
         </div>
         <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{totalStock(form.sizeStock)} pcs</span>
        </div>
        {/* Grid of size quantity inputs for S, M, L, XL, XXL */}
        <div className="mt-5 grid grid-cols-2 gap-3">
         {sizes.map(size=>(
          <label key={size} className="rounded-xl border border-white/10 bg-[#172033] p-3">
           <span className="block text-sm font-bold text-white">{size}</span>
           <input type="number" min="0" value={form.sizeStock[size]} onChange={e=>updateSizeStock(size,e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/50"/>
          </label>
         ))}
        </div>
        {/* Total available stock summary */}
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
         <span className="text-sm text-slate-400">Total available stock</span>
         <span className="text-lg font-black text-white">{totalStock(form.sizeStock)} pcs</span>
        </div>
       </div>
      </div>

      {/* Form validation error message display */}
      {formError&&<div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-xs text-rose-200">{formError}</div>}
      {/* Modal action buttons: cancel and save */}
      <div className="mt-7 flex justify-end gap-3">
       <button type="button" onClick={()=>setIsProductFormOpen(false)} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5">Cancel</button>
       <button type="button" onClick={saveProduct} className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-3 text-sm font-bold text-[#06121f] shadow-lg shadow-cyan-500/20 transition hover:brightness-110">{editingProduct?'Save product':'Add product'}</button>
      </div>
     </div>
    </div>
   }
  </div>
 );
}

function OrdersTable({orders,setSelectedOrder}:{orders:CustomerOrder[];setSelectedOrder:(order:CustomerOrder)=>void}){
  return (
   <div className="overflow-x-auto rounded-xl border border-white/10">
    <table className="w-full min-w-[720px] text-left text-sm text-slate-200">
     <thead>
       <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-slate-400">
        <th className="px-4 pb-3">Order ID</th>
        <th className="px-4 pb-3">Customer</th>
        <th className="px-4 pb-3">Date</th>
        <th className="px-4 pb-3">Total</th>
        <th className="px-4 pb-3">Status</th>
        <th className="px-4 pb-3">Details</th>
      </tr>
     </thead>
     <tbody>{orders.map(order=>{
      return (
       <tr className="border-b border-white/10 last:border-0 transition hover:bg-white/[.03]" key={order.id}>
        <td className="px-4 py-4 font-bold text-cyan-200">{order.id}</td>
        <td className="px-4 py-4 text-white/90">{order.customerName}</td>
        <td className="whitespace-nowrap px-4 py-4 text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</td>
        <td className="px-4 py-4 font-bold text-white">৳{order.total}</td>
        <td className="px-4 py-4">
         <div className="flex items-center gap-2">
          <select value={order.status} onChange={event=>updateCustomerOrderStatus(order.id,event.target.value as CustomerOrder['status'])} className="rounded-lg border border-white/15 bg-[#0f172a] px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-300/50">
           <option>Pending</option>
           <option>Processing</option>
           <option>Shipped</option>
           <option>Delivered</option>
           <option>Cancelled</option>
          </select>
          {orderStatus(order.status)}
         </div>
        </td>
        <td className="px-4 py-4"><button type="button" onClick={()=>setSelectedOrder(order)} className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-300/20">View Order</button></td>
       </tr>
      );
     })}</tbody>
    </table>
   </div>
  );
 }

 function OrderDetails({order,onClose}:{order:CustomerOrder;onClose:()=>void}){
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5" onClick={onClose}>
   <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl shadow-black/50" onClick={event=>event.stopPropagation()}>
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-cyan-300">Order details</p><h2 className="mt-2 text-2xl font-black text-white">{order.id}</h2></div><button type="button" onClick={onClose} aria-label="Close order details" className="rounded-full border border-white/15 p-2 text-slate-300 hover:bg-white/10"><X size={18}/></button></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2">{[['Customer Name',order.customerName],['Email',order.customerEmail],['Phone Number',order.customerPhone],['Received Location',order.receivedLocation||'Not provided'],['Order ID',order.id],['Order Date',new Date(order.createdAt).toLocaleString()],['Total Amount',`৳${order.total}`],['Order Status',order.status]].map(([label,value])=><div key={label} className="rounded-xl border border-white/10 bg-white/[.04] p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 font-semibold text-white">{value}</p></div>)}</div>
    <div className="mt-6 overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-slate-400"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Product Price</th><th className="px-4 py-3">Discount Price</th></tr></thead><tbody>{order.items.map((item,index)=><tr key={`${order.id}-${item.productId}-${index}`} className="border-b border-white/10 last:border-0"><td className="px-4 py-3 text-white">{item.name} · {item.size}</td><td className="px-4 py-3 text-slate-300">{item.quantity}</td><td className="px-4 py-3 text-slate-300">৳{item.originalPrice??item.unitPrice}</td><td className="px-4 py-3 font-bold text-cyan-200">{item.discount&&item.discount>0?`৳${item.unitPrice}`:'-'}</td></tr>)}</tbody></table></div>
    <div className="mt-6 flex justify-end"><button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-white/10">Close</button></div>
   </section>
  </div>;
 }
