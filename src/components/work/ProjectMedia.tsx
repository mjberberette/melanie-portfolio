"use client";

import { useEffect, useRef, useState } from "react";

import { ProjectPoster } from "@/components/work/ProjectPoster";
import type { Project } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Resolution order for a case-study preview:
 *   1. a looping video at `project.video` (drop the file into /public/media)
 *   2. the animated monogram, for the identity project
 *   3. a generative poster
 */
export function ProjectMedia({
  project,
  variant,
  active,
  className,
}: {
  project: Project;
  variant: number;
  active: boolean;
  className?: string;
}) {
  const [videoOk, setVideoOk] = useState(Boolean(project.video));
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoOk) return;
    if (active) void video.play().catch(() => {});
    else video.pause();
  }, [active, videoOk]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {videoOk && project.video ? (
        <video
          ref={videoRef}
          src={project.video}
          poster={project.poster}
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoOk(false)}
          className="h-full w-full object-cover"
        />
      ) : project.lottie ? (
        <LottieMark active={active} accent={project.accent} />
      ) : (
        <ProjectPoster
          variant={variant}
          accent={project.accent}
          title={project.subtitle}
          index={project.index}
        />
      )}
    </div>
  );
}

function LottieMark({ active, accent }: { active: boolean; accent: string }) {
  const host = useRef<HTMLDivElement>(null);
  const anim = useRef<{
    destroy: () => void;
    play: () => void;
    goToAndPlay: (value: number, isFrame?: boolean) => void;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const lottie = (await import("lottie-web")).default;
      if (cancelled || !host.current) return;
      const instance = lottie.loadAnimation({
        container: host.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/logo/mb-monogram-alpha.json",
      });
      instance.setSpeed(1.1);
      anim.current = instance;
    })();
    return () => {
      cancelled = true;
      anim.current?.destroy();
      anim.current = null;
    };
  }, []);

  useEffect(() => {
    if (active) anim.current?.goToAndPlay(0, true);
  }, [active]);

  return (
    <div className="relative h-full w-full bg-ink-raised">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(90% 80% at 50% 40%, ${accent}22 0%, transparent 65%)`,
        }}
      />
      <div ref={host} className="absolute inset-[8%]" />
    </div>
  );
}
