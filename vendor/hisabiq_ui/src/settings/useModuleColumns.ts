import { useEffect, useState, useCallback } from "react";
import { useTenantSettings } from "./TenantSettingsProvider";
import {
  moduleViewCatalog,
  resolveModuleColumns,
  type ViewModule,
} from "./moduleViews";
export function useModuleColumns<K extends string>(
  module: ViewModule,
  key: string,
  defaults: Record<K, boolean>,
) {
  const { state } = useTenantSettings();
  const read = useCallback(() => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "{}");
      return v && typeof v === "object" && !Array.isArray(v)
        ? (Object.fromEntries(
            Object.entries(v).filter(
              ([k, x]) =>
                (
                  moduleViewCatalog[module].columns as readonly string[]
                ).includes(k) && typeof x === "boolean",
            ),
          ) as Record<string, boolean>)
        : {};
    } catch {
      return {};
    }
  }, [key, module]);
  const [own, setOwn] = useState(read),
    [warning, setWarning] = useState("");
  useEffect(() => {
    const refresh = () => setOwn(read());
    window.addEventListener("storage", refresh);
    window.addEventListener("hisabiq-module-columns", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("hisabiq-module-columns", refresh);
    };
  }, [read]);
  const columns = resolveModuleColumns(
    module,
    defaults,
    state.sections.interface[module],
    own,
  ) as Record<K, boolean>;
  const save = (next: Record<string, boolean>) => {
    setOwn(next);
    try {
      if (Object.keys(next).length)
        localStorage.setItem(key, JSON.stringify(next));
      else localStorage.removeItem(key);
      window.dispatchEvent(new Event("hisabiq-module-columns"));
      setWarning("");
    } catch {
      setWarning("Changes are in memory only; browser storage is unavailable.");
    }
  };
  const setColumns = (
    update:
      | Record<K, boolean>
      | ((current: Record<K, boolean>) => Record<K, boolean>),
  ) => {
    const next = typeof update === "function" ? update(columns) : update;
    const patch = { ...own };
    for (const k of moduleViewCatalog[module].columns) {
      if (typeof next[k as K] === "boolean" && next[k as K] !== columns[k as K])
        patch[k] = next[k as K];
    }
    save(patch);
  };
  return { columns, setColumns, reset: () => save({}), warning };
}
