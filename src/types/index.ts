export interface Lead {
  id: string;
  name: string;
  contact: string;
  email: string;
  vehicleTypeId: number;
  ScrapCategory: ScrapCategory;
  scrapCategory: ScrapCategory;
  location: string;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
  organizationId?: number;
}

export interface Order {
  id: string;
  leadId: string;
  customerId: string;
  collectorId?: string;
  scrapYardId: string;
  vehicleType: VehicleType;
  scrapCategory: ScrapCategory;
  location: string;
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

export type VehicleType = 'CAR' | 'BIKE' | 'TRUCK' | 'BOAT';
export type ScrapCategory = 'JUNK' | 'ACCIDENT_DAMAGED' | 'FULLY_SCRAP';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'REJECTED';
export type OrderStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type EmployeeRole = 'ADMIN' | 'STAFF' | 'COLLECTOR' | 'MANAGER';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type ScrapYardStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'WALLET';

export interface DashboardStats {
  totalLeads: number;
  totalOrders: number;
  activeCollectors: number;
  todayRevenue: number;
  weeklyOrders: number;
  monthlyRevenue: number;
}