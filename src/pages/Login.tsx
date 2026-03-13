import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import HandshakeAnimation from "@/components/HandshakeAnimation";

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-accent" />
              <h1 className="text-2xl font-bold text-foreground">Aegis-Lock</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Secure Data Portal — Domain-Agnostic Field-Level Encryption
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This demo showcases real <span className="text-accent font-medium">AES-256-GCM</span> encryption
              powered by the Web Crypto API. Sensitive fields are encrypted before they leave the browser — the
              database never sees plaintext.
            </p>

            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              Enter Demo
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Protected by Aegis Zero-Knowledge Encryption
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 gradient-navy relative overflow-hidden">
        <HandshakeAnimation />
      </div>
    </div>
  );
};

export default Login;
