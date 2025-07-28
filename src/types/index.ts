export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  scrapType: ScrapType;
  address: string;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  leadId: string;
  customerId: string;
  collectorId?: string;
  scrapYardId: string;
  vehicleType: VehicleType;
  scrapType: ScrapType;
  pickupAddress: string;
  status: OrderStatus;
  scheduledDate?: Date;
  completedDate?: Date;
  estimatedValue?: number;
  finalValue?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  workZone?: string;
  vehicleDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collector extends Employee {
  totalPickups: number;
  averageRating: number;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export interface ScrapYard {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  capacity: number;
  currentLoad: number;
  managerId?: string;
  status: ScrapYardStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  refundId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type VehicleType = 'car' | 'bike' | 'truck' | 'boat';
export type ScrapType = 'junk' | 'accident-damaged' | 'fully-scrap';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
export type OrderStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
export type EmployeeRole = 'admin' | 'staff' | 'collector' | 'manager';
export type EmployeeStatus = 'active' | 'inactive' | 'blocked';
export type ScrapYardStatus = 'active' | 'inactive' | 'maintenance';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'bank-transfer' | 'wallet';

export interface DashboardStats {
  totalLeads: number;
  totalOrders: number;
  activeCollectors: number;
  todayRevenue: number;
  weeklyOrders: number;
  monthlyRevenue: number;
}