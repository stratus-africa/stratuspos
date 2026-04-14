import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Product } from "@/hooks/useProducts";

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
}

export interface HeldSale {
  id: string;
  label: string;
  cart: CartItem[];
  customerId: string | null;
  customerName: string | null;
  createdAt: Date;
}

export interface PaymentEntry {
  method: "cash" | "mpesa" | "card";
  amount: number;
  reference: string;
}

export function usePOS() {
  const { business, currentLocation } = useBusiness();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [processing, setProcessing] = useState(false);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1, unit_price: product.selling_price, discount: 0 }];
    });
  }, []);

  const updateCartItem = useCallback((productId: string, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, ...updates } : i))
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCustomerId(null);
    setCustomerName(null);
  }, []);

  const cartSubtotal = cart.reduce((sum, i) => sum + i.unit_price * i.quantity - i.discount, 0);
  const cartTax = cart.reduce((sum, i) => {
    const lineTotal = i.unit_price * i.quantity - i.discount;
    const rate = (i.product.tax_rate ?? business?.tax_rate ?? 16) / 100;
    return sum + lineTotal * rate / (1 + rate);
  }, 0);
  const cartTotal = cartSubtotal;

  // Hold current sale
  const holdSale = useCallback(() => {
    if (cart.length === 0) return;
    const held: HeldSale = {
      id: crypto.randomUUID(),
      label: customerName || `Sale #${heldSales.length + 1}`,
      cart: [...cart],
      customerId,
      customerName,
      createdAt: new Date(),
    };
    setHeldSales((prev) => [...prev, held]);
    clearCart();
    toast.info("Sale held");
  }, [cart, customerId, customerName, heldSales.length, clearCart]);

  // Resume a held sale
  const resumeSale = useCallback((id: string) => {
    const held = heldSales.find((h) => h.id === id);
    if (!held) return;
    // If current cart has items, hold it first
    if (cart.length > 0) holdSale();
    setCart(held.cart);
    setCustomerId(held.customerId);
    setCustomerName(held.customerName);
    setHeldSales((prev) => prev.filter((h) => h.id !== id));
  }, [heldSales, cart, holdSale]);

  const removeHeldSale = useCallback((id: string) => {
    setHeldSales((prev) => prev.filter((h) => h.id !== id));
  }, []);

  // Complete sale
  const completeSale = async (payments: PaymentEntry[], bankAccountId?: string | null) => {
    setProcessing(true);

    try {
      const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
      const paymentStatus = totalPaid >= cartTotal ? "paid" : totalPaid > 0 ? "partial" : "unpaid";

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

      const saleId = crypto.randomUUID();

      // Create sale
      const { error: saleErr } = await supabase.from("sales").insert({
        id: saleId,
        business_id: business.id,
        location_id: currentLocation.id,
        customer_id: customerId,
        invoice_number: invoiceNumber,
        subtotal: cartSubtotal,
        tax: Math.round(cartTax * 100) / 100,
        discount: cart.reduce((s, i) => s + i.discount, 0),
        total: cartTotal,
        payment_status: paymentStatus,
        status: "final",
        created_by: user.id,
      });
      if (saleErr) throw saleErr;

      // Insert sale items
      const saleItems = cart.map((i) => ({
        sale_id: saleId,
        product_id: i.product.id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount,
        total: i.unit_price * i.quantity - i.discount,
      }));
      const { error: itemsErr } = await supabase.from("sale_items").insert(saleItems);
      if (itemsErr) throw itemsErr;

      // Insert payments
      if (payments.length > 0) {
        const paymentRows = payments.filter((p) => p.amount > 0).map((p) => ({
          sale_id: saleId,
          method: p.method,
          amount: p.amount,
          reference: p.reference || null,
        }));
        if (paymentRows.length > 0) {
          const { error: payErr } = await supabase.from("payments").insert(paymentRows);
          if (payErr) throw payErr;
        }
      }

      // Deduct inventory
      for (const item of cart) {
        const { data: inv } = await supabase
          .from("inventory")
          .select("id, quantity")
          .eq("product_id", item.product.id)
          .eq("location_id", currentLocation.id)
          .maybeSingle();

        if (inv) {
          await supabase
            .from("inventory")
            .update({ quantity: inv.quantity - item.quantity })
            .eq("id", inv.id);
        }

        await supabase.from("stock_adjustments").insert({
          product_id: item.product.id,
          location_id: currentLocation.id,
          quantity_change: -item.quantity,
          reason: "sale",
          notes: `Sale ${invoiceNumber}`,
          created_by: user.id,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["stock_adjustments"] });

      const result = {
        saleId,
        invoiceNumber,
        items: cart,
        subtotal: cartSubtotal,
        tax: Math.round(cartTax * 100) / 100,
        discount: cart.reduce((s, i) => s + i.discount, 0),
        total: cartTotal,
        payments,
        totalPaid,
        change: Math.max(0, totalPaid - cartTotal),
        customerName,
        locationName: currentLocation.name,
        businessName: business.name,
        date: new Date(),
      };

      clearCart();
      toast.success("Sale completed!");
      return result;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    } finally {
      setProcessing(false);
    }
  };

  return {
    cart, addToCart, updateCartItem, removeFromCart, clearCart,
    customerId, setCustomerId, customerName, setCustomerName,
    cartSubtotal, cartTax, cartTotal,
    heldSales, holdSale, resumeSale, removeHeldSale,
    completeSale, processing,
  };
}
