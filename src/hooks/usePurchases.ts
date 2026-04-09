import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { toast } from "sonner";

export interface Supplier {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number;
}

export interface Purchase {
  id: string;
  business_id: string;
  supplier_id: string | null;
  location_id: string;
  invoice_number: string | null;
  subtotal: number;
  tax: number;
  total: number;
  payment_status: string;
  status: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  suppliers?: { name: string } | null;
  locations?: { name: string } | null;
}

export interface PurchaseItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total: number;
  products?: { name: string } | null;
}

export function useSuppliers() {
  const { business } = useBusiness();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["suppliers", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("business_id", business.id)
        .order("name");
      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!business,
  });

  const create = useMutation({
    mutationFn: async (s: Omit<Supplier, "id" | "business_id" | "balance">) => {
      if (!business) throw new Error("No business");
      const { error } = await supabase.from("suppliers").insert({ ...s, business_id: business.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Supplier created"); },
    onError: (e) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...s }: Partial<Supplier> & { id: string }) => {
      const { error } = await supabase.from("suppliers").update(s).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Supplier updated"); },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Supplier deleted"); },
    onError: (e) => toast.error(e.message),
  });

  return { query, create, update, remove };
}

export function usePurchases() {
  const { business } = useBusiness();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["purchases", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from("purchases")
        .select("*, suppliers(name), locations(name)")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Purchase[];
    },
    enabled: !!business,
  });

  const createPurchase = useMutation({
    mutationFn: async ({
      purchase,
      items,
    }: {
      purchase: {
        supplier_id: string | null;
        location_id: string;
        invoice_number?: string;
        subtotal: number;
        tax: number;
        total: number;
        payment_status: string;
        status: string;
        notes?: string;
        created_by: string;
      };
      items: PurchaseItem[];
    }) => {
      if (!business) throw new Error("No business");
      const purchaseId = crypto.randomUUID();
      const { error: pError } = await supabase
        .from("purchases")
        .insert({ id: purchaseId, ...purchase, business_id: business.id });
      if (pError) throw pError;

      if (items.length > 0) {
        const { error: iError } = await supabase
          .from("purchase_items")
          .insert(items.map((i) => ({ purchase_id: purchaseId, product_id: i.product_id, quantity: i.quantity, unit_cost: i.unit_cost, total: i.total })));
        if (iError) throw iError;
      }

      // Auto-update inventory if status is received
      if (purchase.status === "received") {
        for (const item of items) {
          const { data: existing } = await supabase
            .from("inventory")
            .select("id, quantity")
            .eq("product_id", item.product_id)
            .eq("location_id", purchase.location_id)
            .maybeSingle();

          if (existing) {
            await supabase.from("inventory").update({ quantity: existing.quantity + item.quantity }).eq("id", existing.id);
          } else {
            await supabase.from("inventory").insert({ product_id: item.product_id, location_id: purchase.location_id, quantity: item.quantity });
          }

          // Record stock adjustment
          await supabase.from("stock_adjustments").insert({
            product_id: item.product_id,
            location_id: purchase.location_id,
            quantity_change: item.quantity,
            reason: "Purchase received",
            notes: `Purchase #${purchase.invoice_number || purchaseId.slice(0, 8)}`,
            created_by: purchase.created_by,
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stock_adjustments"] });
      toast.success("Purchase created");
    },
    onError: (e) => toast.error(e.message),
  });

  return { query, createPurchase };
}
