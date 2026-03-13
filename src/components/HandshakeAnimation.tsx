import { motion } from "framer-motion";
import { Shield, Key, Server, Monitor } from "lucide-react";

const HandshakeAnimation = () => {
  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-8 px-8">
      {/* Title */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-medium tracking-[0.2em] uppercase text-teal-glow/80"
      >
        RSA Public Key Handshake
      </motion.p>

      {/* Nodes */}
      <div className="flex items-center justify-between w-full max-w-md gap-4">
        {/* Client */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-16 h-16 rounded-xl bg-sidebar-accent flex items-center justify-center border border-sidebar-border">
            <Monitor className="w-7 h-7 text-teal" />
          </div>
          <span className="text-xs font-medium text-sidebar-foreground/70">Client</span>
        </motion.div>

        {/* Animated key transfer */}
        <div className="flex-1 relative h-12 flex items-center">
          {/* Connection line */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-sidebar-border" />

          {/* Key packet going right (request) */}
          <motion.div
            className="absolute left-0"
            animate={{
              x: [0, 180],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut",
            }}
          >
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-sidebar-accent border border-teal/30">
              <span className="text-[9px] font-mono text-teal">REQ</span>
            </div>
          </motion.div>

          {/* Key packet going left (response) */}
          <motion.div
            className="absolute right-0"
            animate={{
              x: [0, -180],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 1,
              delay: 1.5,
              ease: "easeInOut",
            }}
          >
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-teal/20 border border-teal/40">
              <Key className="w-3 h-3 text-teal-glow" />
              <span className="text-[9px] font-mono text-teal-glow">PUB_KEY</span>
            </div>
          </motion.div>
        </div>

        {/* Server */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-16 h-16 rounded-xl bg-sidebar-accent flex items-center justify-center border border-sidebar-border">
            <Server className="w-7 h-7 text-teal" />
          </div>
          <span className="text-xs font-medium text-sidebar-foreground/70">Server</span>
        </motion.div>
      </div>

      {/* Status text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex items-center gap-2 text-sidebar-foreground/60"
      >
        <Shield className="w-4 h-4 text-teal" />
        <span className="text-sm font-medium">Establishing Secure, Zero-Knowledge Connection...</span>
      </motion.div>

      {/* Cipher rain background effect */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.04] pointer-events-none">
        <div className="font-mono text-[10px] leading-4 text-teal-glow whitespace-pre animate-cipher-scroll">
          {Array.from({ length: 40 }, (_, i) =>
            Array.from({ length: 60 }, () =>
              "0123456789abcdef"[Math.floor(Math.random() * 16)]
            ).join("")
          ).join("\n")}
        </div>
      </div>
    </div>
  );
};

export default HandshakeAnimation;
