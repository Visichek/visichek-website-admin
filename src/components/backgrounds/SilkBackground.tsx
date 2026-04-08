import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type SilkBackgroundProps = {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
  className?: string;
};

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const parsed = Number.parseInt(value, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

export default function SilkBackground({
  speed = 5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0,
  className,
}: SilkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reducedMotion = mediaQuery.matches;
    const rgb = hexToRgb(color);
    const velocity = reducedMotion ? 0.0009 : 0.0018 * speed;
    const amplitude = reducedMotion ? 0.38 : 0.55 * noiseIntensity;
    const scaled = Math.max(0.65, scale);
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let time = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(width / 2, height / 2);
      context.rotate((rotation * Math.PI) / 180);
      context.scale(scaled, scaled);
      context.translate(-width / 2, -height / 2);

      const baseGradient = context.createLinearGradient(0, 0, width, height);
      baseGradient.addColorStop(0, "rgba(249, 247, 248, 0.92)");
      baseGradient.addColorStop(0.55, "rgba(238, 235, 239, 0.8)");
      baseGradient.addColorStop(1, "rgba(224, 231, 226, 0.74)");
      context.fillStyle = baseGradient;
      context.fillRect(0, 0, width, height);

      const strands = reducedMotion ? 4 : 7;
      for (let index = 0; index < strands; index += 1) {
        const bandHeight = height / (strands + 1);
        const yBase = bandHeight * (index + 0.8);
        const thickness = 46 + index * 16;
        const alpha = 0.09 - index * 0.008;

        context.beginPath();
        context.moveTo(-60, yBase);

        for (let x = -60; x <= width + 60; x += 18) {
          const wave =
            Math.sin(x * 0.008 + time * (1.6 + index * 0.12)) * 30 * amplitude;
          const drift =
            Math.cos(x * 0.004 - time * (1.1 + index * 0.08)) * 16 * amplitude;
          context.lineTo(x, yBase + wave + drift);
        }

        context.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(alpha, 0.03)})`;
        context.lineWidth = thickness;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.stroke();
      }

      context.restore();

      const vignette = context.createRadialGradient(
        width * 0.5,
        height * 0.38,
        Math.min(width, height) * 0.14,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.72,
      );
      vignette.addColorStop(0, "rgba(255,255,255,0)");
      vignette.addColorStop(1, "rgba(245, 242, 244, 0.7)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);

      time += velocity;
      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [color, noiseIntensity, rotation, scale, speed]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_42%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.45),transparent_45%,rgba(77,122,95,0.08))]" />
    </div>
  );
}
