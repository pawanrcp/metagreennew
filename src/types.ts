/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LeadStatus = 'New Lead' | 'Qualified' | 'Site Survey' | 'Proposal' | 'Negotiation' | 'Approved' | 'Installation' | 'Completed' | 'AMC';

export type LeadSource = 'Website' | 'Facebook' | 'Google Ads' | 'Referral' | 'Walk-in';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  address: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  gpsLocation?: string;
  electricityBillUrl?: string;
  propertyImagesUrls?: string[];
  roofImagesUrls?: string[];
  createdAt: any;
}

export type ProjectStatus = 'Planning' | 'In Progress' | 'Installation' | 'Testing' | 'Completed';

export interface Project {
  id: string;
  leadId: string;
  customerName: string;
  status: ProjectStatus;
  capacityKw: number;
  totalCost: number;
  amountPaid: number;
  installDate?: any;
  createdAt: any;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  serialNumber?: string;
  warranty?: string;
  vendor?: string;
}

export interface Transaction {
  id: string;
  projectId: string;
  type: 'Advance' | 'EMI' | 'Balance' | 'Refund';
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed';
  date: any;
}

export type UserRole = 
  | 'Super Admin'
  | 'Solar Company Admin'
  | 'Regional Manager'
  | 'Sales Executive'
  | 'Survey Engineer'
  | 'Design Engineer'
  | 'Procurement Officer'
  | 'Warehouse Manager'
  | 'Installer'
  | 'Project Manager'
  | 'Finance Manager'
  | 'Customer Support'
  | 'Customer'
  | 'Vendor'
  | 'Auditor';

export interface AuthenticatedUser {
  name: string;
  email: string;
  role: UserRole;
}

export type ViewType = 'dashboard' | 'crm' | 'site-survey' | 'solar-design' | 'proposal' | 'quotation' | 'subsidy' | 'procurement' | 'projects' | 'inventory' | 'work-orders' | 'finance' | 'support' | 'warranty' | 'documents' | 'compliance' | 'hr' | 'vendors' | 'reports' | 'portal' | 'settings';
