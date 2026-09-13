'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ChevronDown, LayoutDashboard, LogIn, LogOut, X } from 'lucide-react';
import { getOwnOrders, loginCustomer, registerCustomer, subscribeOrdersChanged, type CustomerOrder } from './customer-store';
import { useCustomer } from './customer-provider';

type AccountView = 'login' | 'register';

const inputClass = 'w-full rounded-xl border border-white/15 bg-[#1d2430] px-4 py-3 text-sm text-[#f8f5ed] outline-none transition placeholder:text-[#8f99a8] focus:border-[#d8b36a]';

export function CustomerAuthPanel() {
  const { customer, openDashboard, logout } = useCustomer();
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [view, setView] = useState<AccountView>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (view === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    const result = view === 'register'
      ? await registerCustomer(name, email, password)
      : await loginCustomer(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    if (view === 'register') {
      setView('login');
      setNotice('Account created. Log in with your email and password.');
      return;
    }
    setAuthOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {!customer ? <button type="button" onClick={() => { setAuthOpen(value => !value); setNotice(''); }} className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#f8f5ed] transition hover:border-[#d8b36a]/60 hover:bg-white/10">Login / Register</button> : <button type="button" onClick={() => setAccountOpen(value => !value)} className="flex items-center gap-1 rounded-full bg-[#d8b36a] px-3 py-2 text-xs font-bold text-[#11141b] transition hover:bg-[#e5c57e]">Account <ChevronDown size={14}/></button>}
      </div>
      {authOpen && !customer && <aside className="absolute right-0 top-full z-40 mt-3 w-[min(88vw,320px)] rounded-2xl border border-white/10 bg-[#151a22] p-5 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#d8b36a]">Optional account</p><h2 className="mt-1 text-xl font-black text-[#f8f5ed]">{view === 'login' ? 'Welcome back' : 'Create your account'}</h2></div>
          <LogIn size={18} className="text-[#e8d19a]"/>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-3">
          {view === 'register' && <input required value={name} onChange={event => setName(event.target.value)} placeholder="Full name" className={inputClass}/>} 
          <input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" className={inputClass}/>
          <input required minLength={6} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" className={inputClass}/>
          {view === 'register' && <input required minLength={6} type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Confirm password" className={inputClass}/>} 
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          {notice && <p className="text-sm text-emerald-300">{notice}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-gradient-to-r from-[#d8b36a] to-[#b9873e] px-4 py-3 text-sm font-black text-[#11141b] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{busy ? 'Please wait...' : view === 'login' ? 'Login' : 'Create Account'}</button>
        </form>
        <button type="button" onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(''); }} className="mt-4 text-sm font-semibold text-[#e8d19a] transition hover:text-[#f8f5ed]">{view === 'login' ? 'Create Account' : 'Back to Login'}</button>
      </aside>}
      {accountOpen && customer && <div className="absolute right-0 top-full z-40 mt-3 w-44 rounded-2xl border border-white/10 bg-[#151a22] p-2 shadow-2xl shadow-black/40"><button type="button" onClick={() => { setAccountOpen(false); openDashboard(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#f8f5ed] transition hover:bg-white/10"><LayoutDashboard size={15}/> Dashboard</button><button type="button" onClick={() => { setAccountOpen(false); logout(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#d7dce3] transition hover:bg-white/10 hover:text-rose-300"><LogOut size={15}/> Logout</button></div>}
    </div>
  );
}

const formatDate = (date: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(date));

export function CustomerDashboard() {
  const { customer, dashboardOpen, closeDashboard, logout } = useCustomer();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);

  useEffect(() => {
    if (!dashboardOpen || !customer) return;
    const syncOrders = () => setOrders(getOwnOrders());
    syncOrders();
    return subscribeOrdersChanged(syncOrders);
  }, [dashboardOpen, customer]);

  if (!dashboardOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#080d14]/80 px-4 py-6 backdrop-blur-sm sm:px-6">
      <section role="dialog" aria-modal="true" aria-labelledby="customer-dashboard-title" className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[#101722] shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-5 border-b border-white/10 p-6 sm:p-8">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#d8b36a]">Customer dashboard</p><h2 id="customer-dashboard-title" className="mt-2 text-3xl font-black text-[#f8f5ed]">Hi, {customer.fullName.split(' ')[0]}</h2><p className="mt-2 text-sm text-[#aab3c0]">Your order history, kept private to your account.</p></div>
          <div className="flex items-center gap-2"><button type="button" onClick={logout} className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-[#d7dce3] transition hover:border-rose-300/50 hover:text-rose-300"><LogOut size={14}/> Logout</button><button type="button" onClick={closeDashboard} aria-label="Close dashboard" className="rounded-full border border-white/15 p-2 text-[#aab3c0] transition hover:border-[#d8b36a] hover:text-[#f8f5ed]"><X size={18}/></button></div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-4"><h3 className="text-lg font-bold text-[#f8f5ed]">Order history</h3><span className="rounded-full bg-[#d8b36a]/10 px-3 py-1 text-xs font-bold text-[#e8d19a]">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span></div>
          {orders.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center text-sm text-[#aab3c0]">You haven't placed any orders yet.</div> : <div className="overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-[.12em] text-[#aab3c0]"><tr><th className="px-4 py-3">Order ID</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Products</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Total Amount</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{orders.map(order => <tr key={order.id} className="border-b border-white/10 last:border-0"><td className="px-4 py-4 font-bold text-[#f8f5ed]">{order.id}</td><td className="whitespace-nowrap px-4 py-4 text-[#aab3c0]">{formatDate(order.createdAt)}</td><td className="px-4 py-4 text-[#d7dce3]">{order.items.map(item => `${item.name} · ${item.size}`).join(', ')}</td><td className="px-4 py-4 text-[#d7dce3]">{order.items.reduce((total, item) => total + item.quantity, 0)}</td><td className="px-4 py-4 font-bold text-[#e8d19a]">৳{order.total}</td><td className="px-4 py-4 font-bold text-[#d8b36a]">{order.status}</td></tr>)}</tbody></table></div>}
        </div>
      </section>
    </div>
  );
}
