module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/dynamic-access-async-storage.external.js [external] (next/dist/server/app-render/dynamic-access-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/dynamic-access-async-storage.external.js", () => require("next/dist/server/app-render/dynamic-access-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[project]/app/customer-provider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CustomerProvider",
    ()=>CustomerProvider,
    "useCustomer",
    ()=>useCustomer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$customer$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/customer-store.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const CustomerContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
function CustomerProvider({ children }) {
    const [customer, setCustomer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$customer$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCurrentCustomer"])());
    const [dashboardOpen, setDashboardOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const syncCustomer = ()=>setCustomer((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$customer$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCurrentCustomer"])());
        syncCustomer();
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$customer$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subscribeCustomerChanged"])(syncCustomer);
    }, []);
    const logout = ()=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$customer$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logoutCustomer"])();
        setCustomer(null);
        setDashboardOpen(false);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CustomerContext.Provider, {
        value: {
            customer,
            dashboardOpen,
            openDashboard: ()=>setDashboardOpen(true),
            closeDashboard: ()=>setDashboardOpen(false),
            logout
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/app/customer-provider.tsx",
        lineNumber: 33,
        columnNumber: 5
    }, this);
}
function useCustomer() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(CustomerContext);
    if (!context) throw new Error('useCustomer must be used within CustomerProvider');
    return context;
}
}),
"[project]/app/customer-store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addCustomerOrder",
    ()=>addCustomerOrder,
    "getAllOrders",
    ()=>getAllOrders,
    "getCurrentCustomer",
    ()=>getCurrentCustomer,
    "getOwnOrders",
    ()=>getOwnOrders,
    "loginCustomer",
    ()=>loginCustomer,
    "logoutCustomer",
    ()=>logoutCustomer,
    "registerCustomer",
    ()=>registerCustomer,
    "subscribeCustomerChanged",
    ()=>subscribeCustomerChanged,
    "subscribeOrdersChanged",
    ()=>subscribeOrdersChanged,
    "updateCustomerOrderStatus",
    ()=>updateCustomerOrderStatus
]);
const CUSTOMERS_KEY = 'teyro_customers';
const ORDERS_KEY = 'teyro_customer_orders';
const SESSION_KEY = 'teyro_customer_session';
const CUSTOMER_EVENT = 'teyro-customer-changed';
const ORDERS_EVENT = 'teyro-orders-changed';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;
const canUseBrowserStorage = ()=>("TURBOPACK compile-time value", "undefined") !== 'undefined';
const readJson = (key, fallback)=>{
    if (!canUseBrowserStorage()) return fallback;
    //TURBOPACK unreachable
    ;
};
const writeJson = (key, value)=>{
    if (!canUseBrowserStorage()) return;
    //TURBOPACK unreachable
    ;
};
const removeStorage = (key)=>{
    if (!canUseBrowserStorage()) return;
    //TURBOPACK unreachable
    ;
};
const normalizeEmail = (email)=>email.trim().toLowerCase();
const bytesToHex = (bytes)=>Array.from(bytes, (byte)=>byte.toString(16).padStart(2, '0')).join('');
const randomValue = ()=>{
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};
const randomToken = ()=>{
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    }
    return randomValue();
};
const hashPassword = async (password, salt = randomToken())=>{
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
        'deriveBits'
    ]);
    const bits = await crypto.subtle.deriveBits({
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 150000,
        hash: 'SHA-256'
    }, keyMaterial, 256);
    return {
        salt,
        hash: bytesToHex(new Uint8Array(bits))
    };
};
const passwordMatches = async (password, customer)=>{
    const result = await hashPassword(password, customer.passwordSalt);
    return result.hash === customer.passwordHash;
};
const getCustomers = ()=>readJson(CUSTOMERS_KEY, []);
const saveCustomers = (customers)=>writeJson(CUSTOMERS_KEY, customers);
const getOrders = ()=>readJson(ORDERS_KEY, []);
const saveOrders = (orders)=>writeJson(ORDERS_KEY, orders);
const notifyCustomerChanged = ()=>{
    if (canUseBrowserStorage()) //TURBOPACK unreachable
    ;
};
const notifyOrdersChanged = ()=>{
    if (canUseBrowserStorage()) //TURBOPACK unreachable
    ;
};
const getSession = ()=>{
    const session = readJson(SESSION_KEY, null);
    if (!session || Date.parse(session.expiresAt) <= Date.now()) {
        removeStorage(SESSION_KEY);
        return null;
    }
    return session;
};
const setSession = (customer)=>{
    const session = {
        userId: customer.id,
        token: randomToken(),
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString()
    };
    writeJson(SESSION_KEY, session);
    saveCustomers(getCustomers().map((item)=>item.id === customer.id ? {
            ...item,
            sessionTokens: [
                ...item.sessionTokens,
                session.token
            ]
        } : item));
    notifyCustomerChanged();
    return session;
};
const clearSession = (session)=>{
    if (session) {
        saveCustomers(getCustomers().map((customer)=>customer.id === session.userId ? {
                ...customer,
                sessionTokens: customer.sessionTokens.filter((token)=>token !== session.token)
            } : customer));
    }
    removeStorage(SESSION_KEY);
    notifyCustomerChanged();
};
const getCurrentCustomer = ()=>{
    const session = getSession();
    if (!session) return null;
    const customer = getCustomers().find((item)=>item.id === session.userId && item.sessionTokens.includes(session.token));
    if (!customer) {
        clearSession(session);
        return null;
    }
    return customer;
};
const registerCustomer = async (fullName, email, password)=>{
    const normalizedEmail = normalizeEmail(email);
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) return {
        ok: false,
        error: 'Enter your full name.'
    };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return {
        ok: false,
        error: 'Enter a valid email address.'
    };
    if (password.length < 6) return {
        ok: false,
        error: 'Password must be at least 6 characters.'
    };
    if (getCustomers().some((customer)=>customer.email === normalizedEmail)) return {
        ok: false,
        error: 'An account already exists for this email.'
    };
    try {
        const { salt, hash } = await hashPassword(password);
        const customer = {
            id: randomValue(),
            fullName: trimmedName,
            email: normalizedEmail,
            passwordSalt: salt,
            passwordHash: hash,
            sessionTokens: [],
            createdAt: new Date().toISOString()
        };
        saveCustomers([
            ...getCustomers(),
            customer
        ]);
        return {
            ok: true,
            customer
        };
    } catch  {
        return {
            ok: false,
            error: 'Account creation failed. Please try again.'
        };
    }
};
const loginCustomer = async (email, password)=>{
    const normalizedEmail = normalizeEmail(email);
    const customer = getCustomers().find((item)=>item.email === normalizedEmail);
    if (!customer || !await passwordMatches(password, customer)) {
        return {
            ok: false,
            error: 'Email or password is incorrect.'
        };
    }
    setSession(customer);
    return {
        ok: true,
        customer
    };
};
const logoutCustomer = ()=>clearSession(getSession());
const addCustomerOrder = (order)=>{
    const customer = getCurrentCustomer();
    const normalizedEmail = normalizeEmail(order.customerEmail);
    const newOrder = {
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
        createdAt: new Date().toISOString()
    };
    saveOrders([
        newOrder,
        ...getOrders()
    ]);
    notifyOrdersChanged();
    return newOrder;
};
const getAllOrders = ()=>getOrders().sort((a, b)=>Date.parse(b.createdAt) - Date.parse(a.createdAt));
const updateCustomerOrderStatus = (orderId, status)=>{
    const order = getOrders().find((item)=>item.id === orderId);
    if (!order) return null;
    const updatedOrder = {
        ...order,
        status
    };
    saveOrders(getOrders().map((item)=>item.id === orderId ? updatedOrder : item));
    notifyOrdersChanged();
    return updatedOrder;
};
const getOwnOrders = ()=>{
    const customer = getCurrentCustomer();
    if (!customer) return [];
    return getOrders().filter((order)=>order.customerId === customer.id || order.customerId === null && order.customerEmail === customer.email).sort((a, b)=>Date.parse(b.createdAt) - Date.parse(a.createdAt));
};
const subscribeCustomerChanged = (listener)=>{
    if (!canUseBrowserStorage()) return ()=>undefined;
    //TURBOPACK unreachable
    ;
    const handler = undefined;
};
const subscribeOrdersChanged = (listener)=>{
    if (!canUseBrowserStorage()) return ()=>undefined;
    //TURBOPACK unreachable
    ;
    const handler = undefined;
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0g235z_._.js.map