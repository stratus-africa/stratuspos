import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuditLog {
  id: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: any;
}

interface Props {
  logs: AuditLog[];
  loading: boolean;
  from: string;
  to: string;
}

const actionColor = (action: string) => {
  if (action.includes("delete") || action.includes("remove")) return "destructive";
  if (action.includes("create") || action.includes("add")) return "default";
  if (action.includes("update") || action.includes("edit")) return "secondary";
  return "outline";
};

export default function AuditLogReportTab({ logs, loading, from, to }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return logs;
    return logs.filter((l) =>
      [l.user_name, l.user_email, l.action, l.entity_type, l.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [logs, search]);

  const exportCsv = () => {
    const headers = ["Date", "User", "Email", "Action", "Entity", "Description"];
    const rows = filtered.map((l) => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss"),
      l.user_name || "",
      l.user_email || "",
      l.action,
      l.entity_type || "",
      (l.description || "").replace(/"/g, '""'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search user, action, entity..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{filtered.length} entries</Badge>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No audit entries in this period</TableCell></TableRow>
              ) : (
                filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs whitespace-nowrap">{format(new Date(l.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{l.user_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{l.user_email || ""}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionColor(l.action) as any} className="capitalize">{l.action.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {l.entity_type ? <span className="capitalize">{l.entity_type}</span> : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[400px] truncate" title={l.description || ""}>
                      {l.description || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
