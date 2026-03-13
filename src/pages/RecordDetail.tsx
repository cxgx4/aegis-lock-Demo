import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, Save, Loader2, Eye, Database, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAegis } from "@/hooks/useAegis";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecordRow {
  id: string;
  name: string;
  identifier: string;
  created_at: string;
}

const CIPHER_PLACEHOLDER = "5f3c1b9a7e2d04f8b6c3a1e5d9f2b4c8a7e1d3f5b9c2a6e8d4f0b3c7a5e9d1f6b8c0a2e4d7f1b5c9a3e6d0f4b2c8a7e5d9f3b1c6a0e2d8f4b7c3a9e1d5f0b6c2a8e4";

/** Check if any encrypted field in a row has the new iv:ciphertext format */
function hasNewFormat(row: Record<string, unknown>, fields: string[]): boolean {
  return fields.some((f) => {
    const val = row[f];
    return typeof val === "string" && val.includes(":");
  });
}

/** Check if decrypted data matches raw data (meaning decryption was skipped) */
function isDecryptionSkipped(
  decrypted: Record<string, unknown>[],
  raw: Record<string, unknown>[],
  fields: string[]
): boolean {
  if (decrypted.length === 0 || raw.length === 0) return false;
  return decrypted.every((dec, i) => {
    const rawRow = raw[i];
    if (!rawRow) return false;
    return fields.every((f) => dec[f] === rawRow[f]);
  });
}

const ENCRYPTED_FIELD_NAMES = ["encrypted_content", "encrypted_field_1", "encrypted_field_2"];

const RecordDetail = () => {
  const { id } = useParams();
  const { aegis, loading } = useAegis();
  const { toast } = useToast();

  const [record, setRecord] = useState<RecordRow | null>(null);
  const [decryptedRows, setDecryptedRows] = useState<Record<string, unknown>[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [displayText, setDisplayText] = useState("");
  const [newField, setNewField] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasLegacyData, setHasLegacyData] = useState(false);

  const animateDecrypt = (finalText: string) => {
    const cipherChars = CIPHER_PLACEHOLDER.split("");
    const finalChars = finalText.split("");
    let currentIndex = 0;

    setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex >= finalChars.length) {
          clearInterval(interval);
          setIsDecrypting(false);
          setDisplayText(finalText);
          return;
        }

        const revealed = finalText.slice(0, currentIndex);
        const remaining = cipherChars
          .slice(currentIndex % cipherChars.length, (currentIndex % cipherChars.length) + 40)
          .join("");
        setDisplayText(revealed + remaining);
        currentIndex += 3;
      }, 25);
    }, 600);
  };

  const fetchData = async () => {
    if (!aegis || !id) return;
    setIsDecrypting(true);
    setHasLegacyData(false);

    const { data: rec } = await supabase.from("records").select("*").eq("id", id).single();
    if (rec) setRecord(rec);

    const [decryptedResult, rawResult] = await Promise.all([
      aegis.select("secure_fields", { column: "record_id", value: id }),
      aegis.selectRaw("secure_fields", { column: "record_id", value: id }),
    ]);

    const decRows = (decryptedResult.data ?? []) as Record<string, unknown>[];
    const rRows = (rawResult.data ?? []) as Record<string, unknown>[];

    setDecryptedRows(decRows);
    setRawRows(rRows);

    // Detect if decryption was skipped (old format data or key mismatch)
    if (rRows.length > 0) {
      const skipped = isDecryptionSkipped(decRows, rRows, ENCRYPTED_FIELD_NAMES);
      const anyNewFormat = rRows.some((r) => hasNewFormat(r, ENCRYPTED_FIELD_NAMES));
      setHasLegacyData(skipped && !anyNewFormat);
    }

    if (decRows.length > 0) {
      const content = String(decRows[0].encrypted_content ?? "");
      animateDecrypt(content);
    } else {
      setIsDecrypting(false);
      setDisplayText("No encrypted data found for this record.");
    }
  };

  useEffect(() => {
    if (aegis && id) fetchData();
  }, [aegis, id]);

  const handleSave = async () => {
    if (!aegis || !newField.trim() || !id) return;
    setSaving(true);
    try {
      await aegis.insert("secure_fields", {
        record_id: id,
        encrypted_content: newField,
        encrypted_field_1: "Category: User Entry",
        encrypted_field_2: "Priority: Normal",
      });
      setNewField("");
      await fetchData();
      toast({ title: "Field saved", description: "Encrypted and stored successfully." });
    } catch (err) {
      toast({ title: "Save failed", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Record Detail">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Record Detail">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-border bg-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{record?.name || "Loading..."}</h2>
                  <p className="text-sm text-muted-foreground">{record?.identifier || ""}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                  <Shield className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-medium text-accent">Encrypted</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Legacy data warning */}
        {hasLegacyData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert className="border-destructive/30 bg-destructive/5">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-sm text-foreground/80">
                <strong>Legacy data detected.</strong> The existing entries were encrypted with an older API version
                (separate IV column, no contextual binding). They cannot be decrypted with the current key.
                Add a new encrypted entry below to see the full encrypt → decrypt flow with the new <code className="px-1 py-0.5 bg-muted rounded font-mono text-xs">iv:ciphertext</code> format.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Standard Fields */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Standard Fields (Unencrypted)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input value={record?.name || ""} readOnly className="bg-secondary border-border text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Identifier</Label>
                  <Input value={record?.identifier || ""} readOnly className="bg-secondary border-border text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <Input value={record ? new Date(record.created_at).toLocaleString() : ""} readOnly className="bg-secondary border-border text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Decryption animation */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-accent" />
                  Sensitive Notes
                  <span className="text-[10px] font-mono text-accent/70 bg-accent/10 px-2 py-0.5 rounded-full">ENCRYPTED FIELD</span>
                </CardTitle>
                {isDecrypting && <span className="text-[11px] text-accent animate-pulse">Decrypting...</span>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-lg gradient-cipher border border-accent/20 p-4 min-h-[100px]">
                <pre className={`text-sm whitespace-pre-wrap break-all leading-relaxed transition-all duration-300 ${
                  isDecrypting ? "font-mono text-xs text-muted-foreground/60" : "font-sans text-foreground"
                }`}>
                  {displayText}
                </pre>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Side-by-side: Plaintext vs Ciphertext */}
        {!isDecrypting && decryptedRows.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-accent/20 bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4 text-accent" />
                    Decrypted (Plaintext)
                    {hasLegacyData && (
                      <span className="text-[10px] font-mono text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">LEGACY</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {decryptedRows.map((row, i) => (
                    <div key={`dec-${i}`} className="p-3 rounded-lg bg-accent/5 border border-accent/10 space-y-1.5 overflow-hidden">
                      <p className="text-[11px] text-accent uppercase tracking-wider font-medium">Row {i + 1}</p>
                      <p className="text-xs font-medium text-foreground break-all">{String(row.encrypted_content || "")}</p>
                      <p className="text-xs text-muted-foreground break-all">{String(row.encrypted_field_1 || "")}</p>
                      <p className="text-xs text-muted-foreground/70 break-all">{String(row.encrypted_field_2 || "")}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    Raw (Ciphertext in DB)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rawRows.map((row, i) => (
                    <div key={`raw-${i}`} className="p-3 rounded-lg bg-secondary border border-border space-y-1.5 overflow-hidden">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Row {i + 1}</p>
                      <p className="font-mono text-[10px] text-muted-foreground/70 break-all leading-relaxed">{String(row.encrypted_content || "")}</p>
                      <p className="font-mono text-[10px] text-muted-foreground/50 break-all leading-relaxed">{String(row.encrypted_field_1 || "")}</p>
                      <p className="font-mono text-[10px] text-muted-foreground/40 break-all leading-relaxed">{String(row.encrypted_field_2 || "")}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Add new entry */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Add New Encrypted Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter sensitive data (will be field-level encrypted)..."
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                  className="flex-1 bg-secondary border-border text-sm"
                />
                <Button onClick={handleSave} disabled={saving || !newField.trim()} className="gap-2 text-sm shrink-0">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Encrypted
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                <Shield className="w-3 h-3 text-accent" />
                Data encrypted with contextual binding (AAD) before storage — iv:ciphertext format
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default RecordDetail;
