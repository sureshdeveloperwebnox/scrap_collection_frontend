'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit2, Trash2, Loader2, X, Filter, Tag, Tags } from 'lucide-react';
import {
  useScrapCategories,
  useCreateScrapCategory,
  useUpdateScrapCategory,
  useDeleteScrapCategory,
  useScrapNames,
  useCreateScrapName,
  useUpdateScrapName,
  useDeleteScrapName,
} from '@/hooks/use-scrap';
import { ScrapCategoryDto, ScrapNameDto } from '@/lib/api/scrap';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';

// Dynamically import Lottie for better performance
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// No Data Animation Component
function NoDataAnimation({ message = 'No data found', description }: { message?: string; description?: string }) {
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
        <div className="text-gray-400 text-sm">{message}</div>
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
      <p className="mt-4 text-gray-600 text-sm font-medium">{message}</p>
      {description && <p className="mt-1 text-gray-400 text-xs">{description}</p>}
    </div>
  );
}

// Category Icon Component
function CategoryIcon({ className = '' }: { className?: string }) {
  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-300 ${className}`}>
      <Tag className="h-5 w-5 text-white" />
    </div>
  );
}

// Scrap Name Icon Component
function ScrapNameIcon({ className = '' }: { className?: string }) {
  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-300 ${className}`}>
      <Tags className="h-5 w-5 text-white" />
    </div>
  );
}

type TabKey = 'categories' | 'names';

function getTabStyle(tab: TabKey) {
  switch (tab) {
    case 'categories':
      return { activeText: 'text-purple-700', activeBg: 'bg-purple-50', underline: 'bg-purple-500', count: 'bg-purple-100 text-purple-700' };
    case 'names':
      return { activeText: 'text-cyan-700', activeBg: 'bg-cyan-50', underline: 'bg-cyan-500', count: 'bg-cyan-100 text-cyan-700' };
    default:
      return { activeText: 'text-primary', activeBg: 'bg-muted', underline: 'bg-primary', count: 'bg-muted text-foreground' };
  }
}

interface CategoryApiResponse {
  data: {
    scrapCategories: ScrapCategoryDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface NameApiResponse {
  data: {
    scrapNames: ScrapNameDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function ScrapManagementPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('categories');

  // Categories state
  const [categorySearch, setCategorySearch] = useState('');
  const [debouncedCategorySearch, setDebouncedCategorySearch] = useState('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryLimit, setCategoryLimit] = useState(10);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ScrapCategoryDto | undefined>();
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Names state
  const [nameSearch, setNameSearch] = useState('');
  const [debouncedNameSearch, setDebouncedNameSearch] = useState('');
  const [namePage, setNamePage] = useState(1);
  const [nameLimit, setNameLimit] = useState(10);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [isNameFormOpen, setIsNameFormOpen] = useState(false);
  const [editingName, setEditingName] = useState<ScrapNameDto | undefined>();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce searches
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCategorySearch(categorySearch);
      setCategoryPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [categorySearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameSearch(nameSearch);
      setNamePage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [nameSearch]);

  // Queries
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useScrapCategories({
    page: categoryPage,
    limit: categoryLimit,
    search: debouncedCategorySearch || undefined,
    isActive: categoryStatusFilter === 'all' ? undefined : categoryStatusFilter === 'active',
  });

  const {
    data: namesData,
    isLoading: namesLoading,
    error: namesError,
  } = useScrapNames({
    page: namePage,
    limit: nameLimit,
    search: debouncedNameSearch || undefined,
    scrapCategoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  });

  // Fetch all scrap names for accurate counts (without pagination)
  const { data: allNamesData } = useScrapNames({
    page: 1,
    limit: 10000, // Large number to get all items
    scrapCategoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
  });

  // Fetch all categories for accurate counts
  const { data: allCategoriesData } = useScrapCategories({
    page: 1,
    limit: 10000,
  });

  // Mutations
  const createCategoryMutation = useCreateScrapCategory();
  const updateCategoryMutation = useUpdateScrapCategory();
  const deleteCategoryMutation = useDeleteScrapCategory();

  const createNameMutation = useCreateScrapName();
  const updateNameMutation = useUpdateScrapName();
  const deleteNameMutation = useDeleteScrapName();

  // Handle API response structure
  const categoryResponse = categoriesData as unknown as CategoryApiResponse;
  const categories = useMemo(
    () => categoryResponse?.data?.scrapCategories || [],
    [categoryResponse],
  );
  const categoryPagination = useMemo(
    () =>
      categoryResponse?.data?.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    [categoryResponse],
  );

  const nameResponse = namesData as unknown as NameApiResponse;
  const names = useMemo(() => nameResponse?.data?.scrapNames || [], [nameResponse]);
  const namePagination = useMemo(
    () =>
      nameResponse?.data?.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    [nameResponse],
  );

  // Get all categories for accurate counts
  const allCategoryResponse = allCategoriesData as unknown as CategoryApiResponse;
  const allCategories = useMemo(() => allCategoryResponse?.data?.scrapCategories || [], [allCategoryResponse]);

  // Calculate category status counts
  const categoryStatusCounts = useMemo(() => {
    const total = allCategories.length;
    const active = allCategories.filter(c => c.isActive).length;
    const inactive = allCategories.filter(c => !c.isActive).length;
    return { total, active, inactive };
  }, [allCategories]);

  // Get all names for accurate counts
  const allNameResponse = allNamesData as unknown as NameApiResponse;
  const allNames = useMemo(() => allNameResponse?.data?.scrapNames || [], [allNameResponse]);

  // Calculate status counts from all names
  const statusCounts = useMemo(() => {
    const total = allNames.length;
    const active = allNames.filter(n => n.isActive).length;
    const inactive = allNames.filter(n => !n.isActive).length;
    return { total, active, inactive };
  }, [allNames]);

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All associated scrap names will also be affected.')) {
      return;
    }
    try {
      await deleteCategoryMutation.mutateAsync(id);
      toast.success('Category deleted successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleDeleteName = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scrap name?')) {
      return;
    }
    try {
      await deleteNameMutation.mutateAsync(id);
      toast.success('Scrap name deleted successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete scrap name');
    }
  };

  const handleToggleNameStatus = async (name: ScrapNameDto) => {
    try {
      await updateNameMutation.mutateAsync({
        id: name.id,
        data: { isActive: !name.isActive },
      });
      toast.success(`Scrap name ${!name.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleToggleCategoryStatus = async (category: ScrapCategoryDto) => {
    try {
      await updateCategoryMutation.mutateAsync({
        id: category.id,
        data: { isActive: !category.isActive },
      });
      toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const currentSearch = activeTab === 'categories' ? categorySearch : nameSearch;
  const setCurrentSearch = activeTab === 'categories' ? setCategorySearch : setNameSearch;

  if (categoriesError || namesError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading scrap management</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold text-gray-900">Scrap Management</CardTitle>

            <div className="flex items-center gap-3">
              {/* Tab Switcher Buttons */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setActiveTab('categories');
                    setIsSearchOpen(false);
                    setIsFilterOpen(false);
                  }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'categories'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Categories
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === 'categories'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-200 text-gray-600'
                    }`}>
                    {categoryPagination.total}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('names');
                    setIsSearchOpen(false);
                    setIsFilterOpen(false);
                  }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'names'
                    ? 'bg-white text-cyan-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Scrap Names
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === 'names'
                    ? 'bg-cyan-100 text-cyan-700'
                    : 'bg-gray-200 text-gray-600'
                    }`}>
                    {namePagination.total}
                  </span>
                </button>
              </div>

              {/* Search Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 h-9 w-9 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Search Input */}
              {isSearchOpen && (
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={currentSearch}
                    onChange={(e) => setCurrentSearch(e.target.value)}
                    onBlur={() => {
                      if (!currentSearch) {
                        setIsSearchOpen(false);
                      }
                    }}
                    autoFocus
                    className="w-64 pl-10 pr-10 rounded-lg border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  {currentSearch && (
                    <button
                      onClick={() => {
                        setCurrentSearch('');
                        setIsSearchOpen(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Filter Button - Only for Names tab */}
              {activeTab === 'names' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 h-9 w-9 p-0 ${(selectedCategoryId !== 'all' || statusFilter !== 'all') ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : ''
                    } ${isFilterOpen ? 'border-cyan-500 bg-cyan-50' : ''}`}
                  title={isFilterOpen ? 'Hide filters' : 'Show filters'}
                >
                  <Filter className={`h-4 w-4 ${(selectedCategoryId !== 'all' || statusFilter !== 'all') ? 'text-cyan-700' : ''}`} />
                </Button>
              )}

              <Button
                onClick={() => {
                  if (activeTab === 'categories') {
                    setEditingCategory(undefined);
                    setIsCategoryFormOpen(true);
                  } else {
                    setEditingName(undefined);
                    setIsNameFormOpen(true);
                  }
                }}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                title={activeTab === 'categories' ? 'Add Category' : 'Add Scrap Name'}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Panel - Only for Names tab */}
          {isFilterOpen && activeTab === 'names' && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Category:</Label>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={(v) => {
                        setSelectedCategoryId(v as string | 'all');
                        setNamePage(1);
                      }}
                    >
                      <SelectTrigger className={`w-[180px] bg-white border-gray-200 hover:border-gray-300 transition-all ${selectedCategoryId !== 'all' ? 'border-cyan-500 ring-2 ring-cyan-200' : ''
                        }`}>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={(v) => {
                        setStatusFilter(v as 'all' | 'active' | 'inactive');
                        setNamePage(1);
                      }}
                    >
                      <SelectTrigger className={`w-[140px] bg-white border-gray-200 hover:border-gray-300 transition-all ${statusFilter !== 'all' ? 'border-cyan-500 ring-2 ring-cyan-200' : ''
                        }`}>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(selectedCategoryId !== 'all' || statusFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategoryId('all');
                        setStatusFilter('all');
                        setNamePage(1);
                      }}
                      className="h-8 px-2 text-gray-500 hover:text-gray-700"
                      title="Clear filters"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
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
        </CardHeader>

        <CardContent className="p-6">
          {!mounted ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white">
                  {/* Status Tabs Row - For both Categories and Names */}
                  {activeTab === 'categories' ? (
                    <TableRow className="hover:bg-transparent border-b-2 border-gray-200 bg-gray-50">
                      <TableHead colSpan={6} className="p-0 bg-transparent">
                        <div className="w-full overflow-x-auto">
                          <div className="inline-flex items-center gap-1 px-2 py-2">
                            {(['all', 'active', 'inactive'] as const).map((status) => {
                              const isActive = categoryStatusFilter === status;
                              let count = 0;
                              let label = '';
                              let colorClasses = {
                                activeText: '',
                                activeBg: '',
                                underline: '',
                                count: ''
                              };

                              if (status === 'all') {
                                count = categoryStatusCounts.total;
                                label = 'All';
                                colorClasses = {
                                  activeText: 'text-purple-700',
                                  activeBg: 'bg-purple-50',
                                  underline: 'bg-purple-500',
                                  count: 'bg-purple-100 text-purple-700'
                                };
                              } else if (status === 'active') {
                                count = categoryStatusCounts.active;
                                label = 'Active';
                                colorClasses = {
                                  activeText: 'text-green-700',
                                  activeBg: 'bg-green-50',
                                  underline: 'bg-green-600',
                                  count: 'bg-green-100 text-green-700'
                                };
                              } else {
                                count = categoryStatusCounts.inactive;
                                label = 'Inactive';
                                colorClasses = {
                                  activeText: 'text-gray-700',
                                  activeBg: 'bg-gray-50',
                                  underline: 'bg-gray-600',
                                  count: 'bg-gray-100 text-gray-700'
                                };
                              }

                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    setCategoryStatusFilter(status);
                                    setCategoryPage(1);
                                  }}
                                  className={`relative px-4 py-2 text-sm font-medium transition-all rounded-t-md ${isActive
                                    ? `${colorClasses.activeText} ${colorClasses.activeBg} shadow-sm`
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    {label}
                                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${colorClasses.count}`}>
                                      {count}
                                    </span>
                                  </span>
                                  {isActive && (
                                    <span className={`absolute left-0 right-0 -bottom-0.5 h-0.5 ${colorClasses.underline} rounded`} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </TableHead>
                    </TableRow>
                  ) : (
                    <TableRow className="hover:bg-transparent border-b-2 border-gray-200 bg-gray-50">
                      <TableHead colSpan={6} className="p-0 bg-transparent">
                        <div className="w-full overflow-x-auto">
                          <div className="inline-flex items-center gap-1 px-2 py-2">
                            {(['all', 'active', 'inactive'] as const).map((status) => {
                              const isActive = statusFilter === status;
                              let count = 0;
                              let label = '';
                              let colorClasses = {
                                activeText: '',
                                activeBg: '',
                                underline: '',
                                count: ''
                              };

                              if (status === 'all') {
                                count = statusCounts.total;
                                label = 'All';
                                colorClasses = {
                                  activeText: 'text-cyan-700',
                                  activeBg: 'bg-cyan-50',
                                  underline: 'bg-cyan-500',
                                  count: 'bg-cyan-100 text-cyan-700'
                                };
                              } else if (status === 'active') {
                                count = statusCounts.active;
                                label = 'Active';
                                colorClasses = {
                                  activeText: 'text-green-700',
                                  activeBg: 'bg-green-50',
                                  underline: 'bg-green-600',
                                  count: 'bg-green-100 text-green-700'
                                };
                              } else {
                                count = statusCounts.inactive;
                                label = 'Inactive';
                                colorClasses = {
                                  activeText: 'text-gray-700',
                                  activeBg: 'bg-gray-50',
                                  underline: 'bg-gray-600',
                                  count: 'bg-gray-100 text-gray-700'
                                };
                              }

                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    setStatusFilter(status);
                                    setNamePage(1);
                                  }}
                                  className={`relative px-4 py-2 text-sm font-medium transition-all rounded-t-md ${isActive
                                    ? `${colorClasses.activeText} ${colorClasses.activeBg} shadow-sm`
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    {label}
                                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${colorClasses.count}`}>
                                      {count}
                                    </span>
                                  </span>
                                  {isActive && (
                                    <span className={`absolute left-0 right-0 -bottom-0.5 h-0.5 ${colorClasses.underline} rounded`} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </TableHead>
                    </TableRow>
                  )}

                  {/* Column Headers */}
                  <TableRow className="hover:bg-transparent border-b bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                    </TableHead>
                    <TableHead>{activeTab === 'categories' ? 'Category' : 'Scrap Name'}</TableHead>
                    {activeTab === 'categories' ? (
                      <>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created Date</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created Date</TableHead>
                      </>
                    )}
                    <TableHead className="w-12">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {activeTab === 'categories' ? (
                    categoriesLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                          <span className="ml-2 text-gray-600">Loading categories...</span>
                        </TableCell>
                      </TableRow>
                    ) : categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <NoDataAnimation
                            message="No categories found"
                            description="Create your first category to get started"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => (
                        <TableRow key={category.id} className="border-b hover:bg-gray-50 transition-colors bg-white">
                          <TableCell>
                            <Checkbox className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <CategoryIcon />
                              <span className="font-medium text-gray-900">{category.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600 line-clamp-2 max-w-md">
                              {category.description || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={category.isActive}
                                onCheckedChange={() => handleToggleCategoryStatus(category)}
                                className="data-[state=checked]:bg-green-500"
                              />
                              <span className={`text-sm font-medium ${category.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                {category.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {new Date(category.createdAt).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingCategory(category);
                                    setIsCategoryFormOpen(true);
                                  }}
                                >
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    namesLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                          <span className="ml-2 text-gray-600">Loading scrap names...</span>
                        </TableCell>
                      </TableRow>
                    ) : names.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <NoDataAnimation
                            message="No scrap names found"
                            description="Create your first scrap name to get started"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      names.map((name) => (
                        <TableRow key={name.id} className="border-b hover:bg-gray-50 transition-colors bg-white">
                          <TableCell>
                            <Checkbox className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <ScrapNameIcon />
                              <span className="font-medium text-gray-900">{name.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {name.scrapCategory && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                {name.scrapCategory.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={name.isActive}
                                onCheckedChange={() => handleToggleNameStatus(name)}
                                className="data-[state=checked]:bg-green-500"
                              />
                              <span className={`text-sm font-medium ${name.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                {name.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {new Date(name.createdAt).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingName(name);
                                    setIsNameFormOpen(true);
                                  }}
                                >
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteName(name.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {mounted && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <RowsPerPage
                value={activeTab === 'categories' ? categoryLimit : nameLimit}
                onChange={(value) => {
                  if (activeTab === 'categories') {
                    setCategoryLimit(value);
                    setCategoryPage(1);
                  } else {
                    setNameLimit(value);
                    setNamePage(1);
                  }
                }}
                options={[5, 10, 20, 50]}
              />
              <div className="text-sm text-gray-600">
                {activeTab === 'categories' ? (
                  <>
                    Showing {((categoryPagination.page - 1) * categoryPagination.limit) + 1} to{' '}
                    {Math.min(categoryPagination.page * categoryPagination.limit, categoryPagination.total)} of{' '}
                    {categoryPagination.total} categories
                  </>
                ) : (
                  <>
                    Showing {((namePagination.page - 1) * namePagination.limit) + 1} to{' '}
                    {Math.min(namePagination.page * namePagination.limit, namePagination.total)} of{' '}
                    {namePagination.total} scrap names
                  </>
                )}
              </div>
              <Pagination
                currentPage={activeTab === 'categories' ? categoryPagination.page : namePagination.page}
                totalPages={activeTab === 'categories' ? categoryPagination.totalPages : namePagination.totalPages}
                onPageChange={(page) => {
                  if (activeTab === 'categories') {
                    setCategoryPage(page);
                  } else {
                    setNamePage(page);
                  }
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <ScrapCategoryForm
            category={editingCategory}
            onSubmit={async (data) => {
              try {
                if (editingCategory) {
                  await updateCategoryMutation.mutateAsync({ id: editingCategory.id, data });
                  toast.success('Category updated successfully');
                } else {
                  await createCategoryMutation.mutateAsync(data);
                  toast.success('Category created successfully');
                }
                setIsCategoryFormOpen(false);
                setEditingCategory(undefined);
              } catch (error: any) {
                toast.error(error?.response?.data?.message || 'Failed to save category');
              }
            }}
            onCancel={() => {
              setIsCategoryFormOpen(false);
              setEditingCategory(undefined);
            }}
            isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Scrap Name Form Dialog */}
      <Dialog open={isNameFormOpen} onOpenChange={setIsNameFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingName ? 'Edit Scrap Name' : 'Add Scrap Name'}</DialogTitle>
          </DialogHeader>
          <ScrapNameForm
            scrapName={editingName}
            categories={categories}
            onSubmit={async (data) => {
              try {
                if (editingName) {
                  await updateNameMutation.mutateAsync({
                    id: editingName.id,
                    data,
                  });
                  toast.success('Scrap name updated successfully');
                } else {
                  await createNameMutation.mutateAsync(data);
                  toast.success('Scrap name created successfully');
                }
                setIsNameFormOpen(false);
                setEditingName(undefined);
              } catch (error: any) {
                toast.error(error?.response?.data?.message || 'Failed to save scrap name');
              }
            }}
            onCancel={() => {
              setIsNameFormOpen(false);
              setEditingName(undefined);
            }}
            isLoading={createNameMutation.isPending || updateNameMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Category Form Component
function ScrapCategoryForm({
  category,
  onSubmit,
  onCancel,
  isLoading,
}: {
  category?: ScrapCategoryDto;
  onSubmit: (data: { name: string; description?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Category Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter category name"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description (optional)"
          className="mt-1"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-cyan-500 hover:bg-cyan-600">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </form>
  );
}

// Scrap Name Form Component
function ScrapNameForm({
  scrapName,
  categories,
  onSubmit,
  onCancel,
  isLoading,
}: {
  scrapName?: ScrapNameDto;
  categories: ScrapCategoryDto[];
  onSubmit: (data: { name: string; scrapCategoryId: string; isActive?: boolean }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [name, setName] = useState(scrapName?.name || '');
  const [scrapCategoryId, setScrapCategoryId] = useState(scrapName?.scrapCategoryId || '');
  const [isActive, setIsActive] = useState(scrapName?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, scrapCategoryId, isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Scrap Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter scrap name"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select value={scrapCategoryId} onValueChange={setScrapCategoryId} required>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
          className="data-[state=checked]:bg-green-500"
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Active
        </Label>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-cyan-500 hover:bg-cyan-600">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </form>
  );
}
