import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShoppingCart, Search, Plus, Minus, Trash2, Pause, Play, X,
  User, List, LayoutGrid, Sunrise, Banknote, Smartphone, CreditCard,
} from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useSales";
import { usePOS, CartItem, PaymentEntry } from "@/hooks/usePOS";
import { usePOSSession } from "@/hooks/usePOSSession";
import PaymentDialog from "@/components/pos/PaymentDialog";
import ReceiptDialog from "@/components/pos/ReceiptDialog";
import StartDayDialog from "@/components/pos/StartDayDialog";

const POS = () => {
  const { productsQuery } = useProducts();
  const { query: categoriesQuery } = useCategories();
  const { query: customersQuery } = useCustomers();
  const pos = usePOS();
  const session = usePOSSession();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [startDayOpen, setStartDayOpen] = useState(false);

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const customers = customersQuery.data ?? [];

  const activeProducts = useMemo(
    () =>
      products.filter((p) => {
        if (!p.is_active) return false;
        const matchSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.sku || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.barcode || "").includes(search);
        const matchCat = categoryFilter === "all" || p.category_id === categoryFilter;
        return matchSearch && matchCat;
      }),
    [products, search, categoryFilter]
  );

  const handlePaymentConfirm = async (payments: PaymentEntry[], bankAccountId: string | null) => {
    const result = await pos.completeSale(payments, bankAccountId);
    if (result) {
      setPaymentOpen(false);
      setReceiptData(result);
      setReceiptOpen(true);
    }
  };

  const handleStartDay = async (openingFloat: number) => {
    await session.startDay(openingFloat);
    setStartDayOpen(false);
  };


  // Show loading while checking session
  if (session.loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // No active session — show Start of Day prompt
  if (!session.activeSession) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Sunrise className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Start Your Day</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Open the register to begin processing sales. You'll need to count and enter your starting cash float.
              </p>
            </div>
            <Button size="lg" onClick={() => setStartDayOpen(true)}>
              <Sunrise className="mr-2 h-5 w-5" />
              Start of Day
            </Button>
          </CardContent>
        </Card>

        <StartDayDialog open={startDayOpen} onOpenChange={setStartDayOpen} onConfirm={handleStartDay} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)]">

      {/* Left: Product selection */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search product or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button size="icon" variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button size="icon" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Product grid/list */}
        <ScrollArea className="flex-1">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {activeProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pos.addToCart(p)}
                  className="flex flex-col items-start p-3 rounded-lg border bg-card text-left transition-colors hover:bg-accent hover:border-primary"
                >
                  <span className="font-medium text-sm line-clamp-2">{p.name}</span>
                  {p.sku && <span className="text-xs text-muted-foreground">{p.sku}</span>}
                  <span className="mt-auto pt-1 font-semibold text-primary">KES {Number(p.selling_price).toLocaleString()}</span>
                </button>
              ))}
              {activeProducts.length === 0 && (
                <p className="col-span-full text-center py-10 text-muted-foreground">No products found</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {activeProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pos.addToCart(p)}
                  className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-colors"
                >
                  <div>
                    <span className="font-medium text-sm">{p.name}</span>
                    {p.sku && <span className="text-xs text-muted-foreground ml-2">{p.sku}</span>}
                  </div>
                  <span className="font-semibold text-primary">KES {Number(p.selling_price).toLocaleString()}</span>
                </button>
              ))}
              {activeProducts.length === 0 && (
                <p className="text-center py-10 text-muted-foreground">No products found</p>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Held sales bar */}
        {pos.heldSales.length > 0 && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t overflow-x-auto">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Held:</span>
            {pos.heldSales.map((h) => (
              <Badge key={h.id} variant="secondary" className="cursor-pointer flex items-center gap-1 whitespace-nowrap">
                <button onClick={() => pos.resumeSale(h.id)} className="flex items-center gap-1">
                  <Play className="h-3 w-3" /> {h.label}
                </button>
                <button onClick={() => pos.removeHeldSale(h.id)}>
                  <X className="h-3 w-3 hover:text-destructive" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <Card className="w-full lg:w-[28rem] flex flex-col min-h-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Cart
              {pos.cart.length > 0 && <Badge variant="secondary">{pos.cart.length}</Badge>}
            </CardTitle>
          </div>
          {/* Customer selector */}
          <Select
            value={pos.customerId || "walkin"}
            onValueChange={(v) => {
              if (v === "walkin") {
                pos.setCustomerId(null);
                pos.setCustomerName(null);
              } else {
                const cust = customers.find((c) => c.id === v);
                pos.setCustomerId(v);
                pos.setCustomerName(cust?.name || null);
              }
            }}
          >
            <SelectTrigger className="mt-1">
              <User className="h-4 w-4 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Walk-in Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walkin">Walk-in Customer</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0 p-3">
          <ScrollArea className="flex-1">
            {pos.cart.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground text-sm">Add products to start a sale</p>
            ) : (
              <div className="space-y-2">
                {pos.cart.map((item) => (
                  <CartItemRow key={item.product.id} item={item} onUpdate={pos.updateCartItem} onRemove={pos.removeFromCart} />
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="pt-3 border-t mt-2 space-y-2">
            {pos.cart.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>KES {pos.cartSubtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">VAT (incl.)</span><span>KES {Math.round(pos.cartTax).toLocaleString()}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>KES {pos.cartTotal.toLocaleString()}</span></div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                variant="default"
                className="flex flex-col items-center gap-0.5 h-auto py-2"
                disabled={pos.cart.length === 0}
                onClick={() => { setPaymentOpen(true); }}
              >
                <Banknote className="h-4 w-4" />
                <span className="text-[10px] font-medium">Cash</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-0.5 h-auto py-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                disabled={pos.cart.length === 0}
                onClick={() => { setPaymentOpen(true); }}
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-[10px] font-medium">M-Pesa</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-0.5 h-auto py-2"
                disabled={pos.cart.length === 0}
                onClick={pos.holdSale}
              >
                <Pause className="h-4 w-4" />
                <span className="text-[10px] font-medium">Suspend</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-0.5 h-auto py-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                disabled={pos.cart.length === 0}
                onClick={() => { setPaymentOpen(true); }}
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-[10px] font-medium">Credit</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-0.5 h-auto py-2 border-destructive text-destructive hover:bg-destructive/10"
                disabled={pos.cart.length === 0}
                onClick={pos.clearCart}
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-[10px] font-medium">Clear</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={pos.cartTotal}
        onConfirm={handlePaymentConfirm}
        processing={pos.processing}
      />

      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        data={receiptData}
      />

    </div>
  );
};

function CartItemRow({ item, onUpdate, onRemove }: { item: CartItem; onUpdate: (id: string, u: Partial<CartItem>) => void; onRemove: (id: string) => void }) {
  const lineTotal = item.unit_price * item.quantity - item.discount;
  return (
    <div className="flex items-start gap-2 p-2 rounded border bg-background">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.product.name}</p>
        <p className="text-xs text-muted-foreground">@ KES {Number(item.unit_price).toLocaleString()}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onUpdate(item.product.id, { quantity: Math.max(1, item.quantity - 1) })}>
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          className="w-12 h-7 text-center text-sm p-0"
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => onUpdate(item.product.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
        />
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onUpdate(item.product.id, { quantity: item.quantity + 1 })}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="text-right min-w-[70px]">
        <p className="font-semibold text-sm">KES {lineTotal.toLocaleString()}</p>
      </div>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRemove(item.product.id)}>
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  );
}

export default POS;
