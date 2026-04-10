import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Search, Eye, Trash2, Users, Plus, Pencil } from "lucide-react";
import { useSales, useCustomers, Sale, Customer } from "@/hooks/useSales";
import { useBusiness } from "@/contexts/BusinessContext";
import SaleDetailDialog from "@/components/sales/SaleDetailDialog";
import CustomerFormDialog from "@/components/sales/CustomerFormDialog";
import { format } from "date-fns";

const Sales = () => {
  const { business, locations } = useBusiness();
  const { salesQuery, deleteSale } = useSales();
  const { query: customersQuery, create: createCustomer, update: updateCustomer, remove: removeCustomer } = useCustomers();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");

  const sales = salesQuery.data ?? [];
  const customers = customersQuery.data ?? [];

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      (s.invoice_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.customers?.name || "walk-in").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone || "").includes(customerSearch)
  );

  const totalSales = sales.reduce((s, v) => s + Number(v.total), 0);
  const paidSales = sales.filter((s) => s.payment_status === "paid").length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sales</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="text-2xl font-bold">KES {totalSales.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Transactions</p>
            <p className="text-2xl font-bold">{sales.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-green-600">{paidSales} / {sales.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history" className="flex items-center gap-1"><Receipt className="h-4 w-4" /> Sales History</TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-1"><Users className="h-4 w-4" /> Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoice or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesQuery.isLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filteredSales.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No sales found. Create sales from the POS screen.</TableCell></TableRow>
                  ) : (
                    filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.invoice_number || "—"}</TableCell>
                        <TableCell>{format(new Date(sale.created_at), "PP")}</TableCell>
                        <TableCell>{sale.customers?.name || "Walk-in"}</TableCell>
                        <TableCell>{sale.locations?.name}</TableCell>
                        <TableCell className="text-right font-medium">KES {Number(sale.total).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={sale.payment_status === "paid" ? "default" : sale.payment_status === "partial" ? "secondary" : "destructive"}>
                            {sale.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedSale(sale); setDetailOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteSale.mutate(sale.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customers..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={() => { setEditingCustomer(null); setCustomerDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Customer
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersQuery.isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No customers yet.</TableCell></TableRow>
                  ) : (
                    filteredCustomers.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.phone || "—"}</TableCell>
                        <TableCell>{c.email || "—"}</TableCell>
                        <TableCell className="text-right">KES {Number(c.balance).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingCustomer(c); setCustomerDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeCustomer.mutate(c.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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

      <SaleDetailDialog open={detailOpen} onOpenChange={setDetailOpen} sale={selectedSale} />

      <CustomerFormDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        initial={editingCustomer}
        loading={createCustomer.isPending || updateCustomer.isPending}
        onSubmit={(data) => {
          if (editingCustomer) {
            updateCustomer.mutate({ id: editingCustomer.id, ...data }, { onSuccess: () => setCustomerDialogOpen(false) });
          } else {
            createCustomer.mutate(data, { onSuccess: () => setCustomerDialogOpen(false) });
          }
        }}
      />
    </div>
  );
};

export default Sales;
