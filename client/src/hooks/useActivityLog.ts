import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Logs a view activity when a user visits a page with a specific entity.
 */
export function useActivityLog(params: {
  action: string;
  entityType?: string;
  entityId?: number;
  entityTitle?: string;
  enabled?: boolean;
}) {
  const logMutation = trpc.activity.log.useMutation();
  const { action, entityType, entityId, entityTitle, enabled = true } = params;

  useEffect(() => {
    if (!enabled) return;
    logMutation.mutate({
      action,
      entityType,
      entityId,
      entityTitle,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, entityType, entityId, entityTitle, enabled]);
}
