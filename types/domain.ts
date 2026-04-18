export interface DashboardUser {
  name: string;
  email: string;
  avatar: string;
  role?: string;
}

export interface CaseSummary {
  id: string;
  address: string;
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Active' | 'Pending' | 'Investigating' | 'Scheduled' | 'Resolved';
  detected: string;
  loss: string;
  assignee: string;
}
