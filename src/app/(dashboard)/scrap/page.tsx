'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Tags, X, Filter, Loader2, MoreHorizontal, FileText, Layers } from 'lucide-react';
import { z } from 'zod';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { Checkbox } from '@/components/ui/checkbox';
import NoDataAnimation from '@/components/ui/no-data-animation';
import { cn } from '@/lib/utils';

interface CategoryApiResponse {
  data: {
    scrapCategories: ScrapCategoryDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
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
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
    };
  };
}

export default function ScrapModulePage() {
  // Active tab state - 'categories' or 'names'
  const [activeTab, setActiveTab] = useState<'categories' | 'names'>('categories');

  // Categories state
  const [categorySearch, setCategorySearch] = useState('');
  const [debouncedCategorySearch, setDebouncedCategorySearch] = useState('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryLimit, setCategoryLimit] = useState(10);
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ScrapCategoryDto | undefined>();

  // Names state
  const [nameSearch, setNameSearch] = useState('');
  const [debouncedNameSearch, setDebouncedNameSearch] = useState('');
  const [namePage, setNamePage] = useState(1);
  const [nameLimit, setNameLimit] = useState(10);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isNameFormOpen, setIsNameFormOpen] = useState(false);
  const [editingName, setEditingName] = useState<ScrapNameDto | undefined>();

  // UI state
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce searches
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCategorySearch(categorySearch);
      setCategoryPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [categorySearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameSearch(nameSearch);
      setNamePage(1);
    }, 400);
  }, [nameSearch]);

  // Queries
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useScrapCategories({
    page: categoryPage,
    limit: categoryLimit,
    search: debouncedCategorySearch,
  });

  const {
    data: namesData,
    isLoading: namesLoading,
    error: namesError,
  } = useScrapNames({
    page: namePage,
    limit: nameLimit,
    search: debouncedNameSearch,
    categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
  });

  // Mutations
  const createCategoryMutation = useCreateScrapCategory();
  const updateCategoryMutation = useUpdateScrapCategory();
  const deleteCategoryMutation = useDeleteScrapCategory();
  const createNameMutation = useCreateScrapName();
  const updateNameMutation = useUpdateScrapName();
  const deleteNameMutation = useDeleteScrapName();

  // Parse API responses
  const categoryResponse = categoriesData as unknown as CategoryApiResponse;
  const nameResponse = namesData as unknown as NameApiResponse;

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

  // Filter names by status
  const filteredNames = useMemo(() => {
    if (statusFilter === 'all') return names;
    if (statusFilter === 'active') return names.filter(n => n.isActive);
    if (statusFilter === 'inactive') return names.filter(n => !n.isActive);
    return names;
  }, [names, statusFilter]);

  // Status counts for scrap names
  const statusCounts = useMemo(() => ({
    all: names?.length || 0,
    active: names?.filter(n => n.isActive).length || 0,
    inactive: names?.filter(n => !n.isActive).length || 0,
  }), [names]);

  // Filter categories by status
  const filteredCategories = useMemo(() => {
    if (categoryStatusFilter === 'all') return categories;
    if (categoryStatusFilter === 'active') return categories.filter(c => c.isActive);
    if (categoryStatusFilter === 'inactive') return categories.filter(c => !c.isActive);
    return categories;
  }, [categories, categoryStatusFilter]);

  // Status counts for categories
  const categoryStatusCounts = useMemo(() => ({
    all: categories?.length || 0,
    active: categories?.filter(c => c.isActive).length || 0,
    inactive: categories?.filter(c => !c.isActive).length || 0,
  }), [categories]);

  // Handlers
  const handleCreateCategory = useCallback(() => {
    setEditingCategory(undefined);
    setIsCategoryFormOpen(true);
  }, []);

  const handleEditCategory = useCallback((category: ScrapCategoryDto) => {
    setEditingCategory(category);
    setIsCategoryFormOpen(true);
  }, []);

  const handleDeleteCategory = useCallback(async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this scrap category? Any linked scrap names must be removed first.',
      )
    ) {
      return;
    }
    try {
      await deleteCategoryMutation.mutateAsync(id);
      toast.success('Scrap category deleted successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete scrap category');
    }
  }, [deleteCategoryMutation]);

  const handleSubmitCategory = useCallback(async (data: { name: string; description?: string }) => {
    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({ id: editingCategory.id, data });
        toast.success('Scrap category updated successfully');
      } else {
        await createCategoryMutation.mutateAsync(data);
        toast.success('Scrap category created successfully');
      }
      setIsCategoryFormOpen(false);
      setEditingCategory(undefined);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save scrap category');
    }
  }, [editingCategory, updateCategoryMutation, createCategoryMutation]);

  // Handle inline category status change
  const handleCategoryStatusChange = useCallback(async (category: ScrapCategoryDto, newStatus: boolean) => {
    try {
      await updateCategoryMutation.mutateAsync({
        id: category.id,
        data: {
          name: category.name,
          description: category.description,
          isActive: newStatus,
        },
      });
      toast.success(`Category ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update category status');
    }
  }, [updateCategoryMutation]);

  const handleCreateName = useCallback(() => {
    setEditingName(undefined);
    setIsNameFormOpen(true);
  }, []);

  const handleEditName = useCallback((name: ScrapNameDto) => {
    setEditingName(name);
    setIsNameFormOpen(true);
  }, []);

  const handleDeleteName = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this scrap name?')) {
      return;
    }
    try {
      await deleteNameMutation.mutateAsync(id);
      toast.success('Scrap name deleted successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete scrap name');
    }
  }, [deleteNameMutation]);

  const handleSubmitName = useCallback(async (data: {
    name: string;
    scrapCategoryId: string;
    isActive?: boolean;
  }) => {
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
  }, [editingName, updateNameMutation, createNameMutation]);

  // Handle inline status change
  const handleStatusChange = useCallback(async (scrapName: ScrapNameDto, newStatus: boolean) => {
    try {
      await updateNameMutation.mutateAsync({
        id: scrapName.id,
        data: {
          name: scrapName.name,
          scrapCategoryId: scrapName.scrapCategoryId,
          isActive: newStatus,
        },
      });
      toast.success(`Scrap name ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  }, [updateNameMutation]);

  // Prevent hydration errors
  if (!mounted) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (categoriesError || namesError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Error loading data. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSearch = activeTab === 'categories' ? categorySearch : nameSearch;
  const setCurrentSearch = activeTab === 'categories' ? setCategorySearch : setNameSearch;

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">Scrap Management</CardTitle>
            <div className="flex items-center gap-4">
              {/* Main Tabs Switcher */}
              <div className="bg-gray-100 p-1 rounded-lg inline-flex items-center">
                {(['categories', 'names'] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setIsSearchOpen(false);
                        setIsFilterOpen(false);
                        if (tab === 'names') {
                          setStatusFilter('all');
                        }
                      }}
                      className={`px-4 py-1.5 text-sm font-medium transition-all rounded-md flex items-center gap-2 ${isActive
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                      {tab === 'categories' ? 'Category' : 'Scrap'}
                    </button>
                  );
                })}
              </div>

              <div className="h-6 w-px bg-gray-200" />

              <div className="flex items-center gap-2">
                {/* Search Toggle Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 h-9 w-9 p-0"
                >
                  <Search className="h-4 w-4" />
                </Button>

                {/* Search Input - shown when isSearchOpen is true */}
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

                {/* Filter Icon Button - Only for Scrap Names */}
                {activeTab === 'names' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 h-9 w-9 p-0 ${selectedCategoryId !== 'all' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : ''
                      } ${isFilterOpen ? 'border-cyan-500 bg-cyan-50' : ''
                      }`}
                    title={isFilterOpen ? "Hide filters" : "Show filters"}
                  >
                    <Filter className={`h-4 w-4 ${selectedCategoryId !== 'all' ? 'text-cyan-700' : ''}`} />
                  </Button>
                )}

                <Button
                  onClick={activeTab === 'categories' ? handleCreateCategory : handleCreateName}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                  title={activeTab === 'categories' ? "Add Category" : "Add Scrap"}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Category Filter - Only shown when filter icon is clicked and on names tab */}
          {isFilterOpen && activeTab === 'names' && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Category:</Label>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={(value) => {
                      setSelectedCategoryId(value as string | 'all');
                      setNamePage(1);
                    }}
                  >
                    <SelectTrigger className={`w-[200px] bg-white border-gray-200 hover:border-gray-300 transition-all ${selectedCategoryId !== 'all' ? 'border-cyan-500 ring-2 ring-cyan-200' : ''
                      }`}>
                      <SelectValue placeholder="All Categories">
                        {selectedCategoryId === 'all' ? 'All Categories' : categories.find(c => c.id === selectedCategoryId)?.name}
                      </SelectValue>
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
                  {selectedCategoryId !== 'all' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategoryId('all');
                        setNamePage(1);
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
        </CardHeader>

        <CardContent className="p-6">
          {(categoriesLoading && activeTab === 'categories') || (namesLoading && activeTab === 'names') ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white">
                  {/* Status Tabs Row */}
                  <TableRow className="hover:bg-transparent border-b-2 border-gray-200 bg-gray-50">
                    <TableHead colSpan={7} className="p-0 bg-transparent">
                      <div className="w-full overflow-x-auto">
                        <div className="inline-flex items-center gap-1 px-4 py-2">

                          {/* Status Tabs - Show for both Categories and Scrap Names */}
                          {mounted && (
                            <>
                              {activeTab === 'categories' ? (
                                // Category Status Tabs
                                (['all', 'active', 'inactive'] as const).map((status) => {
                                  const isActive = categoryStatusFilter === status;
                                  const count = categoryStatusCounts[status] || 0;
                                  const getStatusStyle = () => {
                                    if (status === 'all') return { bg: 'bg-gray-100', text: 'text-gray-700', activeBg: 'bg-gray-200' };
                                    if (status === 'active') return { bg: 'bg-green-50', text: 'text-green-700', activeBg: 'bg-green-100' };
                                    return { bg: 'bg-red-50', text: 'text-red-700', activeBg: 'bg-red-100' };
                                  };
                                  const style = getStatusStyle();
                                  return (
                                    <button
                                      key={status}
                                      type="button"
                                      onClick={() => {
                                        console.log('Category status filter clicked:', status);
                                        setCategoryStatusFilter(status);
                                      }}
                                      className={`relative px-3 py-1.5 text-xs font-medium transition-all rounded-md ${isActive
                                        ? `${style.text} ${style.activeBg} shadow-sm`
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                      <span className="inline-flex items-center gap-1.5">
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                        <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${isActive ? 'bg-white/50' : 'bg-gray-200'
                                          }`}>
                                          {count}
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })
                              ) : (
                                // Scrap Names Status Tabs
                                (['all', 'active', 'inactive'] as const).map((status) => {
                                  const isActive = statusFilter === status;
                                  const count = statusCounts[status] || 0;
                                  const getStatusStyle = () => {
                                    if (status === 'all') return { bg: 'bg-gray-100', text: 'text-gray-700', activeBg: 'bg-gray-200' };
                                    if (status === 'active') return { bg: 'bg-green-50', text: 'text-green-700', activeBg: 'bg-green-100' };
                                    return { bg: 'bg-red-50', text: 'text-red-700', activeBg: 'bg-red-100' };
                                  };
                                  const style = getStatusStyle();
                                  return (
                                    <button
                                      key={status}
                                      type="button"
                                      onClick={() => {
                                        console.log('Scrap status filter clicked:', status);
                                        setStatusFilter(status);
                                      }}
                                      className={`relative px-3 py-1.5 text-xs font-medium transition-all rounded-md ${isActive
                                        ? `${style.text} ${style.activeBg} shadow-sm`
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                      <span className="inline-flex items-center gap-1.5">
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                        <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${isActive ? 'bg-white/50' : 'bg-gray-200'
                                          }`}>
                                          {count}
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </TableHead>
                  </TableRow>

                  {/* Column Headers */}
                  <TableRow className="hover:bg-transparent border-b bg-white">
                    <TableHead className="w-12">
                      <Checkbox className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>{activeTab === 'categories' ? 'Description' : 'Category'}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {activeTab === 'categories' ? (
                    filteredCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <NoDataAnimation
                            message="No scrap categories found"
                            description={categoryStatusFilter !== 'all' ? `No ${categoryStatusFilter} categories found` : "Create your first category to get started"}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCategories.map((category) => (
                        <TableRow key={category.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                          </TableCell>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-gray-600">{category.description || '-'}</TableCell>
                          <TableCell>
                            {/* Inline Status Switcher for Categories */}
                            {/* Inline Status Switcher for Categories */}
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <label className="custom-toggle-switch scale-75">
                                <input
                                  type="checkbox"
                                  className="chk"
                                  checked={category.isActive}
                                  onChange={(e) => handleCategoryStatusChange(category, e.target.checked)}
                                />
                                <span className="slider"></span>
                              </label>
                              <span className={`text-sm font-medium ${category.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                                {category.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(category.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    filteredNames.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <NoDataAnimation
                            message="No scrap names found"
                            description={statusFilter !== 'all' ? `No ${statusFilter} scrap names found` : "Create your first scrap name to get started"}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredNames.map((scrap) => (
                        <TableRow key={scrap.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                          </TableCell>
                          <TableCell className="font-medium">{scrap.name}</TableCell>
                          <TableCell>
                            {scrap.scrapCategory && (
                              <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                                {scrap.scrapCategory.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {/* Inline Status Switcher */}
                            {/* Inline Status Switcher for Names */}
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <label className="custom-toggle-switch scale-75">
                                <input
                                  type="checkbox"
                                  className="chk"
                                  checked={scrap.isActive}
                                  onChange={(e) => handleStatusChange(scrap, e.target.checked)}
                                />
                                <span className="slider"></span>
                              </label>
                              <span className={`text-sm font-medium ${scrap.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                                {scrap.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(scrap.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditName(scrap)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteName(scrap.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
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
          {activeTab === 'categories' && categories.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <RowsPerPage
                value={categoryLimit}
                onChange={(value) => {
                  setCategoryLimit(value);
                  setCategoryPage(1);
                }}
              />
              <Pagination
                currentPage={categoryPage}
                totalPages={categoryPagination.totalPages}
                onPageChange={setCategoryPage}
              />
            </div>
          )}

          {activeTab === 'names' && names.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <RowsPerPage
                value={nameLimit}
                onChange={(value) => {
                  setNameLimit(value);
                  setNamePage(1);
                }}
              />
              <Pagination
                currentPage={namePage}
                totalPages={namePagination.totalPages}
                onPageChange={setNamePage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Scrap Category' : 'Add Scrap Category'}
            </DialogTitle>
          </DialogHeader>
          <ScrapCategoryForm
            category={editingCategory}
            onSubmit={handleSubmitCategory}
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
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingName ? 'Edit Scrap Name' : 'Add Scrap Name'}</DialogTitle>
          </DialogHeader>
          <ScrapNameForm
            scrapName={editingName}
            categories={categories}
            onSubmit={handleSubmitName}
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

// Zod Schemas
const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(50, 'Category name cannot exceed 50 characters').trim(),
  description: z.string().max(250, 'Description cannot exceed 250 characters').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

const createScrapNameSchema = z.object({
  name: z.string().min(2, 'Scrap name must be at least 2 characters').max(50, 'Scrap name cannot exceed 50 characters').trim(),
  scrapCategoryId: z.string().min(1, 'Please select a category'),
  isActive: z.boolean().optional(),
});

// Form Components
function ScrapCategoryForm({
  category,
  onSubmit,
  onCancel,
  isLoading,
}: {
  category?: ScrapCategoryDto;
  onSubmit: (data: { name: string; description?: string; isActive?: boolean }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = createCategorySchema.safeParse({ name, description, isActive });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setValidationErrors(errors);

      const firstError = result.error.issues[0];
      if (firstError) toast.error(firstError.message);
      return;
    }

    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">Category Name *</Label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
              <Tags className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (validationErrors.name) setValidationErrors({ ...validationErrors, name: '' });
            }}
            placeholder="e.g., Cars, Metals, Electronics"
            disabled={isLoading}
            className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
          />
        </div>
        {validationErrors.name && <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
          <Input
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (validationErrors.description) setValidationErrors({ ...validationErrors, description: '' });
            }}
            placeholder="Optional description for this scrap category"
            disabled={isLoading}
            className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
          />
        </div>
        {validationErrors.description && <p className="text-sm text-red-600 mt-1">{validationErrors.description}</p>}
      </div>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
        <Label htmlFor="active" className="text-sm font-medium text-gray-700">Active Status</Label>
        <Switch
          id="active"
          checked={isActive}
          onCheckedChange={setIsActive}
          disabled={isLoading}
          className="data-[state=checked]:bg-cyan-500"
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="h-12 px-6 rounded-xl border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all hover:shadow-md disabled:opacity-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          variant="outline"
          className="relative overflow-hidden group h-12 px-8 rounded-xl border-2 border-cyan-500 text-cyan-600 hover:bg-white hover:text-cyan-700 hover:border-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 active:scale-95 bg-white backdrop-blur-sm"
        >
          <span className="absolute inset-0 w-full h-full -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent z-0 skew-x-12" />
          <span className="relative z-10 flex items-center gap-2">
            {isLoading ? (
              <>
                <div className="mr-2 h-5 w-5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                {category ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              category ? 'Update' : 'Create'
            )}
          </span>
        </Button>
      </div>
    </form>
  );
}

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
  const [scrapCategoryId, setScrapCategoryId] = useState<string>(
    scrapName?.scrapCategoryId || '',
  );
  const [isActive, setIsActive] = useState(scrapName?.isActive ?? true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = createScrapNameSchema.safeParse({ name, scrapCategoryId, isActive });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setValidationErrors(errors);

      const firstError = result.error.issues[0];
      if (firstError) toast.error(firstError.message);
      return;
    }

    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">Scrap Name *</Label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
              <Layers className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (validationErrors.name) setValidationErrors({ ...validationErrors, name: '' });
            }}
            placeholder="e.g., Aluminum Cans, Copper Wire"
            disabled={isLoading}
            className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
          />
        </div>
        {validationErrors.name && <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
        <Select
          value={scrapCategoryId}
          onValueChange={(val) => {
            setScrapCategoryId(val);
            if (validationErrors.scrapCategoryId) setValidationErrors({ ...validationErrors, scrapCategoryId: '' });
          }}
          disabled={isLoading}
        >
          <SelectTrigger className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.scrapCategoryId ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {validationErrors.scrapCategoryId && <p className="text-sm text-red-600 mt-1">{validationErrors.scrapCategoryId}</p>}
      </div>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
        <Label htmlFor="active" className="text-sm font-medium text-gray-700">Active Status</Label>
        <Switch
          id="active"
          checked={isActive}
          onCheckedChange={setIsActive}
          disabled={isLoading}
          className="data-[state=checked]:bg-cyan-500"
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="h-12 px-6 rounded-xl border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all hover:shadow-md disabled:opacity-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          variant="outline"
          className="relative overflow-hidden group h-12 px-8 rounded-xl border-2 border-cyan-500 text-cyan-600 hover:bg-white hover:text-cyan-700 hover:border-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 active:scale-95 bg-white backdrop-blur-sm"
        >
          <span className="absolute inset-0 w-full h-full -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent z-0 skew-x-12" />
          <span className="relative z-10 flex items-center gap-2">
            {isLoading ? (
              <>
                <div className="mr-2 h-5 w-5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                {scrapName ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              scrapName ? 'Update' : 'Create'
            )}
          </span>
        </Button>
      </div>
    </form>
  );
}
