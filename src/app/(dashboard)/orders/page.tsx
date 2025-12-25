'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderForm } from '@/components/order-form';
import { OrderAssignmentStepper } from '@/components/order-assignment-stepper';
import { Order, OrderStatus, PaymentStatusEnum } from '@/types';
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle2, Clock, ChevronDown, ArrowUpDown, Eye, MoreHorizontal, Download, Filter, Check, X, Package, MapPin, User, Users, DollarSign, Calendar, Map as MapIcon, Share2, Printer, Mail, Phone, ShoppingCart, Activity } from 'lucide-react';
import { useOrders, useDeleteOrder, useUpdateOrder, useUpdateOrderStatus, useAssignCollector, useOrderStats } from '@/hooks/use-orders';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/store/auth-store';
import { ordersApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { OrderStatusBadge, PaymentStatusBadge, toDisplayOrderStatus, toDisplayPaymentStatus } from '@/components/status-badges';

// Dynamically import Lottie for better performance
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import { motion, AnimatePresence } from 'framer-motion';

// No Data Animation Component - Optimized with lazy loading
function NoDataAnimation() {
  const [animationData, setAnimationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/animation/nodatafoundanimation.json')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load animation');
        return response.json();
      })
      .then((data) => {
        setAnimationData(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load animation:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <div className="mt-2 text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!animationData) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-gray-400 text-sm">No orders found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <p className="mt-4 text-gray-600 text-sm font-medium">No orders found</p>
      <p className="mt-1 text-gray-400 text-xs">Try adjusting your filters or create a new order</p>
    </div>
  );
}

// API response type - matches backend Order model
interface ApiOrder {
  id: string;
  orderNumber?: string; // Format: WO-DDMMYYYY-N
  leadId?: string;
  customerId?: string;
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
  assignedCollector?: {
    id: string;
    fullName: string;
    email: string;
  };
  crewId?: string;
  crew?: {
    id: string;
    name: string;
    members?: Array<{
      id: string;
      fullName: string;
      email: string;
    }>;
  };
  pickupTime?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatusEnum;
  quotedPrice?: number;
  actualPrice?: number;
  yardId?: string;
  yard?: {
    id: string;
    yardName: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  routeDistance?: string;
  routeDuration?: string;
  customerNotes?: string;
  adminNotes?: string;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  version: string;
  validationErrors: any[];
  code: number;
  status: string;
  message: string;
  data: {
    orders: ApiOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

type SortKey = 'customerName' | 'createdAt' | 'orderStatus' | 'paymentStatus';

function formatDateHuman(dateStr: string): string {
  const date = new Date(dateStr);

  if (typeof window !== 'undefined') {
    const today = new Date();
    const yday = new Date();
    yday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yday)) return 'Yesterday';
  }

  const day = date.getUTCDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month}, ${year}`;
}

function formatDateDDMMYYYY(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}




// Tab color styles for order status
type TabKey = 'All' | 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
function getTabStyle(tab: TabKey) {
  switch (tab) {
    case 'All':
      return { activeText: 'text-cyan-700', activeBg: 'bg-cyan-50', underline: 'bg-cyan-500', count: 'bg-cyan-100 text-cyan-700' };
    case 'Pending':
      return { activeText: 'text-yellow-700', activeBg: 'bg-yellow-50', underline: 'bg-yellow-600', count: 'bg-yellow-100 text-yellow-700' };
    case 'Assigned':
      return { activeText: 'text-blue-700', activeBg: 'bg-blue-50', underline: 'bg-blue-600', count: 'bg-blue-100 text-blue-700' };
    case 'In Progress':
      return { activeText: 'text-orange-700', activeBg: 'bg-orange-50', underline: 'bg-orange-600', count: 'bg-orange-100 text-orange-700' };
    case 'Completed':
      return { activeText: 'text-green-700', activeBg: 'bg-green-50', underline: 'bg-green-600', count: 'bg-green-100 text-green-700' };
    case 'Cancelled':
      return { activeText: 'text-red-700', activeBg: 'bg-red-50', underline: 'bg-red-600', count: 'bg-red-100 text-red-700' };
    default:
      return { activeText: 'text-primary', activeBg: 'bg-muted', underline: 'bg-primary', count: 'bg-muted text-foreground' };
  }
}

// Order Avatar Component
function OrderAvatar({
  name,
  size = 'md',
  className = ''
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const firstLetter = (name || 'O').charAt(0).toUpperCase();
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-300 ${className}`}>
      <span className="text-white font-semibold leading-none">
        {firstLetter}
      </span>
    </div>
  );
}





// Enhanced Personnel Profile Dialog Component - Inspired by Customer Profile View
function CollectorInfoDialog({
  order,
  isOpen,
  onClose
}: {
  order: ApiOrder | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  if (!order) return null;

  // Determine if this is a crew assignment or individual collector
  const isCrew = !!order.crewId;
  const personnelData = isCrew ? order.crew : order.assignedCollector;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) return;
    }}>
      <DialogContent
        className="sm:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideClose={true}
      >
        {/* Header Section - Customer Profile Inspired */}
        <div className="relative bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 -m-6 mb-0 px-6 py-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border-4 border-white/30">
                  {isCrew ? (
                    <Users className="h-10 w-10 text-white" />
                  ) : (
                    <User className="h-10 w-10 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">
                    {isCrew ? order.crew?.name : order.assignedCollector?.fullName || 'Personnel Details'}
                  </h2>
                  <p className="text-cyan-100 text-sm font-medium">
                    {isCrew ? 'Crew Assignment' : 'Individual Collector'} • Order #{order.orderNumber || order.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={order.orderStatus} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-cyan-100 font-medium">Pickup Date</p>
                    <p className="text-sm font-bold text-white">
                      {order.pickupTime ? new Date(order.pickupTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <MapIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-cyan-100 font-medium">Distance</p>
                    <p className="text-sm font-bold text-white">{order.routeDistance || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-cyan-100 font-medium">Duration</p>
                    <p className="text-sm font-bold text-white">{order.routeDuration || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Crew Members Section - Only for Crew Assignments */}
          {isCrew && order.crew?.members && order.crew.members.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-600" />
                Crew Members ({order.crew.members.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {order.crew.members.map((member: any) => (
                  <div
                    key={member.id}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 p-4 hover:border-cyan-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      onClose();
                      router.push(`/employees?view=${member.id}&returnTo=/orders`);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-lg">
                          {member.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-base truncate group-hover:text-cyan-600 transition-colors">
                          {member.fullName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-600 truncate">{member.email}</p>
                        </div>
                      </div>
                      <Eye className="h-5 w-5 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Collector Details - Only for Single Collector */}
          {!isCrew && order.assignedCollector && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-600" />
                Collector Information
              </h3>
              <div
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-cyan-50 border-2 border-cyan-100 p-6 hover:border-cyan-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => {
                  onClose();
                  router.push(`/employees?view=${order.assignedCollectorId}&returnTo=/orders`);
                }}
              >
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-2xl">
                      {order.assignedCollector.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-2xl font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">
                        {order.assignedCollector.fullName}
                      </h4>
                      <Eye className="h-6 w-6 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-cyan-600" />
                        <span className="text-sm text-gray-700 font-medium">{order.assignedCollector.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-cyan-600" />
                        <span className="text-sm text-gray-700 font-medium">ID: {order.assignedCollectorId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Vehicle Details */}
            <div className="rounded-xl bg-white border-2 border-indigo-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
                    Vehicle Details
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {order.vehicleDetails?.make && (
                      <div className="bg-indigo-50 rounded-lg p-2">
                        <span className="text-[10px] font-semibold text-indigo-500 uppercase block mb-0.5">Make</span>
                        <span className="text-sm font-bold text-gray-900">{order.vehicleDetails.make}</span>
                      </div>
                    )}
                    {order.vehicleDetails?.model && (
                      <div className="bg-indigo-50 rounded-lg p-2">
                        <span className="text-[10px] font-semibold text-indigo-500 uppercase block mb-0.5">Model</span>
                        <span className="text-sm font-bold text-gray-900">{order.vehicleDetails.model}</span>
                      </div>
                    )}
                    {order.vehicleDetails?.year && (
                      <div className="bg-indigo-50 rounded-lg p-2">
                        <span className="text-[10px] font-semibold text-indigo-500 uppercase block mb-0.5">Year</span>
                        <span className="text-sm font-bold text-gray-900">{order.vehicleDetails.year}</span>
                      </div>
                    )}
                    {order.vehicleDetails?.condition && (
                      <div className="bg-indigo-50 rounded-lg p-2">
                        <span className="text-[10px] font-semibold text-indigo-500 uppercase block mb-0.5">Condition</span>
                        <span className="text-sm font-bold text-gray-900 capitalize">
                          {order.vehicleDetails.condition.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                  {!order.vehicleDetails?.make && !order.vehicleDetails?.model && (
                    <p className="text-sm text-gray-400 italic">No vehicle details available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Scrap Yard */}
            {order.yardId && (
              <div className="rounded-xl bg-white border-2 border-green-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
                      Scrap Yard
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {order.yard?.yardName || order.yardId}
                    </p>
                    {order.yard?.address && (
                      <p className="text-sm text-gray-600 mt-1">{order.yard.address}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Collection Address */}
            <div className="rounded-xl bg-white border-2 border-orange-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">
                    Collection Address
                  </p>
                  <p className="text-base font-bold text-gray-900 leading-relaxed">{order.address}</p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="rounded-xl bg-white border-2 border-blue-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                    Customer
                  </p>
                  <p className="text-base font-bold text-gray-900">{order.customerName}</p>
                  <p className="text-sm text-gray-600 mt-1">{order.customerPhone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center gap-3 px-6 py-4 border-t bg-gray-50 -mx-6 -mb-6 mt-auto">
          <p className="text-xs text-gray-500">
            Click on any personnel card to view their complete profile
          </p>
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// Premium Stat Card Component
function StatCard({ title, value, color, icon: Icon, delay = 0 }: { title: string, value: number, color: string, icon: any, delay?: number }) {
  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        delay
      }
    }
  };

  const getGradient = (c: string) => {
    switch (c) {
      case 'cyan': return 'from-cyan-500 to-blue-600 shadow-cyan-200/50';
      case 'yellow': return 'from-amber-400 to-orange-500 shadow-orange-200/50';
      case 'blue': return 'from-blue-500 to-indigo-600 shadow-blue-200/50';
      case 'orange': return 'from-orange-400 to-red-500 shadow-red-200/50';
      case 'green': return 'from-emerald-400 to-green-600 shadow-green-200/50';
      case 'red': return 'from-rose-500 to-red-700 shadow-red-200/50';
      default: return 'from-gray-400 to-gray-600 shadow-gray-200/50';
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -8, scale: 1.02 }}
      className={cn(
        "relative overflow-hidden group h-[130px] rounded-[32px] p-0.5 transition-all duration-500 shadow-xl",
        getGradient(color)
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", getGradient(color).split(' ').slice(0, 2).join(' '))} />

      {/* Glossy Top Edge Light */}
      <div className="absolute top-[1px] left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-30" />

      {/* Glass Surface Overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] m-1 rounded-[30px] border border-white/20 z-10" />

      <div className="relative z-30 flex flex-col justify-between h-full p-5 text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-[2px] mb-1">{title}</p>
            <div className="text-3xl font-black tracking-tight drop-shadow-lg">
              {value.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex justify-end">
          <motion.div
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | undefined>();
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled'>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailsOrder, setDetailsOrder] = useState<ApiOrder | null>(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ApiOrder | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Selection state
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [collectorInfoOrder, setCollectorInfoOrder] = useState<ApiOrder | null>(null);
  const [assignmentOrder, setAssignmentOrder] = useState<ApiOrder | null>(null);
  const [isAssignmentStepperOpen, setIsAssignmentStepperOpen] = useState(false);

  // Mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle edit parameter from URL
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && organizationId) {
      const fetchAndEdit = async () => {
        try {
          const response = await ordersApi.getOrder(editId);
          if (response.data) {
            const o = response.data;
            const convertedOrder: Order = {
              id: o.id,
              leadId: o.leadId,
              customerId: o.customerId,
              customerName: o.customerName,
              customerPhone: o.customerPhone,
              customerCountryCode: o.customerCountryCode,
              address: o.address,
              latitude: o.latitude,
              longitude: o.longitude,
              vehicleDetails: o.vehicleDetails,
              assignedCollectorId: o.assignedCollectorId,
              pickupTime: o.pickupTime ? new Date(o.pickupTime) : undefined,
              orderStatus: o.orderStatus,
              paymentStatus: o.paymentStatus,
              quotedPrice: o.quotedPrice,
              actualPrice: o.actualPrice,
              yardId: o.yardId,
              customerNotes: o.customerNotes,
              adminNotes: o.adminNotes,
              organizationId: o.organizationId,
              createdAt: new Date(o.createdAt),
              updatedAt: new Date(o.updatedAt),
            };
            setEditingOrder(convertedOrder);
            setIsFormOpen(true);

            // Clean up URL
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.delete('edit');
            const newUrl = newSearchParams.toString()
              ? `${window.location.pathname}?${newSearchParams.toString()}`
              : window.location.pathname;
            router.replace(newUrl);
          }
        } catch (e) {
          console.error('Failed to fetch order for editing', e);
        }
      };
      fetchAndEdit();
    }
  }, [searchParams, router, organizationId]);

  // Handle highlight parameter from URL
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setHighlightedOrderId(highlightId);
      setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('highlight');
        const newUrl = newSearchParams.toString()
          ? `${window.location.pathname}?${newSearchParams.toString()}`
          : window.location.pathname;
        router.replace(newUrl);
        setTimeout(() => setHighlightedOrderId(null), 3000);
      }, 100);
    }
  }, [searchParams, router]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Map tab to status for API
  const getStatusFromTab = (tab: string): OrderStatus | undefined => {
    const statusMap: Record<string, OrderStatus> = {
      'Pending': 'PENDING',
      'Assigned': 'ASSIGNED',
      'In Progress': 'IN_PROGRESS',
      'Completed': 'COMPLETED',
      'Cancelled': 'CANCELLED'
    };
    return tab === 'All' ? undefined : statusMap[tab];
  };

  // Map sort key to API sortBy
  const getApiSortBy = (key: SortKey): 'customerName' | 'createdAt' | 'orderStatus' | 'paymentStatus' => {
    const sortMap: Record<SortKey, 'customerName' | 'createdAt' | 'orderStatus' | 'paymentStatus'> = {
      'customerName': 'customerName',
      'createdAt': 'createdAt',
      'orderStatus': 'orderStatus',
      'paymentStatus': 'paymentStatus'
    };
    return sortMap[key] || 'createdAt';
  };

  // Memoize payment filter value
  const paymentFilterValue = useMemo(() => paymentFilter !== 'ALL' ? paymentFilter as PaymentStatusEnum : undefined, [paymentFilter]);

  // Memoize query parameters for better performance
  const queryParams = useMemo(() => {
    const status = getStatusFromTab(activeTab);
    const sortBy = getApiSortBy(sortKey);
    return {
      page: currentPage,
      limit: rowsPerPage,
      search: debouncedSearchTerm || undefined,
      status: status,
      paymentStatus: paymentFilterValue,
      sortBy: sortBy,
      sortOrder: sortDir,
    };
  }, [currentPage, rowsPerPage, debouncedSearchTerm, activeTab, paymentFilterValue, sortKey, sortDir]);

  // API hooks with server-side pagination, filtering, and sorting
  const { data: ordersData, isLoading, error } = useOrders(queryParams);
  const deleteOrderMutation = useDeleteOrder();
  const updateOrderMutation = useUpdateOrder();
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const assignCollectorMutation = useAssignCollector();

  // Fetch unified stats for tab counts (one combined request instead of 6)
  const { data: statsData } = useOrderStats();

  // Calculate stats from the stats API response
  const stats = useMemo(() => {
    return {
      total: statsData?.data?.total || 0,
      pending: statsData?.data?.pending || 0,
      assigned: statsData?.data?.assigned || 0,
      inProgress: statsData?.data?.inProgress || 0,
      completed: statsData?.data?.completed || 0,
      cancelled: statsData?.data?.cancelled || 0,
      unpaid: statsData?.data?.unpaid || 0,
      paid: statsData?.data?.paid || 0,
      refunded: statsData?.data?.refunded || 0,
    };
  }, [statsData]);

  // Handle the actual API response structure
  const apiResponse = ordersData as unknown as ApiResponse;
  const orders = useMemo(() => apiResponse?.data?.orders || [], [apiResponse]);
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  }, [apiResponse]);

  // Scroll to highlighted row when data is loaded
  useEffect(() => {
    if (highlightedOrderId && highlightedRowRef.current && orders && orders.length > 0) {
      setTimeout(() => {
        highlightedRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  }, [highlightedOrderId, orders]);

  const totalOrders = pagination.total;

  // Map stats to tab counts
  const getTabCount = (tab: string): number => {
    switch (tab) {
      case 'All':
        return stats.total || 0;
      case 'Pending':
        return stats.pending || 0;
      case 'Assigned':
        return stats.assigned || 0;
      case 'In Progress':
        return stats.inProgress || 0;
      case 'Completed':
        return stats.completed || 0;
      case 'Cancelled':
        return stats.cancelled || 0;
      default:
        return 0;
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, paymentFilter, rowsPerPage]);

  // Prefetch next page for better UX
  useEffect(() => {
    if (currentPage < pagination.totalPages && organizationId) {
      const nextPageParams = {
        ...queryParams,
        page: currentPage + 1,
        organizationId,
      };
      queryClient.prefetchQuery({
        queryKey: queryKeys.orders.list(nextPageParams),
        queryFn: () => ordersApi.getOrders(nextPageParams),
        staleTime: 3 * 60 * 1000,
      });
    }
  }, [currentPage, pagination.totalPages, queryClient, organizationId, queryParams]);

  const handleDeleteClick = (order: ApiOrder) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      await deleteOrderMutation.mutateAsync(orderToDelete.id);
      toast.success(`Order "${orderToDelete.customerName}" deleted successfully`);
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Handle checkbox selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(orders.map(order => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const isAllSelected = orders.length > 0 && selectedOrders.size === orders.length;
  const isIndeterminate = selectedOrders.size > 0 && selectedOrders.size < orders.length;

  // Handle export
  const handleExport = () => {
    if (selectedOrders.size === 0) {
      toast.info('Please select orders to export');
      return;
    }
    toast.success(`Exporting ${selectedOrders.size} orders...`);
    // TODO: Implement export functionality
  };

  const onInlineStatusChange = async (order: ApiOrder, value: string) => {
    try {
      const validStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(value.toUpperCase())) {
        toast.error(`Invalid status: ${value}`);
        return;
      }

      const normalizedStatus = value.toUpperCase() as OrderStatus;

      if (order.orderStatus.toUpperCase() === normalizedStatus) {
        return;
      }

      await updateOrderStatusMutation.mutateAsync({
        orderId: String(order.id),
        status: normalizedStatus
      });
      toast.success('Status updated successfully');
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to update status';
      toast.error(errorMessage);
      console.error('Status update error:', e);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading orders</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - New Premium Design */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Orders" value={stats.total} color="cyan" icon={ShoppingCart} delay={0} />
        <StatCard title="Pending" value={stats.pending} color="yellow" icon={Clock} delay={0.1} />
        <StatCard title="Assigned" value={stats.assigned} color="blue" icon={User} delay={0.2} />
        <StatCard title="In Progress" value={stats.inProgress} color="orange" icon={Activity} delay={0.3} />
        <StatCard title="Completed" value={stats.completed} color="green" icon={CheckCircle2} delay={0.4} />
        <StatCard title="Cancelled" value={stats.cancelled} color="red" icon={X} delay={0.5} />
      </div>

      {/* Orders List Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 rounded-[32px] overflow-hidden"
      >
        <div className="p-6 pb-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-cyan-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 active:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-9 w-9 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>

              {isSearchOpen && (
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => {
                      if (!searchTerm) {
                        setIsSearchOpen(false);
                      }
                    }}
                    autoFocus
                    className="w-64 pl-10 pr-10 rounded-lg border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setIsSearchOpen(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 active:bg-gray-200 transition-all h-9 w-9 p-0 ${paymentFilter !== 'ALL' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : ''
                  } ${isFilterOpen ? 'border-cyan-500 bg-cyan-50' : ''
                  }`}
                title={isFilterOpen ? "Hide filters" : "Show filters"}
              >
                <Filter className={`h-4 w-4 ${paymentFilter !== 'ALL' ? 'text-cyan-700' : ''}`} />
              </Button>

              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                title="Add Order"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Payment Filter - Only shown when filter icon is clicked */}
          {isFilterOpen && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Payment:</Label>
                  <Select
                    value={paymentFilter || 'ALL'}
                    onValueChange={(v) => {
                      setPaymentFilter(v);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className={`w-[200px] bg-white border-gray-200 hover:border-gray-300 transition-all ${paymentFilter !== 'ALL' ? 'border-cyan-500 ring-2 ring-cyan-200' : ''
                      }`}>
                      <SelectValue placeholder="All Payment Status">
                        {paymentFilter === 'ALL' ? 'All Payment Status' : toDisplayPaymentStatus(paymentFilter)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Payment Status</SelectItem>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  {paymentFilter !== 'ALL' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPaymentFilter('ALL');
                        setCurrentPage(1);
                      }}
                      className="h-8 px-2 text-gray-500 hover:text-gray-700"
                      title="Clear filter"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilterOpen(false)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  title="Close filter panel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="p-0">
          {isLoading || !mounted ? (
            <div className="p-4">
              <TableSkeleton columnCount={8} rowCount={rowsPerPage} />
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="overflow-x-auto hidden sm:block">
                <Table>
                  <TableHeader className="bg-white">
                    {/* Status Tabs Row */}
                    <TableRow className="hover:bg-transparent border-b-2 border-gray-200 bg-gray-50/50">
                      <TableHead colSpan={9} className="p-0 bg-transparent h-auto">
                        <div className="w-full overflow-x-auto">
                          <div className="inline-flex items-center gap-1 px-6 py-3">
                            {(['All', 'Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled'] as const).map((tab) => {
                              const style = getTabStyle(tab);
                              const isActive = activeTab === tab;
                              return (
                                <button
                                  key={tab}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setActiveTab(tab);
                                    setCurrentPage(1);
                                  }}
                                  className={`relative px-4 py-2 text-sm font-medium transition-all rounded-t-md ${isActive ? `${style.activeText} ${style.activeBg} shadow-sm` : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    {tab}
                                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${style.count}`}>
                                      {getTabCount(tab)}
                                    </span>
                                  </span>
                                  {isActive && <span className={`absolute left-0 right-0 -bottom-0.5 h-0.5 ${style.underline} rounded`} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </TableHead>
                    </TableRow>
                    {/* Column Headers Row */}
                    <TableRow className="hover:bg-transparent border-b bg-white">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                        />
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('customerName')}>
                          Customer
                          {sortKey === 'customerName' && <ArrowUpDown className="h-3 w-3" />}
                        </button>
                      </TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Collector</TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('orderStatus')}>
                          Order Status
                          {sortKey === 'orderStatus' && <ArrowUpDown className="h-3 w-3" />}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('paymentStatus')}>
                          Payment
                          {sortKey === 'paymentStatus' && <ArrowUpDown className="h-3 w-3" />}
                        </button>
                      </TableHead>
                      <TableHead className="w-12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <NoDataAnimation />
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => {
                        const isHighlighted = highlightedOrderId === order.id;
                        return (
                          <TableRow
                            key={order.id}
                            ref={isHighlighted ? highlightedRowRef : null}
                            className={cn(
                              "border-b hover:bg-gray-50 transition-colors bg-white cursor-pointer",
                              isHighlighted && "bg-cyan-50 border-cyan-200 border-2 animate-pulse"
                            )}
                            onClick={() => router.push(`/orders/${order.id}`)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedOrders.has(order.id)}
                                onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                                onClick={(e) => e.stopPropagation()}
                                className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <OrderAvatar
                                  name={order.customerName || 'N/A'}
                                  size="md"
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">{order.customerName || 'N/A'}</span>
                                  <span className="text-xs text-gray-500">{order.customerPhone || 'N/A'}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-cyan-600">{order.orderNumber || 'N/A'}</span>
                                <span className="text-xs text-gray-500">{formatDateDDMMYYYY(order.createdAt)}</span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-start gap-2 pt-1">
                                <Clock className="h-4 w-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-700">{formatTime(order.pickupTime || order.createdAt)}</span>
                                  {order.pickupTime && (
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Pickup</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-start gap-2 max-w-[200px] pt-1">
                                <MapPin className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                                <span className="truncate text-sm text-gray-700 font-medium">{order.address || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {order.assignedCollector || order.assignedCollectorId || order.crewId ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCollectorInfoOrder(order);
                                  }}
                                  className={cn(
                                    "h-8 text-xs font-semibold hover:bg-opacity-10 rounded-full px-3",
                                    order.crewId ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                                  )}
                                >
                                  {order.crewId ? (
                                    <Users className="h-4 w-4 mr-1.5" />
                                  ) : (
                                    <User className="h-4 w-4 mr-1.5" />
                                  )}
                                  {order.crew?.name || order.assignedCollector?.fullName || 'View Details'}
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAssignmentOrder(order);
                                    setIsAssignmentStepperOpen(true);
                                  }}
                                  className="h-7 text-xs"
                                >
                                  Assign
                                </Button>
                              )}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={order.orderStatus || 'PENDING'}
                                onValueChange={(v) => onInlineStatusChange(order, v)}
                              >
                                <SelectTrigger className="h-auto w-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none max-w-none min-w-0 overflow-visible">
                                  <div className="flex items-center">
                                    <OrderStatusBadge status={order.orderStatus || 'PENDING'} showDropdownIcon={true} />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="min-w-[170px] rounded-lg shadow-xl border border-gray-200 bg-white p-1.5 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2">
                                  {(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as OrderStatus[]).map((s) => {
                                    const isSelected = (order.orderStatus || 'PENDING') === s;

                                    // Status Config for Icons and Colors
                                    const statusConfig = {
                                      PENDING: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                                      ASSIGNED: { icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
                                      IN_PROGRESS: { icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
                                      COMPLETED: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
                                      CANCELLED: { icon: X, color: 'text-red-500', bg: 'bg-red-50' }
                                    };

                                    const config = statusConfig[s];
                                    const Icon = config.icon;

                                    return (
                                      <SelectItem
                                        key={s}
                                        value={s}
                                        className={cn(
                                          "relative cursor-pointer rounded-md px-3 py-2.5 text-sm transition-all pl-9 hover:bg-gray-50",
                                          isSelected
                                            ? "bg-cyan-50 text-cyan-700 font-semibold"
                                            : "text-gray-700"
                                        )}
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <div className={cn(
                                            "flex items-center justify-center h-5 w-5 rounded-md",
                                            isSelected ? "bg-white/80 shadow-sm" : config.bg
                                          )}>
                                            <Icon className={cn("h-3.5 w-3.5", config.color)} />
                                          </div>
                                          <span>{toDisplayOrderStatus(s)}</span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <PaymentStatusBadge status={order.paymentStatus} />
                            </TableCell>

                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4 text-gray-600" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    const convertedOrder: Order = {
                                      id: order.id,
                                      leadId: order.leadId,
                                      customerId: order.customerId,
                                      customerName: order.customerName,
                                      customerPhone: order.customerPhone,
                                      customerCountryCode: order.customerCountryCode,
                                      address: order.address,
                                      latitude: order.latitude,
                                      longitude: order.longitude,
                                      vehicleDetails: order.vehicleDetails,
                                      assignedCollectorId: order.assignedCollectorId,
                                      pickupTime: order.pickupTime ? new Date(order.pickupTime) : undefined,
                                      orderStatus: order.orderStatus,
                                      paymentStatus: order.paymentStatus,
                                      quotedPrice: order.quotedPrice,
                                      actualPrice: order.actualPrice,
                                      yardId: order.yardId,
                                      crewId: order.crewId,
                                      routeDistance: order.routeDistance,
                                      routeDuration: order.routeDuration,
                                      customerNotes: order.customerNotes,
                                      adminNotes: order.adminNotes,
                                      organizationId: order.organizationId,
                                      createdAt: new Date(order.createdAt),
                                      updatedAt: new Date(order.updatedAt),
                                    };
                                    setEditingOrder(convertedOrder);
                                    setIsFormOpen(true);
                                  }}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(order);
                                    }}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {orders.length === 0 ? (
                  <div className="py-8">
                    <NoDataAnimation />
                  </div>
                ) : (
                  orders.map((order) => {
                    const isHighlighted = highlightedOrderId === order.id;
                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        ref={isHighlighted ? highlightedRowRef : null}
                        className={cn(
                          "relative overflow-hidden group rounded-[24px] border-2 bg-white p-5 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer",
                          isHighlighted ? "border-cyan-500 ring-4 ring-cyan-100" : "border-gray-100 hover:border-cyan-200"
                        )}
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        {/* Modern Header for Mobile Card */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <OrderAvatar name={order.customerName || 'N/A'} size="md" className="ring-2 ring-white shadow-md" />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center">
                                <Package className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 group-hover:text-cyan-600 transition-colors leading-tight">
                                {order.customerName || 'N/A'}
                              </h4>
                              <p className="text-[10px] font-black tracking-widest text-cyan-600 uppercase mt-0.5">
                                {order.orderNumber || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <OrderStatusBadge status={order.orderStatus} />
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </div>
                        </div>

                        {/* Order Details Grid */}
                        <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50 mb-4">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Created</p>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-cyan-500" />
                              <span className="text-xs font-semibold text-gray-700">{formatDateHuman(order.createdAt)}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pickup Time</p>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span className="text-xs font-semibold text-gray-700">{formatTime(order.pickupTime || order.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Address Section */}
                        <div className="flex items-start gap-3 mb-4 bg-gray-50 rounded-xl p-3">
                          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-rose-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Address</p>
                            <p className="text-xs text-gray-600 truncate font-medium">{order.address || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Actions Section */}
                        <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {order.assignedCollector || order.assignedCollectorId ? (
                              <div className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-cyan-50 border border-cyan-100">
                                <User className="w-3 h-3 text-cyan-600" />
                                <span className="text-[10px] font-bold text-cyan-700 truncate max-w-[80px]">
                                  {order.assignedCollector?.fullName?.split(' ')[0] || 'Assigned'}
                                </span>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssignmentOrder(order);
                                  setIsAssignmentStepperOpen(true);
                                }}
                                className="h-7 text-[10px] rounded-full border-dashed border-cyan-300 text-cyan-600 hover:bg-cyan-50"
                              >
                                Assign Collector
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/orders/${order.id}`)}
                              className="h-8 w-8 rounded-full bg-gray-50 hover:bg-cyan-100 text-gray-600 hover:text-cyan-600 transition-all p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const convertedOrder: Order = {
                                  id: order.id,
                                  leadId: order.leadId,
                                  customerId: order.customerId,
                                  customerName: order.customerName,
                                  customerPhone: order.customerPhone,
                                  customerCountryCode: order.customerCountryCode,
                                  address: order.address,
                                  latitude: order.latitude,
                                  longitude: order.longitude,
                                  vehicleDetails: order.vehicleDetails,
                                  assignedCollectorId: order.assignedCollectorId,
                                  pickupTime: order.pickupTime ? new Date(order.pickupTime) : undefined,
                                  orderStatus: order.orderStatus,
                                  paymentStatus: order.paymentStatus,
                                  quotedPrice: order.quotedPrice,
                                  actualPrice: order.actualPrice,
                                  yardId: order.yardId,
                                  customerNotes: order.customerNotes,
                                  adminNotes: order.adminNotes,
                                  organizationId: order.organizationId,
                                  createdAt: new Date(order.createdAt),
                                  updatedAt: new Date(order.updatedAt),
                                };
                                setEditingOrder(convertedOrder);
                                setIsFormOpen(true);
                              }}
                              className="h-8 w-8 rounded-full bg-gray-50 hover:bg-amber-100 text-gray-600 hover:text-amber-600 transition-all p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(order);
                              }}
                              className="h-8 w-8 rounded-full bg-gray-50 hover:bg-rose-100 text-gray-600 hover:text-rose-600 transition-all p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Subtle Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                      </motion.div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Pagination Controls */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
            <div className="flex items-center gap-4">
              <RowsPerPage
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value);
                  setCurrentPage(1);
                }}
                options={[5, 10, 20, 50, 100]}
              />
              <div className="text-xs text-gray-500 font-medium">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalOrders)} of {totalOrders} orders
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Sticky Add button for mobile */}
      <Button onClick={() => setIsFormOpen(true)} className="sm:hidden fixed bottom-6 right-6 rounded-full shadow-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white transform hover:scale-110 transition-all duration-200 hover:shadow-2xl">
        <Plus className="mr-2 h-4 w-4" /> Add Order
      </Button>

      {/* Quick View Dialog */}
      <Dialog open={!!detailsOrder} onOpenChange={(open) => !open && setDetailsOrder(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-bold text-gray-900">Order Details</DialogTitle>
            <div className="flex items-center gap-2">
              {detailsOrder && (
                <Button
                  onClick={() => {
                    const convertedOrder: Order = {
                      id: detailsOrder.id,
                      leadId: detailsOrder.leadId,
                      customerId: detailsOrder.customerId,
                      customerName: detailsOrder.customerName,
                      customerPhone: detailsOrder.customerPhone,
                      customerCountryCode: detailsOrder.customerCountryCode,
                      address: detailsOrder.address,
                      latitude: detailsOrder.latitude,
                      longitude: detailsOrder.longitude,
                      vehicleDetails: detailsOrder.vehicleDetails,
                      assignedCollectorId: detailsOrder.assignedCollectorId,
                      pickupTime: detailsOrder.pickupTime ? new Date(detailsOrder.pickupTime) : undefined,
                      orderStatus: detailsOrder.orderStatus,
                      paymentStatus: detailsOrder.paymentStatus,
                      quotedPrice: detailsOrder.quotedPrice,
                      actualPrice: detailsOrder.actualPrice,
                      yardId: detailsOrder.yardId,
                      customerNotes: detailsOrder.customerNotes,
                      adminNotes: detailsOrder.adminNotes,
                      organizationId: detailsOrder.organizationId,
                      createdAt: new Date(detailsOrder.createdAt),
                      updatedAt: new Date(detailsOrder.updatedAt),
                    };
                    setEditingOrder(convertedOrder);
                    setIsFormOpen(true);
                    setDetailsOrder(null);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setDetailsOrder(null)}
                className="border-gray-200 bg-white hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {detailsOrder && (
            <div className="space-y-6 py-4">
              {/* Customer Information */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-cyan-300 shadow-sm">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Order</span>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-cyan-600">{detailsOrder.orderNumber || 'N/A'}</span>
                        <span className="text-xs text-gray-500">{formatDateDDMMYYYY(detailsOrder.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Customer Name</span>
                      <span className="text-sm font-medium text-gray-900">{detailsOrder.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Phone</span>
                      <span className="text-sm font-medium text-gray-900">{detailsOrder.customerPhone}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Address</span>
                      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{detailsOrder.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                    Order Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Order Status</span>
                      <OrderStatusBadge status={detailsOrder.orderStatus} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Payment Status</span>
                      <PaymentStatusBadge status={detailsOrder.paymentStatus} />
                    </div>
                    {detailsOrder.quotedPrice && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Quoted Price</span>
                        <span className="text-sm font-medium text-gray-900">${detailsOrder.quotedPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {detailsOrder.actualPrice && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Actual Price</span>
                        <span className="text-sm font-medium text-green-600">${detailsOrder.actualPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {detailsOrder.pickupTime && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pickup Time</span>
                        <span className="text-sm font-medium text-gray-900">{formatDateHuman(detailsOrder.pickupTime)}</span>
                      </div>
                    )}
                    {detailsOrder.assignedCollector && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Assigned Collector</span>
                        <span className="text-sm font-medium text-gray-900">{detailsOrder.assignedCollector.fullName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              {detailsOrder.vehicleDetails && (detailsOrder.vehicleDetails.make || detailsOrder.vehicleDetails.model || detailsOrder.vehicleDetails.year || detailsOrder.vehicleDetails.condition) && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                      Vehicle Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {detailsOrder.vehicleDetails.make && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Make</span>
                          <span className="text-sm font-medium text-gray-900">{detailsOrder.vehicleDetails.make}</span>
                        </div>
                      )}
                      {detailsOrder.vehicleDetails.model && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Model</span>
                          <span className="text-sm font-medium text-gray-900">{detailsOrder.vehicleDetails.model}</span>
                        </div>
                      )}
                      {detailsOrder.vehicleDetails.year && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Year</span>
                          <span className="text-sm font-medium text-gray-900">{detailsOrder.vehicleDetails.year}</span>
                        </div>
                      )}
                      {detailsOrder.vehicleDetails.condition && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Condition</span>
                          <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-md text-sm font-medium capitalize">{String(detailsOrder.vehicleDetails.condition).replace(/_/g, ' ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {(detailsOrder.customerNotes || detailsOrder.adminNotes) && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Notes</h3>
                    {detailsOrder.customerNotes && (
                      <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Customer Notes</div>
                        <div className="text-sm text-gray-700">{detailsOrder.customerNotes}</div>
                      </div>
                    )}
                    {detailsOrder.adminNotes && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Admin Notes</div>
                        <div className="text-sm text-gray-700">{detailsOrder.adminNotes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <OrderForm
        order={editingOrder}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingOrder(undefined);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Delete Order
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            {orderToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <OrderAvatar
                    name={orderToDelete.customerName || 'N/A'}
                    size="md"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {orderToDelete.customerName || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Order #{orderToDelete.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setOrderToDelete(null);
              }}
              disabled={deleteOrderMutation.isPending}
              className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteOrderMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Order
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collector Info Dialog */}
      <CollectorInfoDialog
        order={collectorInfoOrder}
        isOpen={!!collectorInfoOrder}
        onClose={() => setCollectorInfoOrder(null)}
      />

      {/* Order Assignment Stepper */}
      {assignmentOrder && (
        <OrderAssignmentStepper
          order={{
            id: assignmentOrder.id,
            leadId: assignmentOrder.leadId,
            customerId: assignmentOrder.customerId,
            customerName: assignmentOrder.customerName,
            customerPhone: assignmentOrder.customerPhone,
            customerCountryCode: assignmentOrder.customerCountryCode,
            address: assignmentOrder.address,
            latitude: assignmentOrder.latitude,
            longitude: assignmentOrder.longitude,
            vehicleDetails: assignmentOrder.vehicleDetails,
            assignedCollectorId: assignmentOrder.assignedCollectorId,
            crewId: assignmentOrder.crewId,
            pickupTime: assignmentOrder.pickupTime ? new Date(assignmentOrder.pickupTime) : undefined,
            orderStatus: assignmentOrder.orderStatus,
            paymentStatus: assignmentOrder.paymentStatus,
            quotedPrice: assignmentOrder.quotedPrice,
            actualPrice: assignmentOrder.actualPrice,
            yardId: assignmentOrder.yardId,
            customerNotes: assignmentOrder.customerNotes,
            adminNotes: assignmentOrder.adminNotes,
            organizationId: assignmentOrder.organizationId,
            createdAt: new Date(assignmentOrder.createdAt),
            updatedAt: new Date(assignmentOrder.updatedAt),
          }}
          isOpen={isAssignmentStepperOpen}
          onClose={() => {
            setIsAssignmentStepperOpen(false);
            setAssignmentOrder(null);
          }}
          onSuccess={() => {
            setIsAssignmentStepperOpen(false);
            setAssignmentOrder(null);
            // Invalidate queries to refresh the table
            queryClient.invalidateQueries({ queryKey: ['orders'] });
          }}
        />
      )}
    </div>
  );
}
