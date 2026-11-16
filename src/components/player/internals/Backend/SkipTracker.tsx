import { useCallback, useEffect, useRef } from "react";

import { useSkipTracking } from "@/components/player/hooks/useSkipTracking";
import { usePlayerStore } from "@/stores/player/store";
import { getTurnstileToken } from "@/utils/hosting/turnstile";

const FED_SKIPS_BASE_URL = "";
const SKIP_TURNSTILE_SITE_KEY = "0x4AAAAAAB6ocCCpurfWRZyC";

// Import SkipEvent type
type SkipEvent = NonNullable<ReturnType<typeof useSkipTracking>["latestSkip"]>;

/**
 * Component that tracks and reports completed skip sessions to analytics backend.
 * Sessions are detected when users accumulate 20+ seconds of forward movement
 * within a 6-second window and end after 5 seconds of no activity.
 * Ignores skips that start after 20% of video duration (unlikely to be intro skipping).
 */
interface PendingSkip {
  skip: SkipEvent;
  originalConfidence: number;
  startTime: number;
  endTime: number;
  hasBackwardMovement: boolean;
  timer: ReturnType<typeof setTimeout>;
}

export function SkipTracker() {
  const { latestSkip } = useSkipTracking(20);
  const lastLoggedSkipRef = useRef<number>(0);
  const pendingSkipsRef = useRef(new Map<number, PendingSkip>());
  const lastPlayerTimeRef = useRef<number>(0);

  // Player metadata for context
  const meta = usePlayerStore((s) => s.meta);
  const progress = usePlayerStore((s) => s.progress);

  const sendSkipAnalytics = useCallback(
    async (skip: SkipEvent, adjustedConfidence: number) => {
      try {
        if (
          meta?.type !== "show" ||
          !meta.tmdbId ||
          meta.season?.number == null ||
          meta.episode?.number == null
        ) {
          return;
        }
        const turnstileToken = await getTurnstileToken(
          SKIP_TURNSTILE_SITE_KEY,
        );
        if (!turnstileToken) throw new Error("Turnstile token unavailable");
        const baseUrl = FED_SKIPS_BASE_URL.replace(/\/$/, "");
        await fetch(`${baseUrl}/skips/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cf-Turnstile-Response": turnstileToken,
          },
          body: JSON.stringify({
            start_time: skip.startTime,
            end_time: skip.endTime,
            skip_duration: skip.skipDuration,
            content_id: meta?.tmdbId,
            content_type: meta?.type,
            season: meta?.season?.number,
            episode: meta?.episode?.number,
            confidence: adjustedConfidence,
          }),
        });
      } catch (error) {
        console.error("Failed to send skip analytics:", error);
      }
    },
    [meta],
  );

  const createPendingSkip = useCallback(
    (skip: SkipEvent) => {
      const timer = setTimeout(() => {
        const pendingSkip = pendingSkipsRef.current.get(skip.timestamp);
        if (!pendingSkip) return;
        pendingSkipsRef.current.delete(skip.timestamp);

        const adjustedConfidence = pendingSkip.hasBackwardMovement
          ? Math.max(0.1, pendingSkip.originalConfidence * 0.5)
          : pendingSkip.originalConfidence;
        void sendSkipAnalytics(pendingSkip.skip, adjustedConfidence);
      }, 5000); // 5 second delay

      const pendingSkip = {
        skip,
        originalConfidence: skip.confidence,
        startTime: skip.startTime,
        endTime: skip.endTime,
        hasBackwardMovement: false,
        timer,
      };
      pendingSkipsRef.current.set(skip.timestamp, pendingSkip);
      return pendingSkip;
    },
    [sendSkipAnalytics],
  );

  useEffect(() => {
    if (!latestSkip || !meta) return;

    // Avoid processing the same skip multiple times
    if (latestSkip.timestamp === lastLoggedSkipRef.current) return;

    // Log completed skip session
    // eslint-disable-next-line no-console
    console.log(`Skip session completed: ${latestSkip.skipDuration}s total`);

    // Create pending skip with 5-second delay
    createPendingSkip(latestSkip);

    lastLoggedSkipRef.current = latestSkip.timestamp;
  }, [latestSkip, meta, createPendingSkip]);

  // Monitor for backward movements during pending skip periods
  useEffect(() => {
    const currentTime = progress.time;

    // Check for backward movement
    if (
      lastPlayerTimeRef.current > 0 &&
      currentTime < lastPlayerTimeRef.current
    ) {
      // Backward movement detected, mark relevant pending skips as adjusted
      pendingSkipsRef.current.forEach((pending, timestamp) => {
        const isWithinSkipRange =
          currentTime >= pending.startTime && currentTime <= pending.endTime;
        if (isWithinSkipRange && !pending.hasBackwardMovement) {
          // eslint-disable-next-line no-console
          console.log(`Backward adjustment detected for skip, reducing confidence`);
          pendingSkipsRef.current.set(timestamp, {
            ...pending,
            hasBackwardMovement: true,
          });
        }
      });
    }

    lastPlayerTimeRef.current = currentTime;
  }, [progress.time]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      pendingSkipsRef.current.forEach((pending) => {
        clearTimeout(pending.timer);
      });
      pendingSkipsRef.current.clear();
    };
  }, []);

  return null;
}
