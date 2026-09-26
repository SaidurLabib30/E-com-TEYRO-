// Shared product store with localStorage persistence
// Uses localStorage as the database so products survive page refreshes

import { Size, sizeChart, sizes } from './product-data';

// Product type used across the application
export type Product = {
  id: number;
  name: string;
  price: number;
  discount: number;
  color: string;
  img: string;
  images: string[];
  description: string;
  category: string; // 'T-Shirts', 'Shirts', or 'Hoodies'
  createdAt?: string;
  sizeStock?: Record<Size, number>;
  status?: string;
};

// localStorage key for product persistence
const STORAGE_KEY = 'teyro_products';

// Initial product catalog (seed data)
const initialProducts: Product[] = [
  {id:1,name:"Essential Black Tee",price:799,discount:0,color:"Black",img:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",images:["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85&crop=entropy"],description:"A clean everyday tee cut for easy movement and layered styling.",category:"T-Shirts",sizeStock:{S:10,M:14,L:10,XL:5,XXL:3},status:"Active"},
  {id:2,name:"Classic White Tee",price:699,discount:0,color:"White",img:"https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=900&q=85",images:["https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=900&q=85&crop=entropy"],description:"A soft white staple with a relaxed shape that works all year.",category:"T-Shirts",sizeStock:{S:8,M:10,L:7,XL:4,XXL:2},status:"Active"},
  {id:3,name:"Oversized Sand Tee",price:899,discount:0,color:"Sand",img:"https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=900&q=85",images:["https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=900&q=85&crop=entropy"],description:"An oversized silhouette in a warm sand tone for a modern everyday look.",category:"T-Shirts",sizeStock:{S:4,M:5,L:5,XL:3,XXL:1},status:"Active"},
  {id:4,name:"Minimal Grey Tee",price:749,discount:0,color:"Grey",img:"https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85",images:["https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85","https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85&crop=entropy"],description:"A minimal grey tee with a comfortable fit and understated finish.",category:"T-Shirts",sizeStock:{S:0,M:0,L:0,XL:0,XXL:0},status:"Out of stock"}
];

// Load products from localStorage or use initial data
function loadProducts(): Product[] {
  if (typeof window === 'undefined') {
    return [...initialProducts];
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load products from localStorage:', e);
  }
  return [...initialProducts];
}

// Save products to localStorage
function saveProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    const compactProducts = products.map(product => ({
      ...product,
      images: product.img ? [product.img] : [],
    }));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compactProducts));
    } catch (compactError) {
      console.error('Failed to save products to localStorage:', compactError);
    }
  }
}

// Module-level product state (singleton) - loaded from localStorage
let products: Product[] = loadProducts();
let nextId = products.reduce((max, p) => Math.max(max, p.id), 0) + 1;

function refreshProductsFromStorage(): void {
  if (typeof window === 'undefined') return;
  const storedProducts = loadProducts();
  products = storedProducts;
  nextId = products.reduce((max, product) => Math.max(max, product.id), 0) + 1;
}

// Listeners for product changes
type Listener = () => void;
const listeners: Listener[] = [];

// Subscribe to product changes
export function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  if (typeof window !== 'undefined') {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      refreshProductsFromStorage();
      listener();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
      window.removeEventListener('storage', handleStorageChange);
    };
  }
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
}

// Notify all listeners of changes
function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

// Get current products (snapshot)
export function getProducts(): Product[] {
  refreshProductsFromStorage();
  return [...products];
}

// Get a single product by ID
export function getProduct(id: number): Product | undefined {
  refreshProductsFromStorage();
  return products.find((p) => p.id === id);
}

// Add a new product - persists to localStorage
export function addProduct(productData: Omit<Product, 'id'>): Product {
  refreshProductsFromStorage();
  const newProduct: Product = {
    ...productData,
    id: nextId++,
    createdAt: productData.createdAt || new Date().toISOString(),
  };
  products = [...products, newProduct];
  saveProducts(products); // Persist to localStorage
  notifyListeners();
  return newProduct;
}

// Update an existing product - persists to localStorage
export function updateProduct(id: number, productData: Partial<Product>): Product | null {
  refreshProductsFromStorage();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  products = products.map((p) => (p.id === id ? { ...p, ...productData } : p));
  saveProducts(products); // Persist to localStorage
  notifyListeners();
  return products[index];
}

// Delete a product - persists to localStorage
export function deleteProduct(id: number): boolean {
  refreshProductsFromStorage();
  const initialLength = products.length;
  products = products.filter((p) => p.id !== id);
  if (products.length !== initialLength) {
    saveProducts(products); // Persist to localStorage
    notifyListeners();
    return true;
  }
  return false;
}

export const getDiscountedPrice = (price: number, discount = 0): number =>
  Math.max(0, Math.round(price * (1 - Math.min(100, Math.max(0, discount)) / 100)));

// Re-export types and constants for convenience
export type { Size };
export { sizeChart, sizes };