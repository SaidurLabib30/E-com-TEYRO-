'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ChevronDown, LayoutDashboard, LogIn, LogOut, X } from 'lucide-react';
import { getOwnOrders, loginCustomer, registerCustomer, subscribeOrdersChanged, type CustomerOrder } from './customer-store';
import { useCustomer } from './customer-provider';

type AccountView = 'login' | 'register';

const inputClass = 'w-full rounded-2xl border border-white/8 bg-[#1a2230] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#8f99a8] focus:border-[#e8c27d]';

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
        {!customer ? (
          <button
            type="button"
            onClick={() => {
              setAuthOpen((value) => !value);
              setNotice('');
            }}
            className="button-secondary rounded-full px-3 py-2 text-xs font-bold"
          >
            Login / Register
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setAccountOpen((value) => !value)}
            className="button-primary flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold"
          >
            Account <ChevronDown size={14} />
          </button>
        )}
      </div>

      {authOpen && !customer && (
        <aside className="absolute right-0 top-full z-40 mt-3 w-[min(88vw,320px)] rounded-[1.6rem] border border-white/8 bg-[#111821]/95 p-5 shadow-[0_24px_60px_rgba(7,10,14,0.4)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e8c27d]">Optional account</p>
              <h2 className="mt-1 text-xl font-black text-white">{view === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            </div>
            <LogIn size={18} className="text-[#f3d79b]" />
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3">
            {view === 'register' && (
              <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className={inputClass} />
            )}
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className={inputClass} />
            <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className={inputClass} />
            {view === 'register' && (
              <input required minLength={6} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" className={inputClass} />
            )}
            {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
            {notice && <p className="text-sm text-[#7ee7b3]">{notice}</p>}
            <button disabled={busy} className="button-primary w-full rounded-2xl px-4 py-3 text-sm font-black disabled:cursor-wait disabled:opacity-60">
              {busy ? 'Please wait...' : view === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          <button type="button" onClick={() => { setView((current) => current === 'login' ? 'register' : 'login'); setError(''); }} className="mt-4 text-sm font-semibold text-[#f3d79b] transition hover:text-white">
            {view === 'login' ? 'Create Account' : 'Back to Login'}
          </button>
        </aside>
      )}

      {accountOpen && customer && (
        <div className="absolute right-0 top-full z-40 mt-3 w-44 rounded-[1.2rem] border border-white/8 bg-[#111821]/95 p-2 shadow-[0_24px_60px_rgba(7,10,14,0.4)]">
          <button type="button" onClick={() => { setAccountOpen(false); openDashboard(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/6">
            <LayoutDashboard size={15} /> Dashboard
          </button>
          <button type="button" onClick={() => { setAccountOpen(false); logout(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#d7dce3] transition hover:bg-white/6 hover:text-rose-300">
            <LogOut size={15} /> Logout
          </button>
        </div>
      )}
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0a0d12]/80 px-4 py-6 backdrop-blur-sm sm:px-6">
      <section role="dialog" aria-modal="true" aria-labelledby="customer-dashboard-title" className="mx-auto max-w-4xl rounded-[2rem] border border-white/8 bg-[#111821] shadow-[0_28px_80px_rgba(7,10,14,0.45)]">
        <div className="flex items-start justify-between gap-5 border-b border-white/8 p-6 sm:p-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e8c27d]">Customer dashboard</p>
            <h2 id="customer-dashboard-title" className="mt-2 text-3xl font-black text-white">Hi, {customer.fullName.split(' ')[0]}</h2>
            <p className="mt-2 text-sm text-[#aab3c0]">Your order history, kept private to your account.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={logout} className="button-secondary rounded-full px-3 py-2 text-xs font-bold">
              <span className="inline-flex items-center gap-2"><LogOut size={14} /> Logout</span>
            </button>
            <button type="button" onClick={closeDashboard} aria-label="Close dashboard" className="button-secondary rounded-full p-2 text-[#d7dce3]">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white">Order history</h3>
            <span className="rounded-full border border-[#e8c27d]/25 bg-[#e8c27d]/8 px-3 py-1 text-xs font-bold text-[#f3d79b]">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 px-5 py-12 text-center text-sm text-[#aab3c0]">
              You haven&apos;t placed any orders yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[1.5rem] border border-white/8">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-white/8 bg-white/3 text-xs uppercase tracking-[0.12em] text-[#aab3c0]">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Products</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-white/8 last:border-0">
                      <td className="px-4 py-4 font-bold text-white">{order.id}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-[#aab3c0]">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-4 text-[#d7dce3]">{order.items.map((item) => `${item.name} · ${item.size}`).join(', ')}</td>
                      <td className="px-4 py-4 text-[#d7dce3]">{order.items.reduce((total, item) => total + item.quantity, 0)}</td>
                      <td className="px-4 py-4 font-bold text-[#e8c27d]">৳{order.total}</td>
                      <td className="px-4 py-4 font-bold text-[#e8c27d]">{order.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
