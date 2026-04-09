import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { toast } from "sonner";

export interface ExpenseCategory {
  id: string;
  business_id: string;
  name: string;
}

export interface Expense {
  id: string;
  business_id: string;
  location_id: string | null;
  category_id: string | null;
  amount: number;
  description: string | null;
  date: string;
  payment_method: string | null;
  reference: string | null;
  created_by: string;
  created_at: string;
  expense_categories?: { name: string } | null;
  locations?: { name: string } | null;
}

export function useExpenseCategories() {
  const { business } = useBusiness();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["expense_categories", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase.from("expense_categories").select("*").eq("business_id", business.id).order("name");
      if (error) throw error;
      return data as ExpenseCategory[];
    },
    enabled: !!business,
  });

  const create = useMutation({
    mutationFn: async (name: string) => {
      if (!business) throw new Error("No business");
      const { error } = await supabase.from("expense_categories").insert({ name, business_id: business.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expense_categories"] }); toast.success("Category created"); },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expense_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expense_categories"] }); toast.success("Category deleted"); },
    onError: (e) => toast.error(e.message),
  });

  return { query, create, remove };
}

export function useExpenses() {
  const { business } = useBusiness();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["expenses", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from("expenses")
        .select("*, expense_categories(name), locations(name)")
        .eq("business_id", business.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!business,
  });

  const create = useMutation({
    mutationFn: async (e: {
      category_id: string | null;
      location_id: string | null;
      amount: number;
      description?: string;
      date: string;
      payment_method?: string;
      reference?: string;
      created_by: string;
    }) => {
      if (!business) throw new Error("No business");
      const { error } = await supabase.from("expenses").insert({ ...e, business_id: business.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Expense recorded"); },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Expense deleted"); },
    onError: (e) => toast.error(e.message),
  });

  return { query, create, remove };
}
