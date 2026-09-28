'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Customer, getCurrentCustomer, logoutCustomer, subscribeCustomerChanged } from './customer-store';

type CustomerContextValue = {
  customer: Customer | null;
  dashboardOpen: boolean;
  openDashboard: () => void;
  closeDashboard: () => void;
  logout: () => void;
};

// Shares the current customer and dashboard controls with storefront components.
const CustomerContext = createContext<CustomerContextValue | null>(null);

// Initialize the browser session once, then follow login/logout changes from the store.
export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(() => getCurrentCustomer());
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // Synchronize context state with customer-store events and cross-tab storage changes.
  useEffect(() => {
    const syncCustomer = () => setCustomer(getCurrentCustomer());
    syncCustomer();
    return subscribeCustomerChanged(syncCustomer);
  }, []);

  // Clear both persisted session data and the provider's visible account state.
  const logout = () => {
    logoutCustomer();
    setCustomer(null);
    setDashboardOpen(false);
  };

  return (
    <CustomerContext.Provider value={{
      customer,
      dashboardOpen,
      openDashboard: () => setDashboardOpen(true),
      closeDashboard: () => setDashboardOpen(false),
      logout,
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

// Guard consumer components against rendering outside the root CustomerProvider.
export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error('useCustomer must be used within CustomerProvider');
  return context;
}
