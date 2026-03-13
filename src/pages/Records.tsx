import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Clock, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAegis } from "@/hooks/useAegis";
import { supabase } from "@/integrations/supabase/client";
import CreateRecordDialog from "@/components/CreateRecordDialog";

interface RecordRow {
  id: string;
  name: string;
  identifier: string;
  created_at: string;
}

const Records = () => {
  const navigate = useNavigate();
  const { aegis, loading } = useAegis();
  const [records, setRecords] = useState<RecordRow[]>([]);

  const fetchRecords = async () => {
    const { data } = await supabase.from("records").select("*").order("created_at", { ascending: false });
    if (data) setRecords(data);
  };

  useEffect(() => {
    if (!aegis) return;
    fetchRecords();
  }, [aegis]);

  if (loading) {
    return (
      <DashboardLayout title="Records">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Records">
      <div className="max-w-4xl mx-auto space-y-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground">All Records</CardTitle>
                {aegis && <CreateRecordDialog aegis={aegis} onCreated={fetchRecords} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {records.map((record) => (
                <button
                  key={record.id}
                  onClick={() => navigate(`/records/${record.id}`)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-md hover:bg-secondary transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{record.name}</p>
                    <p className="text-xs text-muted-foreground">{record.identifier}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10">
                      <Shield className="w-3 h-3 text-accent" />
                      <span className="text-[10px] text-accent font-medium">Encrypted</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(record.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
              {records.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">No records yet. Click "New Record" to create one.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Records;
