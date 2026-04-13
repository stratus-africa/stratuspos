import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { startOfDay, subDays, format, startOfWeek, startOfMonth } from "date-fns";

interface DailySales {
  date: string;
  total: number;
  count: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  total_qty: number;
  total_revenue: number;
}

interface LowStockItem {
  product_id: string;
  product_name: string;
  quantity: number;
  threshold: number;
  location_name: string;
}

interface DashboardData {
  todaySales: number;
  todayCount: number;
  todayProfit: number;
  todayExpenses: number;
  salesTrend: DailySales[];
  topProducts: TopProduct[];
  lowStockItems: LowStockItem[];
  loading: boolean;
}

export function useDashboard(): DashboardData {
  const { business, currentLocation } = useBusiness();
  const [data, setData] = useState<DashboardData>({
    todaySales: 0,
    todayCount: 0,
    todayProfit: 0,
    todayExpenses: 0,
    salesTrend: [],
    topProducts: [],
    lowStockItems: [],
    loading: true,
  });

  useEffect(() => {
    if (!business?.id || !currentLocation?.id) return;

    const fetchAll = async () => {
      const today = startOfDay(new Date()).toISOString();
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Parallel fetches
      const [salesRes, saleItemsRes, expensesRes, inventoryRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id, total, subtotal, tax, discount, created_at")
          .eq("business_id", business.id)
          .eq("location_id", currentLocation.id)
          .gte("created_at", thirtyDaysAgo)
          .eq("status", "final"),
        supabase
          .from("sale_items")
          .select("product_id, quantity, unit_price, total, sale_id, products(name, purchase_price)")
          .in(
            "sale_id",
            (await supabase
              .from("sales")
              .select("id")
              .eq("business_id", business.id)
              .eq("location_id", currentLocation.id)
              .gte("created_at", thirtyDaysAgo)
              .eq("status", "final")
            ).data?.map((s) => s.id) || []
          ),
        supabase
          .from("expenses")
          .select("amount, date")
          .eq("business_id", business.id)
          .gte("date", format(startOfDay(new Date()), "yyyy-MM-dd"))
          .lte("date", format(new Date(), "yyyy-MM-dd")),
        supabase
          .from("inventory")
          .select("product_id, quantity, low_stock_threshold, location_id, products(name), locations(name)")
          .eq("location_id", currentLocation.id),
      ]);

      const sales = salesRes.data || [];
      const saleItems = saleItemsRes.data || [];
      const expenses = expensesRes.data || [];
      const inventory = inventoryRes.data || [];

      // Today's summary
      const todaySales = sales.filter((s) => s.created_at >= today);
      const todaySalesTotal = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
      const todayCount = todaySales.length;

      // Today's profit: revenue - COGS
      const todaySaleIds = new Set(todaySales.map((s) => s.id));
      const todayItems = saleItems.filter((i) => todaySaleIds.has(i.sale_id));
      const todayCOGS = todayItems.reduce((sum, i) => {
        const pp = (i.products as any)?.purchase_price || 0;
        return sum + pp * Number(i.quantity);
      }, 0);
      const todayExpensesTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const todayProfit = todaySalesTotal - todayCOGS - todayExpensesTotal;

      // Sales trend (last 30 days)
      const trendMap = new Map<string, { total: number; count: number }>();
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        trendMap.set(d, { total: 0, count: 0 });
      }
      sales.forEach((s) => {
        const d = format(new Date(s.created_at), "yyyy-MM-dd");
        const entry = trendMap.get(d);
        if (entry) {
          entry.total += Number(s.total);
          entry.count += 1;
        }
      });
      const salesTrend: DailySales[] = Array.from(trendMap.entries()).map(([date, v]) => ({
        date,
        total: v.total,
        count: v.count,
      }));

      // Top products (by qty sold in last 30 days)
      const prodMap = new Map<string, { name: string; qty: number; revenue: number }>();
      saleItems.forEach((item) => {
        const pid = item.product_id;
        const name = (item.products as any)?.name || "Unknown";
        const existing = prodMap.get(pid) || { name, qty: 0, revenue: 0 };
        existing.qty += Number(item.quantity);
        existing.revenue += Number(item.total);
        prodMap.set(pid, existing);
      });
      const topProducts: TopProduct[] = Array.from(prodMap.entries())
        .map(([id, v]) => ({ product_id: id, product_name: v.name, total_qty: v.qty, total_revenue: v.revenue }))
        .sort((a, b) => b.total_qty - a.total_qty)
        .slice(0, 5);

      // Low stock
      const lowStockItems: LowStockItem[] = inventory
        .filter((i) => Number(i.quantity) <= Number(i.low_stock_threshold))
        .map((i) => ({
          product_id: i.product_id,
          product_name: (i.products as any)?.name || "Unknown",
          quantity: Number(i.quantity),
          threshold: Number(i.low_stock_threshold),
          location_name: (i.locations as any)?.name || "",
        }))
        .sort((a, b) => a.quantity - b.quantity);

      setData({
        todaySales: todaySalesTotal,
        todayCount,
        todayProfit,
        todayExpenses: todayExpensesTotal,
        salesTrend,
        topProducts,
        lowStockItems,
        loading: false,
      });
    };

    fetchAll();
  }, [business?.id, currentLocation?.id]);

  return data;
}
