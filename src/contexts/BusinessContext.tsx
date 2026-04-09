import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Business {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  logo_url: string | null;
  tax_rate: number;
}

interface Location {
  id: string;
  business_id: string;
  name: string;
  type: string;
  address: string | null;
  is_active: boolean;
}

interface BusinessContextType {
  business: Business | null;
  locations: Location[];
  currentLocation: Location | null;
  setCurrentLocation: (location: Location) => void;
  loading: boolean;
  needsOnboarding: boolean;
  createBusiness: (name: string, locationName: string) => Promise<{ error: Error | null }>;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchBusiness = async () => {
    if (!user) {
      setBusiness(null);
      setLocations([]);
      setCurrentLocation(null);
      setLoading(false);
      setNeedsOnboarding(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!profile?.business_id) {
        setNeedsOnboarding(true);
        setLoading(false);
        return;
      }

      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", profile.business_id)
        .single();

      if (biz) {
        setBusiness(biz as Business);
        setNeedsOnboarding(false);

        const { data: locs } = await supabase
          .from("locations")
          .select("*")
          .eq("business_id", biz.id)
          .eq("is_active", true);

        const locationList = (locs || []) as Location[];
        setLocations(locationList);

        const savedLocId = localStorage.getItem("currentLocationId");
        const savedLoc = locationList.find((l) => l.id === savedLocId);
        setCurrentLocation(savedLoc || locationList[0] || null);
      } else {
        setNeedsOnboarding(true);
      }
    } catch {
      setNeedsOnboarding(true);
    }
    setLoading(false);
  };

  const createBusiness = async (name: string, locationName: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      // Generate ID client-side to avoid needing .select() which requires SELECT RLS
      const businessId = crypto.randomUUID();

      const { error: bizError } = await supabase
        .from("businesses")
        .insert({ id: businessId, name });

      if (bizError) throw bizError;

      // Update profile with business_id first so RLS works for subsequent inserts
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ business_id: businessId })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin", business_id: businessId });

      if (roleError) throw roleError;

      const { error: locError } = await supabase
        .from("locations")
        .insert({ business_id: businessId, name: locationName, type: "store" });

      if (locError) throw locError;

      await fetchBusiness();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const handleSetCurrentLocation = (location: Location) => {
    setCurrentLocation(location);
    localStorage.setItem("currentLocationId", location.id);
  };

  useEffect(() => {
    fetchBusiness();
  }, [user]);

  return (
    <BusinessContext.Provider
      value={{
        business,
        locations,
        currentLocation,
        setCurrentLocation: handleSetCurrentLocation,
        loading,
        needsOnboarding,
        createBusiness,
        refreshBusiness: fetchBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error("useBusiness must be used within BusinessProvider");
  return context;
};
