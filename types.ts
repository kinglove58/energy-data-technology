export type ViewState = 
  | 'LOGIN'
  | 'EXECUTIVE_OVERVIEW' 
  | 'GIS_MAP' 
  | 'ANALYTICS' 
  | 'FIELD_OPS' 
  | 'ADMIN' 
  | 'SETTINGS';

export interface User {
  name: string;
  role: string;
  avatar: string;
}

export interface Metric {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  trendType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  color?: string;
}

export interface Case {
  id: string;
  address: string;
  status: 'Active' | 'Pending' | 'Scheduled' | 'Completed';
  type: string;
  sla?: string;
  dueDate?: string;
  assignedTo?: string;
  coordinates?: [number, number];
}