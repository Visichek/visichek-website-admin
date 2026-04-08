import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fluidGlassButtonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[1.15rem] border text-sm font-semibold text-slate-900 outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      intensity: {
        subtle: "border-white/40 bg-white/45 backdrop-blur-xl",
        default: "border-white/55 bg-white/58 backdrop-blur-2xl",
        strong: "border-white/70 bg-white/70 backdrop-blur-3xl",
      },
      glow: {
        true: "ring-1 ring-primary/15",
        false: "ring-1 ring-slate-300/35",
      },
      size: {
        sm: "h-9 px-4",
        default: "h-11 px-5",
        lg: "h-12 px-6 text-[0.95rem]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      intensity: "default",
      glow: false,
      size: "default",
    },
  },
);

type FluidGlassButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof fluidGlassButtonVariants>;

const FluidGlassButton = React.forwardRef<HTMLButtonElement, FluidGlassButtonProps>(
  ({ className, children, intensity, glow, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(fluidGlassButtonVariants({ intensity, glow, size }), "hover:-translate-y-0.5 active:translate-y-0", className)}
        {...props}
      >
        <span className="absolute inset-[1px] rounded-[calc(1.15rem-1px)] bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(255,255,255,0.18))]" />
        <span className="absolute inset-x-4 top-0 h-px bg-white/85" />
        <span className="absolute -left-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-white/35 blur-2xl transition-transform duration-500 group-hover:translate-x-5" />
        <span className="absolute right-0 top-0 h-full w-20 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.34),transparent)] opacity-70 translate-x-[140%] transition-transform duration-700 group-hover:translate-x-[-180%]" />
        <span className="absolute inset-[1px] rounded-[calc(1.15rem-1px)] border border-slate-200/40" />
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    );
  },
);

FluidGlassButton.displayName = "FluidGlassButton";

export { FluidGlassButton };
