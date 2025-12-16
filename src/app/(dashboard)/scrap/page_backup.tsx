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
import { Plus, Search, Edit, Trash2, Tags } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NoDataAnimation from '@/components/ui/no-data-animation';

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
  // Categories state
  const [categorySearch, setCategorySearch] = useState('');
  const [debouncedCategorySearch, setDebouncedCategorySearch] = useState('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryLimit, setCategoryLimit] = useState(10);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ScrapCategoryDto | undefined>();

  // Names state
  const [nameSearch, setNameSearch] = useState('');
  const [debouncedNameSearch, setDebouncedNameSearch] = useState('');
  const [namePage, setNamePage] = useState(1);
  const [nameLimit, setNameLimit] = useState(10);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [isNameFormOpen, setIsNameFormOpen] = useState(false);
  const [editingName, setEditingName] = useState<ScrapNameDto | undefined>();

  // Active tab state
  const [activeTab, setActiveTab] = useState<'categories' | 'names'>('categories');

  // UI state for filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
    return () => clearTimeout(timer);
  }, [nameSearch]);

  // Queries
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useScrapCategories({
    page: categoryPage,
    limit: categoryLimit,
    search: debouncedCategorySearch || undefined,
  });

  const {
    data: namesData,
    isLoading: namesLoading,
    error: namesError,
    refetch: refetchNames,
  } = useScrapNames({
    page: namePage,
    limit: nameLimit,
    search: debouncedNameSearch || undefined,
    scrapCategoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
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
        hasNextPage: false,
        hasPreviousPage: false,
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
        hasNextPage: false,
        hasPreviousPage: false,
      },
    [nameResponse],
  );

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

  if (categoriesError || namesError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading scrap management</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
          <Button
            onClick={() => {
              refetchCategories();
              refetchNames();
            }}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="categories" value={activeTab} onValueChange={(value) => setActiveTab(value as 'categories' | 'names')} className="w-full">
        <Card className="shadow-sm">
          {/* Header with Title and Actions */}
          <CardHeader className="border-b bg-white">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Scrap Management</CardTitle>
              <div className="flex items-center gap-2 flex-1 justify-end max-w-2xl">
                {/* Always visible search input */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search..."
                    value={activeTab === 'categories' ? categorySearch : nameSearch}
                    onChange={(e) => activeTab === 'categories' ? setCategorySearch(e.target.value) : setNameSearch(e.target.value)}
                    className="pl-10 pr-10 h-9 border-2 border-cyan-400 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg"
                  />
                  {((activeTab === 'categories' && categorySearch) || (activeTab === 'names' && nameSearch)) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
                      onClick={() => activeTab === 'categories' ? setCategorySearch('') : setNameSearch('')}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 ${isFilterOpen ? 'bg-cyan-50 text-cyan-600' : ''}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </Button>

                <Button
                  onClick={activeTab === 'categories' ? handleCreateCategory : handleCreateName}
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 px-4"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Filter Panel - Only for Scrap Names */}
            {isFilterOpen && activeTab === 'names' && (
              <div className="mt-4 pt-4 border-t bg-gray-50 -mx-6 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Category:</Label>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={(value) => {
                        setSelectedCategoryId(value as string | 'all');
                        setNamePage(1);
                      }}
                    >
                      <SelectTrigger className="w-[250px] bg-white">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFilterOpen(false)}
                    className="text-gray-600 hover:text-gray-900 bg-gray-800 text-white hover:bg-gray-900 px-3 h-8"
                  >
                    Hide filters
                  </Button>
                </div>
              </div>
            )}

            {isFilterOpen && activeTab === 'categories' && (
              <div className="mt-4 pt-4 border-t bg-gray-50 -mx-6 px-6 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">No filters available for categories</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFilterOpen(false)}
                    className="text-gray-600 hover:text-gray-900 bg-gray-800 text-white hover:bg-gray-900 px-3 h-8"
                  >
                    Hide filters
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>

          {/* Tabs Navigation */}
          <div className="border-b bg-gray-50/50">
            <TabsList className="bg-transparent h-auto p-0 w-full justify-start rounded-none border-0 px-2">
              <TabsTrigger
                value="categories"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 data-[state=active]:text-cyan-600 font-medium"
              >
                Category
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-700">
                  {categoryPagination.total}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="names"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 data-[state=active]:text-cyan-600 font-medium"
              >
                Scrap
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-700">
                  {namePagination.total}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrap Categories Tab */}
          <TabsContent value="categories" className="m-0">
            <CardContent className="p-0">
              {categoriesLoading ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-3"></div>
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <NoDataAnimation
                  message="No scrap categories found"
                  description="Create your first category to get started"
                />
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider w-12">
                            <input type="checkbox" className="rounded border-gray-300" />
                          </th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Category Name
                          </th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Created Date
                          </th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider w-20">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {categories.map((category) => (
                          <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6">
                              <input type="checkbox" className="rounded border-gray-300" />
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-medium text-gray-900">{category.name}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm text-gray-600 line-clamp-2 max-w-md">
                                {category.description || '-'}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm text-gray-600">
                                {new Date(category.createdAt).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Rows per page:</span>
                      <select
                        value={categoryPagination.limit}
                        onChange={(e) => {
                          setCategoryLimit(Number(e.target.value));
                          setCategoryPage(1);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <div className="text-sm text-gray-600">
                      Showing {(categoryPagination.page - 1) * categoryPagination.limit + 1} to{' '}
                      {Math.min(
                        categoryPagination.page * categoryPagination.limit,
                        categoryPagination.total,
                      )}{' '}
                      of {categoryPagination.total} customers
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCategoryPage(Math.max(1, categoryPagination.page - 1))}
                        disabled={categoryPagination.page === 1}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 min-w-8 px-3 bg-cyan-500 text-white hover:bg-cyan-600"
                      >
                        {categoryPagination.page}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCategoryPage(Math.min(categoryPagination.totalPages, categoryPagination.page + 1))}
                        disabled={categoryPagination.page === categoryPagination.totalPages}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </TabsContent>

          {/* Scrap Names Tab */}
          <TabsContent value="names" className="m-0">
            <CardContent className="p-0">
              {namesLoading ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-3"></div>
                  Loading scrap names...
                </div>
              ) : names.length === 0 ? (
                <NoDataAnimation
                  message="No scrap names found"
                  description="Create your first scrap name to get started"
                />
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider w-12">
                            <input type="checkbox" className="rounded border-gray-300" />
                          </th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Scrap Name
                          </th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Created Date
                          </th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider w-20">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {names.map((scrap) => (
                          <tr key={scrap.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6">
                              <input type="checkbox" className="rounded border-gray-300" />
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-medium text-gray-900">{scrap.name}</div>
                            </td>
                            <td className="py-4 px-6">
                              {scrap.scrapCategory && (
                                <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200">
                                  {scrap.scrapCategory.name}
                                </Badge>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${scrap.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span className={`text-sm font-medium ${scrap.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                  {scrap.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm text-gray-600">
                                {new Date(scrap.createdAt).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditName(scrap)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      updateNameMutation.mutate({
                                        id: scrap.id,
                                        data: { isActive: !scrap.isActive },
                                      });
                                    }}
                                  >
                                    <Switch className="mr-2 h-4 w-4" />
                                    {scrap.isActive ? 'Deactivate' : 'Activate'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteName(scrap.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Rows per page:</span>
                      <select
                        value={namePagination.limit}
                        onChange={(e) => {
                          setNameLimit(Number(e.target.value));
                          setNamePage(1);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <div className="text-sm text-gray-600">
                      Showing {(namePagination.page - 1) * namePagination.limit + 1} to{' '}
                      {Math.min(namePagination.page * namePagination.limit, namePagination.total)} of{' '}
                      {namePagination.total} scrap names
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setNamePage(Math.max(1, namePagination.page - 1))}
                        disabled={namePagination.page === 1}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 min-w-8 px-3 bg-cyan-500 text-white hover:bg-cyan-600"
                      >
                        {namePagination.page}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setNamePage(Math.min(namePagination.totalPages, namePagination.page + 1))}
                        disabled={namePagination.page === namePagination.totalPages}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </TabsContent>
        </Card>
      </Tabs>

      {/* Category Form Dialog */}
      <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
        <DialogContent>
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
        <DialogContent>
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

// Category Form
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
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category-name">Category Name *</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Cars, Metals, Electronics"
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category-description">Description</Label>
        <textarea
          id="category-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description for this scrap category"
          rows={3}
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded-md text-sm resize-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {category ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

// Scrap Name Form
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !scrapCategoryId) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit({
      name: name.trim(),
      scrapCategoryId,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="scrap-name">Scrap Name *</Label>
        <Input
          id="scrap-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Toyota Corolla, Copper Wire"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scrap-category">Category *</Label>
        <Select
          value={scrapCategoryId}
          onValueChange={setScrapCategoryId}
          disabled={isLoading || categories.length === 0}
        >
          <SelectTrigger id="scrap-category">
            <SelectValue
              placeholder={
                categories.length === 0 ? 'No categories available' : 'Select a category'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categories.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Create a scrap category first before adding scrap names.
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is-active"
          checked={isActive}
          onCheckedChange={setIsActive}
          disabled={isLoading}
        />
        <Label htmlFor="is-active">Active</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {scrapName ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

