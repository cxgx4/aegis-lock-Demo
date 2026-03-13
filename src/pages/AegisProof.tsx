import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Database, ArrowRight, Shield, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAegis } from "@/hooks/useAegis";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FieldRow = ({ label, value, isCipher }: { label: string; value: string; isCipher?: boolean }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
    {isCipher ? (
      <div className="p-2 rounded bg-destructive/5 border border-destructive/10">
        <p className="font-mono text-[10px] text-destructive/70 break-all leading-relaxed">{value}</p>
      </div>
    ) : (
      <p className="text-sm text-foreground break-all">{value}</p>
    )}
  </div>
);

interface RecordOption {
  id: string;
  name: string;
  identifier: string;
}

const AegisProof = () => {
  const { aegis, loading } = useAegis();
  const [decryptedView, setDecryptedView] = useState<Record<string, unknown> | null>(null);
  const [rawView, setRawView] = useState<Record<string, unknown> | null>(null);
  const [records, setRecords] = useState<RecordOption[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<RecordOption | null>(null);
  const [decryptionFailed, setDecryptionFailed] = useState(false);
  const [showReencryptForm, setShowReencryptForm] = useState(false);
  const [reencryptContent, setReencryptContent] = useState("");
  const [reencryptCategory, setReencryptCategory] = useState("");
  const [reencryptPriority, setReencryptPriority] = useState("Normal");
  const [reencrypting, setReencrypting] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Load all records
  useEffect(() => {
    const loadRecords = async () => {
      const { data } = await supabase.from("records").select("id, name, identifier").order("created_at", { ascending: false });
      if (data && data.length > 0) {
        setRecords(data);
        if (!selectedRecordId) {
          setSelectedRecordId(data[0].id);
        }
      }
    };
    loadRecords();
  }, []);

  // Load secure_fields for selected record
  useEffect(() => {
    if (!aegis || !selectedRecordId) return;

    const rec = records.find((r) => r.id === selectedRecordId);
    setSelectedRecord(rec || null);

    const fetchData = async () => {
      setFetching(true);
      setDecryptionFailed(false);
      setShowReencryptForm(false);

      // Decrypted view
      const { data: dec } = await aegis.select("secure_fields", { column: "record_id", value: selectedRecordId, limit: 1 });
      if (dec && dec.length > 0) {
        const row = dec[0] as Record<string, unknown>;
        setDecryptedView(row);
        if (row._decryptionFailed) {
          setDecryptionFailed(true);
        }
      } else {
        setDecryptedView(null);
      }

      // Raw ciphertext view
      const { data: raw } = await aegis.selectRaw("secure_fields", { column: "record_id", value: selectedRecordId, limit: 1 });
      if (raw && raw.length > 0) {
        setRawView(raw[0] as Record<string, unknown>);
      } else {
        setRawView(null);
      }

      setFetching(false);
    };

    fetchData();
  }, [aegis, selectedRecordId, records]);

  const handleReencrypt = async () => {
    if (!aegis || !selectedRecordId) return;
    setReencrypting(true);

    try {
      // Delete old secure_fields row
      await supabase.from("secure_fields").delete().eq("record_id", selectedRecordId);

      // Re-insert with current key
      await aegis.insert("secure_fields", {
        record_id: selectedRecordId,
        encrypted_content: reencryptContent || "Re-encrypted content",
        encrypted_field_1: reencryptCategory || "Category: General",
        encrypted_field_2: reencryptPriority ? `Priority: ${reencryptPriority}` : "Priority: Normal",
      });

      toast.success("Record re-encrypted with current key");
      setShowReencryptForm(false);
      setDecryptionFailed(false);

      // Reload data
      const { data: dec } = await aegis.select("secure_fields", { column: "record_id", value: selectedRecordId, limit: 1 });
      if (dec && dec.length > 0) setDecryptedView(dec[0] as Record<string, unknown>);

      const { data: raw } = await aegis.selectRaw("secure_fields", { column: "record_id", value: selectedRecordId, limit: 1 });
      if (raw && raw.length > 0) setRawView(raw[0] as Record<string, unknown>);
    } catch (err) {
      console.error("Re-encryption failed:", err);
      toast.error("Re-encryption failed");
    } finally {
      setReencrypting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Aegis Proof — Comparison View">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Aegis Proof — Comparison View">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-center space-y-2 mb-4">
            <h2 className="text-2xl font-bold text-foreground">Zero-Knowledge Encryption Proof</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              The same record, viewed from two perspectives. Sensitive fields are encrypted at the
              application layer — the database never sees plaintext.
            </p>
          </div>
        </motion.div>

        {/* Record Selector */}
        {records.length > 0 && (
          <div className="flex justify-center">
            <div className="w-72">
              <Label className="text-xs text-muted-foreground mb-1 block">Select Record</Label>
              <Select value={selectedRecordId} onValueChange={setSelectedRecordId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a record" />
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
          </div>
        )}

        {records.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No records found. Create a record from the Dashboard first.</p>
          </div>
        )}

        {fetching && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
          </div>
        )}

        {/* Key mismatch warning */}
        {decryptionFailed && !fetching && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-warning bg-warning/5">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-foreground">Key Mismatch Detected</p>
                    <p className="text-xs text-muted-foreground">
                      This record was encrypted with a different key than your current session key.
                      The original plaintext is unrecoverable. You can re-encrypt this record with
                      new values using your current key.
                    </p>
                    {!showReencryptForm && (
                      <Button size="sm" variant="outline" onClick={() => setShowReencryptForm(true)} className="mt-2">
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Re-encrypt with Current Key
                      </Button>
                    )}
                    {showReencryptForm && (
                      <div className="mt-3 space-y-3 border border-border rounded-md p-3 bg-card">
                        <div>
                          <Label className="text-xs">Sensitive Content</Label>
                          <Textarea
                            value={reencryptContent}
                            onChange={(e) => setReencryptContent(e.target.value)}
                            placeholder="Enter new sensitive content..."
                            className="mt-1 text-sm"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Category</Label>
                            <Input
                              value={reencryptCategory}
                              onChange={(e) => setReencryptCategory(e.target.value)}
                              placeholder="e.g. Medical"
                              className="mt-1 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Priority</Label>
                            <Select value={reencryptPriority} onValueChange={setReencryptPriority}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Normal">Normal</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleReencrypt} disabled={reencrypting}>
                            {reencrypting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Re-encrypt & Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowReencryptForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Side-by-side views */}
        {!fetching && selectedRecord && (decryptedView || rawView) && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
            {/* Authorized User View */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className={`border-accent/30 bg-card ${decryptionFailed ? "opacity-60" : ""}`}>
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4 text-accent" />
                    Authorized User View
                  </CardTitle>
                  <p className="text-[11px] text-accent">
                    {decryptionFailed ? "⚠ Decryption failed — showing ciphertext" : "Decrypted in-memory • Never stored in plaintext"}
                  </p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <FieldRow label="Record Name" value={selectedRecord.name} />
                  <FieldRow label="Identifier" value={selectedRecord.identifier} />
                  {decryptedView && (
                    <div className="border-t border-border pt-3 space-y-4">
                      <div className="flex items-center gap-1.5 text-[10px] text-accent font-medium uppercase tracking-wider">
                        <Shield className="w-3 h-3" />
                        Encrypted Fields ({decryptionFailed ? "Failed — Ciphertext" : "Decrypted View"})
                      </div>
                      <FieldRow
                        label="Sensitive Content"
                        value={String(decryptedView.encrypted_content || "")}
                        isCipher={decryptionFailed}
                      />
                      <FieldRow
                        label="Confidential Field 1"
                        value={String(decryptedView.encrypted_field_1 || "")}
                        isCipher={decryptionFailed}
                      />
                      <FieldRow
                        label="Confidential Field 2"
                        value={String(decryptedView.encrypted_field_2 || "")}
                        isCipher={decryptionFailed}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="hidden lg:flex flex-col items-center justify-center gap-2 pt-20"
            >
              <div className="gradient-teal-arrow rounded-full p-2 glow-teal">
                <ArrowRight className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="text-center max-w-[120px]">
                <p className="text-[10px] font-semibold text-accent leading-tight">
                  Aegis Transparent Field-Level Middleware
                </p>
                <p className="text-[9px] font-mono text-muted-foreground mt-0.5">(AES-256-GCM)</p>
              </div>
            </motion.div>

            {/* Database / Hacker View */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-destructive/20 bg-card">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Database className="w-4 h-4 text-destructive/70" />
                    Database Admin / Hacker View
                  </CardTitle>
                  <p className="text-[11px] text-destructive/60">Raw database storage • Ciphertext only</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <FieldRow label="Record Name" value={selectedRecord.name} />
                  <FieldRow label="Identifier" value={selectedRecord.identifier} />
                  {rawView && (
                    <div className="border-t border-border pt-3 space-y-4">
                      <div className="flex items-center gap-1.5 text-[10px] text-destructive/60 font-medium uppercase tracking-wider">
                        <Shield className="w-3 h-3" />
                        Encrypted Fields (Ciphertext)
                      </div>
                      <FieldRow label="Sensitive Content" value={String(rawView.encrypted_content || "")} isCipher />
                      <FieldRow label="Confidential Field 1" value={String(rawView.encrypted_field_1 || "")} isCipher />
                      <FieldRow label="Confidential Field 2" value={String(rawView.encrypted_field_2 || "")} isCipher />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {!fetching && selectedRecord && !decryptedView && !rawView && (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">No encrypted fields found for this record.</p>
          </div>
        )}

        <div className="lg:hidden flex justify-center">
          <div className="gradient-teal-arrow rounded-full p-2 glow-teal">
            <ArrowRight className="w-5 h-5 text-accent-foreground rotate-90" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AegisProof;
