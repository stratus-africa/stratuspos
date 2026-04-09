import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TruckIcon, Plus, Search, Users, Pencil, Trash2 } from "lucide-react";
import { useSuppliers, usePurchases, type Supplier } from "@/hooks/usePurchases";
import { SupplierFormDialog } from "@/components/purchases/SupplierFormDialog";
import { PurchaseFormDialog } from "@/components/purchases/PurchaseFormDialog";

const Purchases = () => {
  const { query: suppliersQuery, create: createSupplier, update: updateSupplier, remove: removeSupplier } = useSuppliers();
  const { query: purchasesQuery, createPurchase } = usePurchases();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

  const purchases = purchasesQuery.data || [];
  const filteredPurchases = purchases.filter((p) => {
    const matchSearch = (p.invoice_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.suppliers?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatKES = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);

  const paymentBadge = (s: string) => {
    switch (s) {
      case "paid": return <Badge variant="default">Paid</Badge>;
      case "partial": return <Badge variant="secondary">Partial</Badge>;
      default: return <Badge variant="destructive">Unpaid</Badge>;
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "received": return <Badge variant="default">Received</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const handleSupplierSubmit = (data: Omit<Supplier, "id" | "business_id" | "balance">) => {
    if (editingSupplier) {
      updateSupplier.mutate({ id: editingSupplier.id, ...data });
    } else {
      createSupplier.mutate(data);
    }
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchases</h1>
        <Button onClick={() => setPurchaseDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Purchase
        </Button>
      </div>

      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchases"><TruckIcon className="mr-1 h-4 w-4" /> Purchases ({purchases.length})</TabsTrigger>
          <TabsTrigger value="suppliers"><Users className="mr-1 h-4 w-4" /> Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by invoice # or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No purchases yet. Create your first purchase order!
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="font-medium">{p.invoice_number || p.id.slice(0, 8)}</TableCell>
                        <TableCell>{p.suppliers?.name || "—"}</TableCell>
                        <TableCell>{p.locations?.name || "—"}</TableCell>
                        <TableCell className="text-right font-medium">{formatKES(p.total)}</TableCell>
                        <TableCell>{paymentBadge(p.payment_status)}</TableCell>
                        <TableCell>{statusBadge(p.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Suppliers</CardTitle>
              <Button size="sm" onClick={() => { setEditingSupplier(null); setSupplierDialogOpen(true); }}>
                <Plus className="mr-1 h-4 w-4" /> Add Supplier
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!suppliersQuery.data || suppliersQuery.data.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No suppliers yet.</TableCell>
                    </TableRow>
                  ) : (
                    suppliersQuery.data.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.phone || "—"}</TableCell>
                        <TableCell>{s.email || "—"}</TableCell>
                        <TableCell className="text-right">{formatKES(s.balance)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditingSupplier(s); setSupplierDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => removeSupplier.mutate(s.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SupplierFormDialog
        open={supplierDialogOpen}
        onOpenChange={(o) => { setSupplierDialogOpen(o); if (!o) setEditingSupplier(null); }}
        onSubmit={handleSupplierSubmit}
        supplier={editingSupplier}
        isLoading={createSupplier.isPending || updateSupplier.isPending}
      />

      <PurchaseFormDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        onSubmit={(data) => createPurchase.mutate(data, { onSuccess: () => setPurchaseDialogOpen(false) })}
        isLoading={createPurchase.isPending}
      />
    </div>
  );
};

export default Purchases;
