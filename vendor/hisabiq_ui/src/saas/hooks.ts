import { useSearchParams } from "react-router-dom";
import { useSaas } from "./SaasProvider";
import { can } from "./permissions";
import type { Permission } from "./types";
export function useScoped<T extends { tenantId: string }>(
  rows: T[],
  permission: Permission,
) {
  const { state, actor } = useSaas();
  const [params] = useSearchParams();
  return rows.filter(
    (x) =>
      can(state, actor, permission, x.tenantId) &&
      (!params.get("tenant") || params.get("tenant") === x.tenantId),
  );
}
