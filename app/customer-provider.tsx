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

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(() => getCurrentCustomer());
  const [dashboardOpen, setDashboardOpen] = useState(false);

  useEffect(() => {
    const syncCustomer = () => setCustomer(getCurrentCustomer());
    syncCustomer();
    return subscribeCustomerChanged(syncCustomer);
  }, []);

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

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error('useCustomer must be used within CustomerProvider');
  return context;
}
