// Enums
export type VehicleTypeEnum = 'CAR' | 'BIKE' | 'TRUCK' | 'BOAT' | 'VAN' | 'SUV';
export type VehicleConditionEnum = 'JUNK' | 'DAMAGED' | 'WRECKED' | 'ACCIDENTAL' | 'FULLY_SCRAP';
export type LeadSourceEnum = 'WEBFORM' | 'CHATBOT' | 'CALL' | 'MANUAL';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'REJECTED';
export type OrderStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatusEnum = 'UNPAID' | 'PAID' | 'REFUNDED';
export type PaymentTypeEnum = 'CASH' | 'CARD' | 'ONLINE' | 'BANK_TRANSFER';
export type EmployeeRole = 'COLLECTOR' | 'ADMIN' | 'SUPERVISOR' | 'ACCOUNTANT';
export type CustomerStatus = 'ACTIVE' | 'BLOCKED';
export type PickupRequestStatus = 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
export type ScrapCategory = 'JUNK' | 'ACCIDENT_DAMAGED' | 'FULLY_SCRAP';

// Lead Interface
export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  countryCode?: string;
  email?: string;
  vehicleType: VehicleTypeEnum;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleCondition: VehicleConditionEnum;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  leadSource: LeadSourceEnum;
  photos?: string[];
  notes?: string;
  status: LeadStatus;
  organizationId: number;
  customerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Interface
export interface Order {
  id: string;
  leadId?: string;
  customerName: string;
  customerPhone: string;
  customerCountryCode?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  vehicleDetails: {
    make?: string;
    model?: string;
    year?: number;
    condition?: string;
  };
  assignedCollectorId?: string;
  pickupTime?: Date;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatusEnum;
  quotedPrice?: number;
  actualPrice?: number;
  yardId?: string;
  customerNotes?: string;
  adminNotes?: string;
  organizationId: number;
  customerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Employee Interface
export interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  countryCode?: string;
  role: EmployeeRole;
  workZone?: string;
  isActive: boolean;
  profilePhoto?: string;
  rating?: number;
  completedPickups: number;
  deviceToken?: string;
  organizationId: number;
  scrapYardId?: string;
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

// Customer Interface
export interface Customer {
  id: string;
  name: string;
  phone: string;
  countryCode?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  accountStatus: CustomerStatus;
  joinedDate: Date;
  organizationId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Scrap Yard Interface
export interface ScrapYard {
  id: string;
  yardName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  assignedEmployeeIds?: string[];
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  isActive?: boolean;
  organizationId: number;
  employees?: Array<{
    id: string;
    fullName: string;
    email: string;
    role?: {
      id: number;
      name: string;
      description?: string;
      isActive: boolean;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Interface
export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  collectorId?: string;
  amount: number;
  paymentType: PaymentTypeEnum;
  receiptUrl?: string;
  status: PaymentStatusEnum;
  organizationId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Pickup Request Interface
export interface PickupRequest {
  id: string;
  customerId: string;
  vehicleDetails: {
    make?: string;
    model?: string;
    year?: number;
    condition?: string;
    type?: string;
  };
  pickupAddress: string;
  latitude?: number;
  longitude?: number;
  status: PickupRequestStatus;
  assignedTo?: string;
  orderId?: string;
  organizationId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Review Interface
export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  collectorId: string;
  rating: number; // 1-5
  comment?: string;
  organizationId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard Stats
export interface DashboardStats {
  totalLeads: number;
  totalOrders: number;
  activeCollectors: number;
  todayRevenue: number;
  weeklyOrders: number;
  monthlyRevenue: number;
}

// Vehicle Type
export interface VehicleType {
  id: number;
  name: string;
  icon?: string;
  organizationId?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Vehicle Name
export interface VehicleName {
  id: string;
  name: string;
  vehicleTypeId: number;
  vehicleType?: VehicleType;
  scrapYardId: string;
  scrapYard?: ScrapYard;
  organizationId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
