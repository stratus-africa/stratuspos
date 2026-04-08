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
      const { data: biz, error: bizError } = await supabase
        .from("businesses")
        .insert({ name })
        .select()
        .single();

      if (bizError) throw bizError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ business_id: biz.id })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { error: locError } = await supabase
        .from("locations")
        .insert({ business_id: biz.id, name: locationName, type: "store" });

      if (locError) throw locError;

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin", business_id: biz.id });

      if (roleError) throw roleError;

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
