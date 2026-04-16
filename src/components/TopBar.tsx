import { SidebarTrigger } from "@/components/ui/sidebar";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, FileText, Sunset } from "lucide-react";
import { useLocation } from "react-router-dom";
import { usePOSSession } from "@/hooks/usePOSSession";
import { useState } from "react";
import ZReportDialog from "@/components/pos/ZReportDialog";
import EndDayDialog from "@/components/pos/EndDayDialog";

export function TopBar() {
  const { business, locations, currentLocation, setCurrentLocation } = useBusiness();
  const { user } = useAuth();
  const location = useLocation();
  const session = usePOSSession();

  const [zReportOpen, setZReportOpen] = useState(false);
  const [endDayOpen, setEndDayOpen] = useState(false);

  const isPOS = location.pathname === "/pos";

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  const handleEndDay = async (closingCash: number, notes?: string) => {
    const closedSession = await session.endDay(closingCash, notes);
    setEndDayOpen(false);
    if (closedSession) {
      setZReportOpen(true);
    }
  };

  return (
    <>
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
          {isPOS && session.activeSession && (
            <>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1 text-xs">
                <Clock className="h-3 w-3" />
                Register Open since {new Date(session.activeSession.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Badge>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setZReportOpen(true)}>
                <FileText className="h-3.5 w-3.5 mr-1" />
                Z Report
              </Button>
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setEndDayOpen(true)}>
                <Sunset className="h-3.5 w-3.5 mr-1" />
                End Day
              </Button>
            </>
          )}
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {isPOS && session.activeSession && (
        <>
          <EndDayDialog
            open={endDayOpen}
            onOpenChange={setEndDayOpen}
            session={session.activeSession}
            onConfirm={handleEndDay}
          />
          <ZReportDialog
            open={zReportOpen}
            onOpenChange={setZReportOpen}
            sessions={[]}
            onLoadSessions={session.fetchSessionHistory}
          />
        </>
      )}
    </>
  );
}
