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
  User, List, LayoutGrid, Sunrise, Banknote, Smartphone, CreditCard, ScanLine,
  ChevronUp, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useSales";
import { usePOS, CartItem, PaymentEntry } from "@/hooks/usePOS";
import { usePOSSession } from "@/hooks/usePOSSession";
import { useInventory } from "@/hooks/useInventory";
import { useBusiness } from "@/contexts/BusinessContext";
import { useIsMobile } from "@/hooks/use-mobile";
import PaymentDialog from "@/components/pos/PaymentDialog";
import ReceiptDialog from "@/components/pos/ReceiptDialog";
import StartDayDialog from "@/components/pos/StartDayDialog";
import BarcodeScanner from "@/components/BarcodeScanner";

const POS = () => {
  const { productsQuery } = useProducts();
  const { query: categoriesQuery } = useCategories();
  const { query: customersQuery } = useCustomers();
  const pos = usePOS();
  const session = usePOSSession();
  const { currentLocation } = useBusiness();
  const { inventoryQuery } = useInventory(currentLocation?.id);

  const isMobile = useIsMobile();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<"cash" | "mpesa" | "card">("cash");
  const [receiptData, setReceiptData] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [startDayOpen, setStartDayOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [mobileCartExpanded, setMobileCartExpanded] = useState(false);

  const handleScanned = (code: string) => {
    const match = (productsQuery.data ?? []).find(
      (p) => p.is_active && (p.barcode === code || p.sku === code)
    );
    if (match) {
      pos.addToCart(match);
    } else {
      setSearch(code);
      toast.warning(`No product matches "${code}"`);
    }
  };

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const inventory = inventoryQuery.data ?? [];

  const stockMap = useMemo(() => {
    const m = new Map<string, number>();
    inventory.forEach((i) => m.set(i.product_id, Number(i.quantity)));
    return m;
  }, [inventory]);

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
        {/* Search & filters - single row on mobile */}
        <div className="flex flex-row gap-2 mb-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-24 sm:w-40 shrink-0">
              <SelectValue placeholder="Cat." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="icon" variant="outline" className="shrink-0" onClick={() => setScannerOpen(true)} title="Scan barcode">
            <ScanLine className="h-4 w-4" />
          </Button>
          <div className="flex gap-1 shrink-0">
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
            <div className="border rounded-lg overflow-hidden">
              {activeProducts.map((p, idx) => {
                const qty = stockMap.get(p.id) ?? 0;
                const lowStock = qty <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => pos.addToCart(p)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 border-b last:border-b-0 hover:bg-accent transition-colors text-left ${
                      idx % 2 === 0 ? "bg-card" : "bg-muted/40"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{p.name}</span>
                      {p.sku && <span className="text-xs text-muted-foreground ml-2">{p.sku}</span>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={lowStock ? "destructive" : "secondary"} className="text-[10px] font-normal">
                        Qty: {qty}
                      </Badge>
                      <span className="font-semibold text-primary text-sm min-w-[80px] text-right">
                        KES {Number(p.selling_price).toLocaleString()}
                      </span>
                    </div>
                  </button>
                );
              })}
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
        {(!isMobile || mobileCartExpanded) && (
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Cart
                {pos.cart.length > 0 && <Badge variant="secondary">{pos.cart.length}</Badge>}
              </CardTitle>
              {isMobile && (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setMobileCartExpanded(false)}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
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
        )}

        <CardContent className="flex-1 flex flex-col min-h-0 p-3">
          {(!isMobile || mobileCartExpanded) && (
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
          )}

          <div className={`${(!isMobile || mobileCartExpanded) ? "pt-3 border-t mt-2" : ""} space-y-2`}>
            {isMobile && !mobileCartExpanded && pos.cart.length > 0 && (
              <button
                type="button"
                onClick={() => setMobileCartExpanded(true)}
                className="flex items-center justify-between w-full px-2 py-1 rounded hover:bg-accent"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <ShoppingCart className="h-4 w-4" />
                  {pos.cart.length} item{pos.cart.length === 1 ? "" : "s"}
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                </span>
                <span className="font-bold text-base">KES {pos.cartTotal.toLocaleString()}</span>
              </button>
            )}
            {(!isMobile || mobileCartExpanded) && pos.cart.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>KES {pos.cartSubtotal.toLocaleString()}</span></div>
                {pos.cartTax > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">VAT (incl.)</span><span>KES {Math.round(pos.cartTax).toLocaleString()}</span></div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>KES {pos.cartTotal.toLocaleString()}</span></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="default"
                className="flex flex-col items-center gap-0.5 h-auto py-3"
                disabled={pos.cart.length === 0}
                onClick={() => { setInitialPaymentMethod("cash"); setPaymentOpen(true); }}
              >
                <Banknote className="h-5 w-5" />
                <span className="text-xs font-medium">Cash</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-0.5 h-auto py-3 bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                disabled={pos.cart.length === 0}
                onClick={() => { setInitialPaymentMethod("mpesa"); setPaymentOpen(true); }}
              >
                <Smartphone className="h-5 w-5" />
                <span className="text-xs font-medium">M-Pesa</span>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-0.5 h-auto py-2 bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                disabled={pos.cart.length === 0}
                onClick={() => {
                  if (!pos.customerId) {
                    toast.error("Credit Sale requires a customer. Select a customer above (walk-in is not allowed).");
                    return;
                  }
                  setInitialPaymentMethod("card");
                  setPaymentOpen(true);
                }}
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-[10px] font-medium">Credit Sale</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-0.5 h-auto py-2 bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600"
                disabled={pos.cart.length === 0}
                onClick={pos.holdSale}
              >
                <Pause className="h-4 w-4" />
                <span className="text-[10px] font-medium">Suspend Sale</span>
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
        initialMethod={initialPaymentMethod}
      />

      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        data={receiptData}
      />

      <BarcodeScanner open={scannerOpen} onOpenChange={setScannerOpen} onDetected={handleScanned} />

    </div>
  );
};

function CartItemRow({ item, onUpdate, onRemove }: { item: CartItem; onUpdate: (id: string, u: Partial<CartItem>) => void; onRemove: (id: string) => void }) {
  const lineTotal = item.unit_price * item.quantity - item.discount;
  const allowDecimal = item.product.allow_decimal_quantity ?? false;
  const step = allowDecimal ? 0.01 : 1;
  const minQty = allowDecimal ? 0.01 : 1;
  const decrementBy = allowDecimal ? 0.5 : 1;
  return (
    <div className="flex items-start gap-2 p-2 rounded border bg-background">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.product.name}</p>
        <p className="text-xs text-muted-foreground">@ KES {Number(item.unit_price).toLocaleString()}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onUpdate(item.product.id, { quantity: Math.max(minQty, +(item.quantity - decrementBy).toFixed(3)) })}>
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          className="w-14 h-7 text-center text-sm p-0"
          type="number"
          min={minQty}
          step={step}
          value={item.quantity}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (Number.isNaN(v)) return;
            onUpdate(item.product.id, { quantity: Math.max(minQty, v) });
          }}
        />
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onUpdate(item.product.id, { quantity: +(item.quantity + (allowDecimal ? 0.5 : 1)).toFixed(3) })}>
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
