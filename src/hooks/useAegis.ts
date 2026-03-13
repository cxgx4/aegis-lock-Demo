import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AegisClient, SupabaseAdapter, generateKey, exportKey, importKey } from "aegis-lock";

const STORAGE_KEY = "aegis-demo-key";

const ENCRYPTED_FIELDS: Record<string, string[]> = {
  secure_fields: ["encrypted_content", "encrypted_field_1", "encrypted_field_2"],
};

export function useAegis() {
  const [client, setClient] = useState<AegisClient | null>(null);
  const [loading, setLoading] = useState(true);

  const init = useCallback(async () => {
    setLoading(true);
    try {
      let key: CryptoKey;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        key = await importKey(stored);
      } else {
        key = await generateKey();
        const exported = await exportKey(key);
        localStorage.setItem(STORAGE_KEY, exported);
      }
      const adapter = new SupabaseAdapter(supabase);
      setClient(new AegisClient({
        adapter,
        primaryKeyField: "record_id",
        encryptedFields: ENCRYPTED_FIELDS,
      }, key));
    } catch (err) {
      console.error("Aegis init failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return { aegis: client, loading, reinit: init };
}
