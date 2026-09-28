export type Customer = {
  id: string;
  fullName: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  sessionTokens: string[];
  createdAt: string;
};

export type CustomerOrderItem = {
  productId: number;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
};

export type CustomerOrder = {
  id: string;
  customerId: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  receivedLocation: string;
  items: CustomerOrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
};

export type NewCustomerOrder = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  receivedLocation: string;
  items: CustomerOrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
};

type CustomerSession = {
  userId: string;
  token: string;
  expiresAt: string;
};

// Browser-local keys and events used to share customer, order, and session state.
const CUSTOMERS_KEY = 'teyro_customers';
const ORDERS_KEY = 'teyro_customer_orders';
const SESSION_KEY = 'teyro_customer_session';
const CUSTOMER_EVENT = 'teyro-customer-changed';
const ORDERS_EVENT = 'teyro-orders-changed';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;

// This prototype stores data in each browser; it does not call a server or database.
const canUseBrowserStorage = () => typeof window !== 'undefined';

// Read/write helpers keep server rendering safe and fall back when stored JSON is invalid.
const readJson = <T,>(key: string, fallback: T): T => {
  if (!canUseBrowserStorage()) return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (key: string, value: unknown): void => {
  if (!canUseBrowserStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
};

const removeStorage = (key: string): void => {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(key);
};

// Normalize account identifiers consistently before lookup or persistence.
const normalizeEmail = (email: string) => email.trim().toLowerCase();

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

const randomValue = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const randomToken = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  }
  return randomValue();
};

// Derive a salted PBKDF2 hash with the Web Crypto API; only salt and hash are stored.
const hashPassword = async (password: string, salt = randomToken()) => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 150000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return { salt, hash: bytesToHex(new Uint8Array(bits)) };
};

const passwordMatches = async (password: string, customer: Customer) => {
  const result = await hashPassword(password, customer.passwordSalt);
  return result.hash === customer.passwordHash;
};

// Typed accessors keep localStorage parsing and persistence centralized by record type.
const getCustomers = (): Customer[] => readJson<Customer[]>(CUSTOMERS_KEY, []);
const saveCustomers = (customers: Customer[]) => writeJson(CUSTOMERS_KEY, customers);
const getOrders = (): CustomerOrder[] => readJson<CustomerOrder[]>(ORDERS_KEY, []);
const saveOrders = (orders: CustomerOrder[]) => writeJson(ORDERS_KEY, orders);

const notifyCustomerChanged = () => {
  if (canUseBrowserStorage()) window.dispatchEvent(new Event(CUSTOMER_EVENT));
};

const notifyOrdersChanged = () => {
  if (canUseBrowserStorage()) window.dispatchEvent(new Event(ORDERS_EVENT));
};

// Reject expired sessions and remove their browser-side session record.
const getSession = (): CustomerSession | null => {
  const session = readJson<CustomerSession | null>(SESSION_KEY, null);
  if (!session || Date.parse(session.expiresAt) <= Date.now()) {
    removeStorage(SESSION_KEY);
    return null;
  }
  return session;
};

// Create a two-week browser session and register its token against the customer record.
const setSession = (customer: Customer): CustomerSession => {
  const session: CustomerSession = {
    userId: customer.id,
    token: randomToken(),
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
  };
  writeJson(SESSION_KEY, session);
  saveCustomers(getCustomers().map(item => item.id === customer.id ? { ...item, sessionTokens: [...item.sessionTokens, session.token] } : item));
  notifyCustomerChanged();
  return session;
};

// Revoke the active token, remove the session, and notify account UI subscribers.
const clearSession = (session: CustomerSession | null) => {
  if (session) {
    saveCustomers(getCustomers().map(customer => customer.id === session.userId
      ? { ...customer, sessionTokens: customer.sessionTokens.filter(token => token !== session.token) }
      : customer));
  }
  removeStorage(SESSION_KEY);
  notifyCustomerChanged();
};

// Resolve the active customer only when the session token still belongs to that record.
export const getCurrentCustomer = (): Customer | null => {
  const session = getSession();
  if (!session) return null;
  const customer = getCustomers().find(item => item.id === session.userId && item.sessionTokens.includes(session.token));
  if (!customer) {
    clearSession(session);
    return null;
  }
  return customer;
};

// Validate and create a browser-local account; return a result object for the form UI.
export const registerCustomer = async (fullName: string, email: string, password: string) => {
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = fullName.trim();
  if (trimmedName.length < 2) return { ok: false as const, error: 'Enter your full name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return { ok: false as const, error: 'Enter a valid email address.' };
  if (password.length < 6) return { ok: false as const, error: 'Password must be at least 6 characters.' };
  if (getCustomers().some(customer => customer.email === normalizedEmail)) return { ok: false as const, error: 'An account already exists for this email.' };

  try {
    const { salt, hash } = await hashPassword(password);
    const customer: Customer = {
      id: randomValue(),
      fullName: trimmedName,
      email: normalizedEmail,
      passwordSalt: salt,
      passwordHash: hash,
      sessionTokens: [],
      createdAt: new Date().toISOString(),
    };
    saveCustomers([...getCustomers(), customer]);
    return { ok: true as const, customer };
  } catch {
    return { ok: false as const, error: 'Account creation failed. Please try again.' };
  }
};

// Match normalized email and password hash, then persist a fresh session on success.
export const loginCustomer = async (email: string, password: string) => {
  const normalizedEmail = normalizeEmail(email);
  const customer = getCustomers().find(item => item.email === normalizedEmail);
  if (!customer || !(await passwordMatches(password, customer))) {
    return { ok: false as const, error: 'Email or password is incorrect.' };
  }
  setSession(customer);
  return { ok: true as const, customer };
};

// End the current browser session and remove its token from the customer record.
export const logoutCustomer = () => clearSession(getSession());

// Add an order to browser storage, associating it with a signed-in account when available.
export const addCustomerOrder = (order: NewCustomerOrder): CustomerOrder => {
  const customer = getCurrentCustomer();
  const normalizedEmail = normalizeEmail(order.customerEmail);
  const newOrder: CustomerOrder = {
    id: `TH-${Date.now().toString(36).toUpperCase()}`,
    customerId: customer?.id ?? null,
    customerEmail: normalizedEmail,
    customerName: order.customerName.trim(),
    customerPhone: order.customerPhone.trim(),
    receivedLocation: String(order.receivedLocation ?? '').trim(),
    items: order.items,
    subtotal: order.subtotal,
    deliveryCharge: order.deliveryCharge,
    total: order.total,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };
  saveOrders([newOrder, ...getOrders()]);
  notifyOrdersChanged();
  return newOrder;
};

// Return every stored order newest-first for the admin dashboard and orders table.
export const getAllOrders = (): CustomerOrder[] => getOrders()
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

// Persist a new status for one order; return null when the requested ID is unknown.
export const updateCustomerOrderStatus = (orderId: string, status: CustomerOrder['status']): CustomerOrder | null => {
  const order = getOrders().find(item => item.id === orderId);
  if (!order) return null;
  const updatedOrder = { ...order, status };
  saveOrders(getOrders().map(item => item.id === orderId ? updatedOrder : item));
  notifyOrdersChanged();
  return updatedOrder;
};

// Return newest-first orders for the active customer, including earlier guest orders by email.
export const getOwnOrders = (): CustomerOrder[] => {
  const customer = getCurrentCustomer();
  if (!customer) return [];
  return getOrders()
    .filter(order => order.customerId === customer.id || (order.customerId === null && order.customerEmail === customer.email))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};

// Subscribe to same-tab custom events and cross-tab storage updates; return cleanup functions.
export const subscribeCustomerChanged = (listener: () => void) => {
  if (!canUseBrowserStorage()) return () => undefined;
  const handler = () => listener();
  window.addEventListener(CUSTOMER_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CUSTOMER_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

// Refresh admin order views when this tab or another tab changes order storage.
export const subscribeOrdersChanged = (listener: () => void) => {
  if (!canUseBrowserStorage()) return () => undefined;
  const handler = () => listener();
  window.addEventListener(ORDERS_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(ORDERS_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};
