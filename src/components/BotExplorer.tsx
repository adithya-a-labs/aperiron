import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 52;
const BOT_FRAMES: string[] = Array.from({ length: FRAME_COUNT }, (_, i) => {
  const pad = String(i + 1).padStart(3, "0");
  return `/bot-frames/ezgif-frame-${pad}.webp`;
});

export function BotExplorer({
  countryId,
  countryName,
  open,
  onOpen,
}: {
  countryId: string;
  countryName: string;
  open: boolean;
  onOpen: () => void;
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const animRef = useRef<number | null>(null);
  const framesReadyRef = useRef(false);
  const preloadedFramesRef = useRef<HTMLImageElement[]>([]);
  const previousCountryIdRef = useRef(countryId);
  const pendingCountryJumpRef = useRef(false);

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
        if (pendingCountryJumpRef.current) {
          pendingCountryJumpRef.current = false;
          playTwoLoops();
        }
      }
    });

    return () => {
      cancelled = true;
      framesReadyRef.current = false;
      preloadedFramesRef.current = [];
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  function playTwoLoops() {
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
  }

  // Replay the existing flourish when a new map destination is selected.
  useEffect(() => {
    if (previousCountryIdRef.current === countryId) return;
    previousCountryIdRef.current = countryId;

    if (!framesReadyRef.current) {
      pendingCountryJumpRef.current = true;
      return;
    }

    playTwoLoops();

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [countryId]);

  return (
    <button
      type="button"
      className="bot-explorer"
      aria-label={`Ask aperiron about ${countryName}`}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => {
        playTwoLoops();
        onOpen();
      }}
    >
      <img
        src={BOT_FRAMES[frameIndex]}
        alt=""
        className="bot-explorer-img"
        draggable={false}
      />
      <span className="bot-explorer-label" aria-hidden="true">Ask me</span>
      <span className="sr-only">Ask aperiron about {countryName}</span>
    </button>
  );
}
