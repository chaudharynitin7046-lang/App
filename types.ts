
export type TransactionType = 'SALE' | 'PAYMENT';

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO string with time
  description: string;
  synced?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalSales: number;
  totalPaid: number;
  due: number;
  lastActivity: string;
  isActive: boolean; // Added for deactivation support
  synced?: boolean;
}

export interface BusinessStats {
  totalSales: number;
  totalPaid: number;
  totalDue: number;
  dailySales: number;
  weeklySales: number;
  monthlySales: number;
  dailyPayments: number;
  weeklyPayments: number;
  monthlyPayments: number;
  sheetUrl?: string;
  monthlyBestCustomer?: { name: string; amount: number };
}

export interface AIInsight {
  summary: string;
  actionItems: string[];
}
