"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Pointer-drawn signature. Reports a trimmed PNG data URL (or null when
 *  empty) through onChange. Works with mouse, touch, and pen. */
export function SignaturePad({ onChange, disabled }: { onChange: (png: string | null) => void; disabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  const setup = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = c.getBoundingClientRect();
    // Preserve strokes across resizes by re-drawing the old bitmap.
    const prev = document.createElement("canvas");
    prev.width = c.width;
    prev.height = c.height;
    prev.getContext("2d")?.drawImage(c, 0, 0);
    c.width = Math.round(rect.width * dpr);
    c.height = Math.round(rect.height * dpr);
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#f1ede5";
    if (prev.width && prev.height) ctx.drawImage(prev, 0, 0, prev.width / dpr, prev.height / dpr);
  }, []);

  useEffect(() => {
    setup();
    const ro = new ResizeObserver(setup);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [setup]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const exportPng = () => {
    const c = canvasRef.current;
    if (!c) return null;
    const ctx = c.getContext("2d")!;
    const { width, height } = c;
    const data = ctx.getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null;
    const pad = 12;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const octx = out.getContext("2d")!;
    // Signatures print in ink on a light page, so export dark strokes.
    octx.drawImage(c, minX - pad, minY - pad, w, h, 0, 0, w, h);
    octx.globalCompositeOperation = "source-in";
    octx.fillStyle = "#101013";
    octx.fillRect(0, 0, w, h);
    return out.toDataURL("image/png");
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
    const ctx = e.currentTarget.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = "#f1ede5";
    ctx.fill();
    setEmpty(false);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const p = point(e);
    const ctx = e.currentTarget.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    onChange(exportPng());
  };
  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Signature drawing area. Draw your signature with your finger, pen, or mouse."
          className="h-40 w-full touch-none rounded-inner border border-input bg-ink"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
        />
        <span className="pointer-events-none absolute inset-x-6 bottom-9 border-b border-dashed border-bone/20" aria-hidden />
        {empty && (
          <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-mono text-[0.625rem] tracking-[0.14em] uppercase text-bone-faint">
            Sign above the line
          </span>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={empty || disabled} className="text-bone-dim">
          <Eraser className="size-3.5" aria-hidden /> Clear
        </Button>
      </div>
    </div>
  );
}
