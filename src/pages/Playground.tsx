
//import * as AegisLock from "aegis-lock";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Lock, Unlock, Eye, EyeOff, RefreshCw, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateKey, exportKey, importKey } from "aegis-lock";
import { encrypt, decrypt } from "aegis-lock/dist/crypto";

type Step = "idle" | "encrypting" | "encrypted" | "decrypting" | "decrypted";

export default function Playground() {
  const [plaintext, setPlaintext] = useState("SSN: 123-45-6789");
  const [field2, setField2] = useState("Credit Card: 4111-1111-1111-1111");
  const [field3, setField3] = useState("Medical: Annual checkup — all clear");

  const [ciphertext1, setCiphertext1] = useState("");
  const [ciphertext2, setCiphertext2] = useState("");
  const [ciphertext3, setCiphertext3] = useState("");
  const [iv1, setIv1] = useState("");
  const [iv2, setIv2] = useState("");
  const [iv3, setIv3] = useState("");
  const [keyBase64, setKeyBase64] = useState("");

  const [decrypted1, setDecrypted1] = useState("");
  const [decrypted2, setDecrypted2] = useState("");
  const [decrypted3, setDecrypted3] = useState("");

  const [step, setStep] = useState<Step>("idle");
  const [adapter, setAdapter] = useState<"supabase" | "mongodb">("supabase");

  // Manual decrypt state
  const [manualCiphertext, setManualCiphertext] = useState("");
  const [manualIv, setManualIv] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [manualResult, setManualResult] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualDecrypting, setManualDecrypting] = useState(false);

  const handleEncrypt = useCallback(async () => {
    setStep("encrypting");
    try {
      const key = await generateKey();
      const exported = await exportKey(key);
      setKeyBase64(exported);

      const aadContext = "playground-demo";

      const r1 = await encrypt(plaintext, key, aadContext);
      const r2 = await encrypt(field2, key, aadContext);
      const r3 = await encrypt(field3, key, aadContext);

      setCiphertext1(r1.ciphertext);
      setCiphertext2(r2.ciphertext);
      setCiphertext3(r3.ciphertext);
      setIv1(r1.iv);
      setIv2(r2.iv);
      setIv3(r3.iv);

      setDecrypted1("");
      setDecrypted2("");
      setDecrypted3("");
      setStep("encrypted");
    } catch (e) {
      console.error(e);
      setStep("idle");
    }
  }, [plaintext, field2, field3]);

  const handleDecrypt = useCallback(async () => {
    if (!keyBase64) return;
    setStep("decrypting");
    try {
      const key = await importKey(keyBase64);
      const aadContext = "playground-demo";
      const d1 = await decrypt({ ciphertext: ciphertext1, iv: iv1 }, key, aadContext);
      const d2 = await decrypt({ ciphertext: ciphertext2, iv: iv2 }, key, aadContext);
      const d3 = await decrypt({ ciphertext: ciphertext3, iv: iv3 }, key, aadContext);

      setDecrypted1(d1);
      setDecrypted2(d2);
      setDecrypted3(d3);
      setStep("decrypted");
    } catch (e) {
      console.error(e);
      setStep("encrypted");
    }
  }, [keyBase64, iv1, iv2, iv3, ciphertext1, ciphertext2, ciphertext3]);

  const handleReset = () => {
    setStep("idle");
    setCiphertext1("");
    setCiphertext2("");
    setCiphertext3("");
    setIv1("");
    setIv2("");
    setIv3("");
    setKeyBase64("");
    setDecrypted1("");
    setDecrypted2("");
    setDecrypted3("");
  };

  const handleManualDecrypt = useCallback(async () => {
    setManualDecrypting(true);
    setManualError("");
    setManualResult("");
    try {
      const keyToUse = manualKey || keyBase64;
      if (!keyToUse) {
        setManualError("No key available. Encrypt something first or paste a key.");
        return;
      }
      const key = await importKey(keyToUse);
      const ivToUse = manualIv;
      const result = await decrypt({ ciphertext: manualCiphertext, iv: ivToUse }, key, "playground-demo");
      setManualResult(result);
    } catch {
      setManualError("Decryption failed — wrong key, IV, or corrupted ciphertext.");
    } finally {
      setManualDecrypting(false);
    }
  }, [manualCiphertext, manualIv, manualKey, keyBase64]);
  const isProcessing = step === "encrypting" || step === "decrypting";



  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Play className="w-6 h-6 text-accent" />
            <h1 className="text-2xl font-bold text-foreground">Interactive Playground</h1>
          </div>
          <p className="text-muted-foreground">
            Type sensitive data, encrypt it with AES-256-GCM, then decrypt it back — live in your browser.
          </p>
        </motion.div>

        {/* Adapter Toggle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Simulating adapter:</span>
            <Tabs value={adapter} onValueChange={(v) => setAdapter(v as "supabase" | "mongodb")}>
              <TabsList>
                <TabsTrigger value="supabase">Supabase</TabsTrigger>
                <TabsTrigger value="mongodb">MongoDB</TabsTrigger>
              </TabsList>
            </Tabs>
            <Badge variant="outline" className="text-[11px] text-muted-foreground">
              Same encryption — different storage target
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Input */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-destructive" />
                  <CardTitle className="text-sm">Plaintext (Sensitive)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Field 1</Label>
                  <Input
                    value={plaintext}
                    onChange={(e) => setPlaintext(e.target.value)}
                    disabled={step !== "idle"}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Field 2</Label>
                  <Input
                    value={field2}
                    onChange={(e) => setField2(e.target.value)}
                    disabled={step !== "idle"}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Field 3</Label>
                  <Input
                    value={field3}
                    onChange={(e) => setField3(e.target.value)}
                    disabled={step !== "idle"}
                    className="font-mono text-sm"
                  />
                </div>
                <Button
                  onClick={handleEncrypt}
                  disabled={isProcessing || step !== "idle" || !plaintext}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {step === "encrypting" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  Encrypt Fields
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ciphertext / What's stored */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full border-accent/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-accent" />
                  <CardTitle className="text-sm">
                    Stored in {adapter === "supabase" ? "Supabase" : "MongoDB"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Field 1", "Field 2", "Field 3"].map((label, i) => {
                  const ct = [ciphertext1, ciphertext2, ciphertext3][i];
                  const fieldIv = [iv1, iv2, iv3][i];
                  return (
                    <div key={label}>
                      <Label className="text-xs text-muted-foreground">{label} (iv:ciphertext)</Label>
                      <Textarea
                        value={ct ? `${fieldIv}:${ct}` : "—"}
                        readOnly
                        className="font-mono text-[11px] h-16 resize-none bg-muted/30 text-muted-foreground"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* Decrypted */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-accent" />
                  <CardTitle className="text-sm">Decrypted (Client-Side)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Field 1", "Field 2", "Field 3"].map((label, i) => {
                  const d = [decrypted1, decrypted2, decrypted3][i];
                  return (
                    <div key={label}>
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <Input
                        value={d || "—"}
                        readOnly
                        className={`font-mono text-sm ${d ? "text-accent font-medium" : "text-muted-foreground"}`}
                      />
                    </div>
                  );
                })}
                <div className="flex gap-2">
                  <Button
                    onClick={handleDecrypt}
                    disabled={isProcessing || step !== "encrypted"}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {step === "decrypting" ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Unlock className="w-4 h-4 mr-2" />
                    )}
                    Decrypt
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isProcessing || step === "idle"}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Key info */}
        {keyBase64 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-dashed">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">AES-256-GCM</Badge>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Encryption key (base64) — generated fresh each run:</p>
                    <p className="font-mono text-[11px] text-foreground/70 break-all">{keyBase64}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Manual Decrypt Tool */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-accent" />
                <CardTitle className="text-base">Decrypt Any Ciphertext</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste a ciphertext + IV + key to decrypt it. Uses the current session key by default.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Ciphertext (base64)</Label>
                    <Textarea
                      value={manualCiphertext}
                      onChange={(e) => setManualCiphertext(e.target.value)}
                      placeholder="Paste base64 ciphertext here…"
                      className="font-mono text-[11px] h-20 resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">IV (base64)</Label>
                    <Input
                      value={manualIv}
                      onChange={(e) => setManualIv(e.target.value)}
                      placeholder={iv1 || "Paste IV here…"}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Key (base64) — leave empty to use session key</Label>
                    <Input
                      value={manualKey}
                      onChange={(e) => setManualKey(e.target.value)}
                      placeholder={keyBase64 ? "Using current session key" : "Paste key here…"}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleManualDecrypt}
                    disabled={manualDecrypting || !manualCiphertext || !manualIv}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {manualDecrypting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Unlock className="w-4 h-4 mr-2" />
                    )}
                    Decrypt Ciphertext
                  </Button>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Decrypted Output</Label>
                  <div className="mt-1 rounded-md border border-input bg-muted/30 p-4 min-h-[160px] flex items-center justify-center">
                    {manualError ? (
                      <p className="text-sm text-destructive font-medium text-center">{manualError}</p>
                    ) : manualResult ? (
                      <p className="font-mono text-sm text-accent font-medium break-all">{manualResult}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Decrypted plaintext will appear here</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
