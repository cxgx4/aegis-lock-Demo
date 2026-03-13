import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Key, Database, FileText, Clock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAegis } from "@/hooks/useAegis";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CreateRecordDialog from "@/components/CreateRecordDialog";

interface RecordRow {
  id: string;
  name: string;
  identifier: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { aegis, loading } = useAegis();
  const { toast } = useToast();
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalEncrypted, setTotalEncrypted] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState("");

  const fetchData = async () => {
    if (!aegis) return;
    const { data: recs } = await supabase.from("records").select("*").order("created_at", { ascending: false }).limit(4);
    if (recs) {
      setRecords(recs);
      setTotalRecords(recs.length);
      if (!selectedRecordId && recs.length > 0) setSelectedRecordId(recs[0].id);
    }
    const { count } = await supabase.from("secure_fields").select("*", { count: "exact", head: true });
    setTotalEncrypted((count || 0) * 3);
  };

  useEffect(() => {
    if (aegis) fetchData();
  }, [aegis]);

  const handleSaveNote = async () => {
    if (!aegis || !note.trim() || !selectedRecordId) return;
    setSaving(true);
    try {
      await aegis.insert("secure_fields", {
        record_id: selectedRecordId,
        encrypted_content: note,
        encrypted_field_1: "Category: Quick Note",
        encrypted_field_2: "Priority: Normal",
      });
      setNote("");
      await fetchData();
      toast({ title: "Note saved", description: "Encrypted and stored securely." });
    } catch (err) {
      toast({ title: "Save failed", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border bg-card">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Records</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{totalRecords}</p>
                  </div>
                  <Database className="w-8 h-8 text-accent/60" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border bg-card">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Encrypted Fields</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{totalEncrypted}</p>
                  </div>
                  <Shield className="w-8 h-8 text-accent/60" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-border bg-card">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Encryption</p>
                    <p className="text-2xl font-bold text-foreground mt-1">AES-256</p>
                  </div>
                  <Key className="w-8 h-8 text-accent/60" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Records */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-foreground">Recent Records</CardTitle>
                  {aegis && <CreateRecordDialog aegis={aegis} onCreated={fetchData} />}
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {records.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => navigate(`/records/${record.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-secondary transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{record.name}</p>
                      <p className="text-xs text-muted-foreground">{record.identifier}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(record.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
                {records.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No records yet. Create your first one!</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Notes */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground">Quick Encrypted Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {records.length > 0 ? (
                  <>
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Attach to record</p>
                      <Select value={selectedRecordId} onValueChange={setSelectedRecordId}>
                        <SelectTrigger className="bg-secondary border-border text-sm">
                          <SelectValue placeholder="Select a record" />
                        </SelectTrigger>
                        <SelectContent>
                          {records.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name} ({r.identifier})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Enter a note (will be field-level encrypted)..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="min-h-[100px] bg-secondary border-border resize-none text-sm"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Shield className="w-3 h-3 text-accent" />
                        Auto-encrypted with AES-256-GCM
                      </p>
                      <Button
                        size="sm"
                        onClick={handleSaveNote}
                        disabled={saving || !note.trim() || !selectedRecordId}
                        className="text-xs"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Note"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">Create a record first to attach notes.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Security Analytics */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                Security Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Encrypted Fields", value: String(totalEncrypted) },
                  { label: "Encryption Algorithm", value: "AES-256-GCM" },
                  { label: "Key Derivation", value: "Web Crypto API" },
                  { label: "Active Sessions", value: "1" },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-lg bg-secondary">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
