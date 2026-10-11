import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 52;
const BOT_FRAMES: string[] = Array.from({ length: FRAME_COUNT }, (_, i) => {
  const pad = String(i + 1).padStart(3, "0");
  return `/bot-frames/ezgif-frame-${pad}.webp`;
});

export function BotExplorer({ countryId }: { countryId: string }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const animRef = useRef<number | null>(null);
  const framesReadyRef = useRef(false);
  const preloadedFramesRef = useRef<HTMLImageElement[]>([]);

  // Keep decoded frames alive before playback so source changes cannot flash.
  useEffect(() => {
    let cancelled = false;
    const frames = BOT_FRAMES.map(() => new Image());

    preloadedFramesRef.current = frames;
    Promise.all(
      frames.map(
        (img, index) =>
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
            img.src = BOT_FRAMES[index];

            if (img.complete) {
              resolve();
            }
          }),
      ),
    ).then(() => {
      if (!cancelled) {
        framesReadyRef.current = true;
      }
    });

    return () => {
      cancelled = true;
      framesReadyRef.current = false;
      preloadedFramesRef.current = [];
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const playTwoLoops = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
      animRef.current = null;
      setFrameIndex(0);
      return;
    }
    if (!framesReadyRef.current) {
      setFrameIndex(0);
      return;
    }

    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    const totalSteps = FRAME_COUNT * 2; // 104 frames for 2 full loops
    const frameInterval = 32; // ~31 fps for smooth cartoon pacing
    const startTime = performance.now();

    const tick = (now: number) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setFrameIndex(0);
        animRef.current = null;
        return;
      }
      const elapsed = now - startTime;
      const step = Math.floor(elapsed / frameInterval);

      if (step < totalSteps) {
        setFrameIndex(step % FRAME_COUNT);
        animRef.current = requestAnimationFrame(tick);
      } else {
        // When 2 loops finish, remain static on frame 1
        setFrameIndex(0);
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(tick);
  };

  // Destination navigation is frequent: keep it static and cancel any flourish.
  useEffect(() => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    animRef.current = null;
    setFrameIndex(0);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [countryId]);

  return (
    <div
      className="bot-explorer"
      aria-hidden="true"
      onPointerDown={(event) => {
        // A decorative Easter egg, not a keyboard stop or navigation response.
        if (event.isPrimary && event.button === 0) playTwoLoops();
      }}
    >
      <img
        src={BOT_FRAMES[frameIndex]}
        alt=""
        className="bot-explorer-img"
        draggable={false}
      />
    </div>
  );
}
