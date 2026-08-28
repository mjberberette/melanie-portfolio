"use client";

import { Monogram } from "@/components/brand/Monogram";
import { cn } from "@/lib/utils";

/**
 * Abstract, generative covers for each case study. They read as design
 * artefacts rather than fake screenshots — swap any of them for real
 * imagery or a looping video by adding `video` to the project entry.
 */
export function ProjectPoster({
  variant,
  accent,
  title,
  index,
  className,
}: {
  variant: number;
  accent: string;
  title: string;
  index: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-ink-raised",
        className,
      )}
      style={
        {
          "--accent": accent,
        } as React.CSSProperties
      }
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(120% 90% at 78% 12%, ${accent}33 0%, transparent 62%), radial-gradient(80% 70% at 12% 96%, ${accent}1f 0%, transparent 60%)`,
        }}
      />

      <svg
        viewBox="0 0 640 400"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id={`stroke-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.15" />
          </linearGradient>
          <pattern
            id={`grid-${index}`}
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M32 0H0v32"
              fill="none"
              stroke="rgba(241,237,229,0.06)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="640" height="400" fill={`url(#grid-${index})`} />

        {variant === 0 ? <IdentityArt index={index} /> : null}
        {variant === 1 ? <DashboardArt index={index} accent={accent} /> : null}
        {variant === 2 ? <EditorArt index={index} accent={accent} /> : null}
        {variant === 3 ? <CommerceArt index={index} accent={accent} /> : null}
        {variant === 4 ? <FlowArt index={index} accent={accent} /> : null}
      </svg>

      {variant === 0 ? (
        <Monogram className="absolute top-1/2 left-1/2 h-[46%] w-auto -translate-x-1/2 -translate-y-1/2 text-bone/90" />
      ) : null}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
        <span className="font-mono text-[10px] tracking-[0.2em] text-bone/70 uppercase">
          {title}
        </span>
        <span className="font-display text-[11px] tracking-[0.18em] text-bone/40 uppercase">
          {index}
        </span>
      </div>
    </div>
  );
}

function DashboardArt({ index, accent }: { index: string; accent: string }) {
  const bars = [46, 88, 62, 120, 74, 138, 96, 158];
  return (
    <g>
      <rect
        x="48"
        y="52"
        width="544"
        height="240"
        rx="6"
        fill="rgba(241,237,229,0.03)"
        stroke="rgba(241,237,229,0.12)"
      />
      <rect x="48" y="52" width="544" height="34" fill="rgba(241,237,229,0.05)" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={70 + i * 14} cy={69} r="3.5" fill="rgba(241,237,229,0.25)" />
      ))}
      {bars.map((height, i) => (
        <rect
          key={i}
          x={78 + i * 62}
          y={264 - height}
          width="26"
          height={height}
          rx="3"
          fill={i === 5 ? accent : "rgba(241,237,229,0.18)"}
        />
      ))}
      <path
        d={`M78 ${264 - 46} ${bars
          .map((h, i) => `L${91 + i * 62} ${264 - h - 16}`)
          .join(" ")}`}
        fill="none"
        stroke={`url(#stroke-${index})`}
        strokeWidth="2"
      />
    </g>
  );
}

function EditorArt({ index, accent }: { index: string; accent: string }) {
  return (
    <g>
      <rect
        x="40"
        y="44"
        width="230"
        height="256"
        rx="6"
        fill="rgba(241,237,229,0.04)"
        stroke="rgba(241,237,229,0.1)"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x="60"
          y={72 + i * 32}
          width={i === 2 ? 150 : 118 + ((i * 37) % 70)}
          height="8"
          rx="4"
          fill={i === 2 ? accent : "rgba(241,237,229,0.16)"}
        />
      ))}
      <rect
        x="300"
        y="44"
        width="300"
        height="256"
        rx="6"
        fill="rgba(241,237,229,0.02)"
        stroke="rgba(241,237,229,0.1)"
      />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect
          key={i}
          x="324"
          y={74 + i * 26}
          width={i % 3 === 0 ? 250 : 190 + ((i * 23) % 60)}
          height="6"
          rx="3"
          fill="rgba(241,237,229,0.12)"
        />
      ))}
      <rect x="324" y="74" width="60" height="6" rx="3" fill={accent} />
      <path
        d="M300 44v256"
        stroke={`url(#stroke-${index})`}
        strokeWidth="1.5"
      />
    </g>
  );
}

function CommerceArt({ index, accent }: { index: string; accent: string }) {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect
            x={62 + i * 178}
            y={54}
            width="150"
            height="196"
            rx="6"
            fill="rgba(241,237,229,0.04)"
            stroke="rgba(241,237,229,0.1)"
          />
          <circle
            cx={137 + i * 178}
            cy={132}
            r={i === 1 ? 46 : 38}
            fill={i === 1 ? `${accent}44` : "rgba(241,237,229,0.06)"}
            stroke={i === 1 ? accent : "rgba(241,237,229,0.14)"}
          />
          <rect
            x={82 + i * 178}
            y={210}
            width={i === 1 ? 92 : 66}
            height="7"
            rx="3.5"
            fill="rgba(241,237,229,0.2)"
          />
          <rect
            x={82 + i * 178}
            y={226}
            width="40"
            height="6"
            rx="3"
            fill="rgba(241,237,229,0.12)"
          />
        </g>
      ))}
      <path
        d="M62 292h516"
        stroke={`url(#stroke-${index})`}
        strokeWidth="1.5"
        strokeDasharray="6 8"
      />
    </g>
  );
}

function FlowArt({ index, accent }: { index: string; accent: string }) {
  const nodes = [
    { x: 92, y: 96 },
    { x: 262, y: 62 },
    { x: 262, y: 176 },
    { x: 432, y: 118 },
    { x: 556, y: 232 },
  ];
  return (
    <g>
      <path
        d="M92 96 L262 62 M92 96 L262 176 M262 62 L432 118 M262 176 L432 118 M432 118 L556 232"
        stroke={`url(#stroke-${index})`}
        strokeWidth="1.6"
        fill="none"
      />
      {nodes.map((node, i) => (
        <g key={i}>
          <rect
            x={node.x - 46}
            y={node.y - 22}
            width="92"
            height="44"
            rx="8"
            fill={i === 3 ? `${accent}33` : "rgba(241,237,229,0.05)"}
            stroke={i === 3 ? accent : "rgba(241,237,229,0.14)"}
          />
          <rect
            x={node.x - 30}
            y={node.y - 5}
            width={i === 3 ? 44 : 34}
            height="6"
            rx="3"
            fill="rgba(241,237,229,0.25)"
          />
        </g>
      ))}
    </g>
  );
}

function IdentityArt({ index }: { index: string }) {
  return (
    <g>
      <circle
        cx="320"
        cy="180"
        r="132"
        fill="none"
        stroke={`url(#stroke-${index})`}
        strokeWidth="1.4"
      />
      <circle
        cx="320"
        cy="180"
        r="176"
        fill="none"
        stroke="rgba(241,237,229,0.07)"
        strokeWidth="1"
        strokeDasharray="4 10"
      />
      <path
        d="M320 4v352M144 180h352"
        stroke="rgba(241,237,229,0.06)"
        strokeWidth="1"
      />
    </g>
  );
}
