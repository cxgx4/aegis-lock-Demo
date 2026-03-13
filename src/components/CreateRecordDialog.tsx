import { useState } from "react";
import { Plus, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AegisClient } from "aegis-lock";

interface CreateRecordDialogProps {
  aegis: AegisClient;
  onCreated?: () => void;
  trigger?: React.ReactNode;
}

const generateIdentifier = () =>
  `REC-${Math.floor(10000 + Math.random() * 90000)}`;

export default function CreateRecordDialog({ aegis, onCreated, trigger }: CreateRecordDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("Normal");

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const finalIdentifier = identifier.trim() || generateIdentifier();

      const { data: record, error } = await supabase
        .from("records")
        .insert({ name: name.trim(), identifier: finalIdentifier })
        .select()
        .single();

      if (error || !record) throw error || new Error("Failed to create record");

      await aegis.insert("secure_fields", {
        record_id: record.id,
        encrypted_content: content,
        encrypted_field_1: category.trim() ? `Category: ${category}` : "Category: General",
        encrypted_field_2: `Priority: ${priority}`,
      });

      toast({ title: "Record created", description: `${name} — encrypted and stored.` });
      setName("");
      setIdentifier("");
      setContent("");
      setCategory("");
      setPriority("Normal");
      setOpen(false);
      onCreated?.();
    } catch (err) {
      toast({ title: "Create failed", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            New Record
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Record</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Doe" className="bg-secondary border-border text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Identifier</Label>
              <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Auto-generated" className="bg-secondary border-border text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sensitive Content *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="This content will be field-level encrypted..."
              className="min-h-[100px] bg-secondary border-border resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. HR, Finance" className="bg-secondary border-border text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-secondary border-border text-sm">
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

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Shield className="w-3 h-3 text-accent" />
              Encrypted with AES-256-GCM
            </p>
            <Button onClick={handleSubmit} disabled={saving || !name.trim() || !content.trim()} className="gap-1.5 text-xs">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create Record
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
