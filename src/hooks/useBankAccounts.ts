import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";

export interface BankAccount {
  id: string;
  name: string;
  account_type: string;
  balance: number;
}

export function useBankAccounts() {
  const { business } = useBusiness();

  return useQuery({
    queryKey: ["bank_accounts", business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("id, name, account_type, balance")
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!business,
  });
}
