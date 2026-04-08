import { SidebarTrigger } from "@/components/ui/sidebar";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin } from "lucide-react";

export function TopBar() {
  const { business, locations, currentLocation, setCurrentLocation } = useBusiness();
  const { user } = useAuth();

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="h-12 flex items-center justify-between border-b bg-card px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        {business && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {locations.length > 1 ? (
              <Select
                value={currentLocation?.id || ""}
                onValueChange={(val) => {
                  const loc = locations.find((l) => l.id === val);
                  if (loc) setCurrentLocation(loc);
                }}
              >
                <SelectTrigger className="h-7 w-auto border-none bg-transparent text-sm p-0 gap-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs">{currentLocation?.name}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
