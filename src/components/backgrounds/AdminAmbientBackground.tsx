import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type AdminAmbientBackgroundProps = {
  variant?: "dashboard" | "media";
  className?: string;
};

const variantMap = {
  dashboard: {
    orbOne: "bg-[radial-gradient(circle,rgba(47,111,74,0.18),rgba(47,111,74,0)_72%)]",
    orbTwo: "bg-[radial-gradient(circle,rgba(94,107,122,0.16),rgba(94,107,122,0)_74%)]",
    orbThree: "bg-[radial-gradient(circle,rgba(255,255,255,0.72),rgba(255,255,255,0)_65%)]",
  },
  media: {
    orbOne: "bg-[radial-gradient(circle,rgba(54,120,86,0.16),rgba(54,120,86,0)_74%)]",
    orbTwo: "bg-[radial-gradient(circle,rgba(113,129,148,0.14),rgba(113,129,148,0)_75%)]",
    orbThree: "bg-[radial-gradient(circle,rgba(255,255,255,0.62),rgba(255,255,255,0)_68%)]",
  },
} as const;

export default function AdminAmbientBackground({
  variant = "dashboard",
  className,
}: AdminAmbientBackgroundProps) {
  const reduceMotion = useReducedMotion();
  const palette = variantMap[variant];

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#f7faf7_0%,#f2f5f2_38%,#eef2ef_100%)]",
        className,
      )}
      aria-hidden="true"
    >
      <motion.div
        className={cn("absolute -left-[12%] top-[-4rem] h-[22rem] w-[22rem] rounded-full blur-3xl", palette.orbOne)}
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 32, -10, 0], y: [0, 24, 10, 0], scale: [1, 1.04, 0.98, 1] }
        }
        transition={{ duration: 24, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className={cn("absolute right-[-8%] top-[10rem] h-[20rem] w-[20rem] rounded-full blur-3xl", palette.orbTwo)}
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -28, 8, 0], y: [0, -18, 6, 0], scale: [1, 0.96, 1.02, 1] }
        }
        transition={{ duration: 28, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className={cn("absolute bottom-[-9rem] left-[24%] h-[18rem] w-[18rem] rounded-full blur-3xl", palette.orbThree)}
        animate={reduceMotion ? undefined : { x: [0, 10, -12, 0], opacity: [0.45, 0.58, 0.4, 0.45] }}
        transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.32)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.32)_1px,transparent_1px)] [background-size:140px_140px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.56),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.38),rgba(255,255,255,0))]" />
    </div>
  );
}
