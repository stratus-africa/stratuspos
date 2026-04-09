import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Search, Pencil, Trash2, Tag, Layers, Ruler } from "lucide-react";
import { useProducts, useCategories, useBrands, useUnits, type ProductFormData, type Product } from "@/hooks/useProducts";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { QuickAddDialog } from "@/components/products/QuickAddDialog";

const Products = () => {
  const { productsQuery, createProduct, updateProduct, deleteProduct } = useProducts();
  const { query: categoriesQuery, create: createCategory, remove: removeCategory } = useCategories();
  const { query: brandsQuery, create: createBrand, remove: removeBrand } = useBrands();
  const { query: unitsQuery, create: createUnit, remove: removeUnit } = useUnits();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);

  const products = productsQuery.data || [];
  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.includes(search));
    const matchCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    const matchStatus = statusFilter === "all" ||
      (statusFilter === "active" && p.is_active) ||
      (statusFilter === "inactive" && !p.is_active);
    return matchSearch && matchCategory && matchStatus;
  });

  const handleProductSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProduct.mutate({ ...data, id: editingProduct.id }, {
        onSuccess: () => { setProductDialogOpen(false); setEditingProduct(null); },
      });
    } else {
      createProduct.mutate(data, {
        onSuccess: () => setProductDialogOpen(false),
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setProductDialogOpen(true);
  };

  const formatKES = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => { setEditingProduct(null); setProductDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products"><Package className="mr-1 h-4 w-4" /> Products ({products.length})</TabsTrigger>
          <TabsTrigger value="categories"><Layers className="mr-1 h-4 w-4" /> Categories</TabsTrigger>
          <TabsTrigger value="brands"><Tag className="mr-1 h-4 w-4" /> Brands</TabsTrigger>
          <TabsTrigger value="units"><Ruler className="mr-1 h-4 w-4" /> Units</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name, SKU, or barcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoriesQuery.data?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Buy Price</TableHead>
                    <TableHead className="text-right">Sell Price</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        {products.length === 0 ? "No products yet. Add your first product!" : "No products match your filters."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => {
                      const margin = p.purchase_price > 0
                        ? (((p.selling_price - p.purchase_price) / p.purchase_price) * 100).toFixed(0)
                        : "—";
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-muted-foreground">{p.sku || "—"}</TableCell>
                          <TableCell>{p.categories?.name || "—"}</TableCell>
                          <TableCell className="text-right">{formatKES(p.purchase_price)}</TableCell>
                          <TableCell className="text-right font-medium">{formatKES(p.selling_price)}</TableCell>
                          <TableCell className="text-right">{margin}%</TableCell>
                          <TableCell>
                            <Badge variant={p.is_active ? "default" : "secondary"}>
                              {p.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(p)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => deleteProduct.mutate(p.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Categories</CardTitle>
              <Button size="sm" onClick={() => setCatDialogOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add</Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categoriesQuery.data?.map((c) => (
                  <Badge key={c.id} variant="outline" className="gap-1 py-1.5 px-3 text-sm">
                    {c.name}
                    <button onClick={() => removeCategory.mutate(c.id)} className="ml-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(!categoriesQuery.data || categoriesQuery.data.length === 0) && (
                  <p className="text-muted-foreground text-sm">No categories yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Brands</CardTitle>
              <Button size="sm" onClick={() => setBrandDialogOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add</Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {brandsQuery.data?.map((b) => (
                  <Badge key={b.id} variant="outline" className="gap-1 py-1.5 px-3 text-sm">
                    {b.name}
                    <button onClick={() => removeBrand.mutate(b.id)} className="ml-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(!brandsQuery.data || brandsQuery.data.length === 0) && (
                  <p className="text-muted-foreground text-sm">No brands yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Units of Measure</CardTitle>
              <Button size="sm" onClick={() => setUnitDialogOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add</Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {unitsQuery.data?.map((u) => (
                  <Badge key={u.id} variant="outline" className="gap-1 py-1.5 px-3 text-sm">
                    {u.name}{u.abbreviation ? ` (${u.abbreviation})` : ""}
                    <button onClick={() => removeUnit.mutate(u.id)} className="ml-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(!unitsQuery.data || unitsQuery.data.length === 0) && (
                  <p className="text-muted-foreground text-sm">No units yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProductFormDialog
        open={productDialogOpen}
        onOpenChange={(open) => { setProductDialogOpen(open); if (!open) setEditingProduct(null); }}
        onSubmit={handleProductSubmit}
        product={editingProduct}
        isLoading={createProduct.isPending || updateProduct.isPending}
      />

      <QuickAddDialog open={catDialogOpen} onOpenChange={setCatDialogOpen} title="Add Category" label="Category Name" onSubmit={(name) => createCategory.mutate(name)} isLoading={createCategory.isPending} />
      <QuickAddDialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen} title="Add Brand" label="Brand Name" onSubmit={(name) => createBrand.mutate(name)} isLoading={createBrand.isPending} />
      <QuickAddDialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen} title="Add Unit" label="Unit Name (e.g. Pieces)" onSubmit={(name) => createUnit.mutate({ name })} isLoading={createUnit.isPending} />
    </div>
  );
};

export default Products;
