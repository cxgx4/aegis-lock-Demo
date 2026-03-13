import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, Database, Server, Copy, Check, ArrowRight, Shield, Key, Hash, Lock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const supabaseSetup = `import { createClient } from "@supabase/supabase-js";
import {
  AegisClient,
  SupabaseAdapter,
  generateKey,
  generateBidxKey,
  exportKey
} from "aegis-lock";

// 1. Create Supabase client
const supabase = createClient(URL, ANON_KEY);

// 2. Wrap it in a SupabaseAdapter
const adapter = new SupabaseAdapter(supabase);

// 3. Generate encryption key + blind index key
const key = await generateKey();
const bidxKey = await generateBidxKey();

// 4. Create Aegis client with config
const aegis = new AegisClient({
  adapter,
  primaryKeyField: "record_id",
  encryptedFields: {
    secure_fields: ["encrypted_content", "ssn", "email"]
  },
  bidxFields: {
    secure_fields: ["email"]  // Creates 'email_bidx' column
  }
}, key, bidxKey);`;

const mongoSetup = `import { MongoClient } from "mongodb";
import {
  AegisClient,
  MongoDBAdapter,
  generateKey
} from "aegis-lock";
import { v4 as uuidv4 } from "uuid";

// 1. Connect to MongoDB
const mongo = new MongoClient(MONGO_URI);
await mongo.connect();

// 2. Wrap it in a MongoDBAdapter
const adapter = new MongoDBAdapter(mongo.db("myapp"));

// 3. Generate encryption key
const key = await generateKey();

// 4. Create Aegis client with config
const aegis = new AegisClient({
  adapter,
  primaryKeyField: "_id",
  encryptedFields: {
    users: ["ssn", "credit_card"]
  }
}, key);`;

const insertCode = `// Insert — fields are auto-encrypted before storage
// Note: You MUST provide the primary key application-side!
const { data, error } = await aegis.insert("secure_fields", {
  record_id: "uuid-1234-5678",
  email: "alice@example.com",
  encrypted_content: "Top secret notes",
  ssn: "123-45-6789",
});
// ✅ Only iv:ciphertext composites stored in database
// ✅ Blind index hash stored in email_bidx column`;

const selectCode = `// Select — Aegis auto-hashes the query for blind index search
// and auto-decrypts encrypted fields after retrieval
const { data } = await aegis.select("secure_fields", {
  column: "email",
  value: "alice@example.com",  // Aegis hashes this → searches email_bidx
});

console.log(data[0].email);
// → "alice@example.com" (plaintext restored)

console.log(data[0].ssn);
// → "123-45-6789" (plaintext restored)`;

const customAdapterCode = `import { DatabaseAdapter } from "aegis-lock";

class MyAdapter implements DatabaseAdapter {
  async insert(table: string, data: Record<string, unknown>) {
    // your insert logic
    return { data: [data], error: null };
  }
  async select(table: string, query?) {
    // your select logic
    return { data: [], error: null };
  }
}`;

const apiReferenceCode = `// Constructor
new AegisClient(config, key, bidxKey?)

// Config object
{
  adapter: DatabaseAdapter,        // SupabaseAdapter, MongoDBAdapter, or custom
  primaryKeyField: string,         // ID field for contextual binding
  encryptedFields: Record<string, string[]>,
  bidxFields?: Record<string, string[]>,  // Optional blind index fields
}

// Adapters
new SupabaseAdapter(supabaseClient)
new MongoDBAdapter(mongoDb)

// Crypto Utilities
generateKey() / generateBidxKey()
exportKey(key) / importKey(base64)`;

function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="ml-1.5 text-[11px]">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto bg-card text-[13px] leading-relaxed">
        <code className="font-mono text-foreground/90">{code}</code>
      </pre>
    </div>
  );
}

const securityFeatures = [
  {
    icon: Shield,
    title: "Web Crypto API (AES-256-GCM)",
    description: "Runs natively in any modern browser or edge runtime.",
  },
  {
    icon: Key,
    title: "Field-Level IVs",
    description: "Every encrypted field gets a unique IV stored as a composite string (iv:ciphertext) to prevent keystream reuse attacks.",
  },
  {
    icon: Lock,
    title: "Contextual Binding (AAD)",
    description: "Ciphertexts are cryptographically bound to the row's primaryKeyField. Copying encrypted data between rows causes decryption to fail.",
  },
  {
    icon: Hash,
    title: "Blind Indexing (HMAC-SHA256)",
    description: "Deterministic HMAC hashes allow exact-match searching on encrypted fields without exposing plaintext to the database.",
  },
];

export default function CodeShowcase() {
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="w-6 h-6 text-accent" />
            <h1 className="text-2xl font-bold text-foreground">Code Showcase</h1>
          </div>
          <p className="text-muted-foreground">
            Side-by-side examples showing aegis-lock with different database adapters. Same API, any database.
          </p>
        </motion.div>

        {/* Setup — Supabase vs MongoDB */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">1. Setup & Initialization</CardTitle>
                <Badge variant="outline" className="text-accent border-accent/30">Database-Agnostic</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Swap <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">SupabaseAdapter</code> for{" "}
                <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">MongoDBAdapter</code> — everything else stays identical.
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="supabase">
                <TabsList className="mb-4">
                  <TabsTrigger value="supabase" className="gap-2">
                    <Database className="w-3.5 h-3.5" /> Supabase
                  </TabsTrigger>
                  <TabsTrigger value="mongodb" className="gap-2">
                    <Server className="w-3.5 h-3.5" /> MongoDB
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="supabase">
                  <CodeBlock code={supabaseSetup} />
                </TabsContent>
                <TabsContent value="mongodb">
                  <CodeBlock code={mongoSetup} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Insert & Select */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">2. Encrypt & Decrypt</CardTitle>
                <Badge variant="outline" className="text-accent border-accent/30">Identical API</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                These calls work the same regardless of which adapter you use. Blind index search is automatic.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">Insert (auto-encrypt + blind index)</span>
                </div>
                <CodeBlock code={insertCode} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">Select (blind index search + auto-decrypt)</span>
                </div>
                <CodeBlock code={selectCode} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Custom Adapter */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">3. Custom Adapter</CardTitle>
                <Badge variant="outline" className="text-accent border-accent/30">Extensible</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Implement the <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">DatabaseAdapter</code> interface for any database.
              </p>
            </CardHeader>
            <CardContent>
              <CodeBlock code={customAdapterCode} />
            </CardContent>
          </Card>
        </motion.div>

        {/* How It Works — Security Architecture */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">4. How It Works</CardTitle>
                <Badge variant="outline" className="text-accent border-accent/30">Security Architecture</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {securityFeatures.map((feature) => (
                  <div key={feature.title} className="flex gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <feature.icon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{feature.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* API Reference */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">5. API Reference</CardTitle>
                <Badge variant="outline" className="text-accent border-accent/30">Quick Reference</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Constructor signature, adapters, and crypto utilities at a glance.
              </p>
            </CardHeader>
            <CardContent>
              <CodeBlock code={apiReferenceCode} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
