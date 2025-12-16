'use client';

import { useState, useEffect, useMemo } from 'react';
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

  const handleCreateCategory = () => {
    setEditingCategory(undefined);
    setIsCategoryFormOpen(true);
  };

  const handleEditCategory = (category: ScrapCategoryDto) => {
    setEditingCategory(category);
    setIsCategoryFormOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
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
  };

  const handleSubmitCategory = async (data: { name: string; description?: string }) => {
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
  };

  const handleCreateName = () => {
    setEditingName(undefined);
    setIsNameFormOpen(true);
  };

  const handleEditName = (name: ScrapNameDto) => {
    setEditingName(name);
    setIsNameFormOpen(true);
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

  const handleSubmitName = async (data: {
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
  };

  if (categoriesError || namesError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading scrap module</h2>
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
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10 py-2">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tags className="h-7 w-7 text-cyan-600" />
            Scrap Module
          </h1>
          <p className="text-gray-600 mt-1">
            Manage scrap categories and scrap names used in orders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scrap Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Scrap Categories</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Group similar scrap items, e.g. Cars, Metals, Electronics.
              </p>
            </div>
            <Button onClick={handleCreateCategory} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {categoriesLoading ? (
              <div className="text-center py-8 text-gray-500">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No scrap categories found. Create your first category.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-start justify-between border rounded-lg p-3 hover:bg-muted/50"
                    >
                      <div>
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {category.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          Created {new Date(category.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
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
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <RowsPerPage
                    value={categoryPagination.limit}
                    onChange={(value) => {
                      setCategoryLimit(value);
                      setCategoryPage(1);
                    }}
                    options={[5, 10, 20, 50]}
                  />
                  <div className="text-sm text-gray-600">
                    Showing {(categoryPagination.page - 1) * categoryPagination.limit + 1} to{' '}
                    {Math.min(
                      categoryPagination.page * categoryPagination.limit,
                      categoryPagination.total,
                    )}{' '}
                    of {categoryPagination.total} categories
                  </div>
                  <Pagination
                    currentPage={categoryPagination.page}
                    totalPages={categoryPagination.totalPages}
                    onPageChange={(page) => setCategoryPage(page)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Scrap Names */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Scrap Names</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Define individual scrap items (e.g. Toyota Corolla, Copper Wire) linked to a
                category.
              </p>
            </div>
            <Button onClick={handleCreateName} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Scrap Name
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search scrap names..."
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-64">
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) => setSelectedCategoryId(value as string | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
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
            </div>

            {namesLoading ? (
              <div className="text-center py-8 text-gray-500">Loading scrap names...</div>
            ) : names.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No scrap names found. Create your first scrap name.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {names.map((scrap) => (
                    <div
                      key={scrap.id}
                      className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{scrap.name}</span>
                          {scrap.scrapCategory && (
                            <Badge variant="outline" className="text-xs">
                              {scrap.scrapCategory.name}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Created {new Date(scrap.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={scrap.isActive}
                          onCheckedChange={(checked) =>
                            updateNameMutation.mutate({
                              id: scrap.id,
                              data: { isActive: checked },
                            })
                          }
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditName(scrap)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
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
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <RowsPerPage
                    value={namePagination.limit}
                    onChange={(value) => {
                      setNameLimit(value);
                      setNamePage(1);
                    }}
                    options={[5, 10, 20, 50]}
                  />
                  <div className="text-sm text-gray-600">
                    Showing {(namePagination.page - 1) * namePagination.limit + 1} to{' '}
                    {Math.min(namePagination.page * namePagination.limit, namePagination.total)} of{' '}
                    {namePagination.total} scrap names
                  </div>
                  <Pagination
                    currentPage={namePagination.page}
                    totalPages={namePagination.totalPages}
                    onPageChange={(page) => setNamePage(page)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

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

