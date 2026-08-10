import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Sends a heartbeat every 2 minutes to update the user's lastSeen timestamp.
 * Only runs when the user is authenticated.
 */
export function useHeartbeat() {
  const heartbeat = trpc.activity.heartbeat.useMutation();

  useEffect(() => {
    // Send initial heartbeat
    heartbeat.mutate();

    // Send heartbeat every 2 minutes
    const interval = setInterval(() => {
      heartbeat.mutate();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
