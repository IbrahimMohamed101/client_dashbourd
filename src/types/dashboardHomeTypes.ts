export interface DashboardOverviewStats {
  activeSubscriptions?: number;
  deliveriesToday?: number;
  pendingOrders?: number;
  appUsers?: number;
}

export interface DashboardRecentSubscription {
  id: string;
  userName?: string;
  planName?: string;
  status?: string;
  startDate?: string;
  amount?: number;
  amountDisplay?: string;
  createdAt?: string;
}

export interface DashboardRecentOrder {
  id: string;
  displayId?: string;
  userName?: string;
  itemsSummary?: string;
  status?: string;
  date?: string;
  amountDisplay?: string;
}

export interface DashboardOverviewData {
  today?: string;
  stats?: DashboardOverviewStats;
  recentSubscriptions?: DashboardRecentSubscription[];
  recentOrders?: DashboardRecentOrder[];
}

export interface DashboardOverviewResponse {
  status?: boolean;
  data?: DashboardOverviewData;
}
