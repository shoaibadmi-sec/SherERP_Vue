import {publishPreviewSettings} from '../documents/previewSettings';
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  canManage,
  currentBusinessId,
  parseSettings,
  personalDefaults,
  personalKey,
  saveSection,
  settingsKey,
  validPersonal,
  type BusinessSection,
  type PersonalSettings,
  type SettingsSections,
  type TenantSettings,
} from "./model";

function readInitial() {
  try {
    const loaded = parseSettings(
      localStorage.getItem(settingsKey(currentBusinessId)),
      currentBusinessId,
    );
    const raw = localStorage.getItem(personalKey);
    let personal = { ...personalDefaults };
    if (raw) {
      try {
        const value = JSON.parse(raw);
        if (validPersonal(value)) personal = { ...personalDefaults, ...value };
      } catch {
        /* Recover preferences without discarding valid business settings. */
      }
    } else {
      personal.terminology =
        localStorage.getItem("hisabiq-terminology-mode") === "accounting"
          ? "accounting"
          : "simple";
      personal.dateView =
        localStorage.getItem("hisabiq-entry-date-view") === "created"
          ? "created"
          : "transaction";
    }
    return {
      ...loaded,
      personal,
      warning: loaded.recovered
        ? "Saved business settings were invalid. Example defaults have been restored."
        : "",
    };
  } catch {
    return {
      ...parseSettings(null, currentBusinessId),
      personal: { ...personalDefaults },
      warning:
        "Browser storage is unavailable. Changes will stay in memory for this session.",
    };
  }
}
type SettingsContextValue = {
  state: TenantSettings;
  personal: PersonalSettings;
  warning: string;
  actorId: string;
  setActorId: (id: string) => void;
  save: <K extends BusinessSection>(
    section: K,
    value: SettingsSections[K],
    expectedRevision: number,
  ) => { ok: boolean; error?: string; persisted?:boolean; revision?:number };
  updatePersonal: (patch: Partial<PersonalSettings>) => void;
  restore: (
    value: TenantSettings,
    expectedRevision: number,
  ) => { ok: boolean; error?: string };
};
const SettingsContext = createContext<SettingsContextValue | null>(null);
export function TenantSettingsProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readInitial);
  const [state, setState] = useState(initial.state);
  const ref = useRef(state);
  useLayoutEffect(()=>{publishPreviewSettings(state);},[state]);
  useEffect(()=>()=>publishPreviewSettings(undefined),[]);
  const [personal, setPersonal] = useState(initial.personal);
  const personalRef = useRef(personal);
  const [warning, setWarning] = useState(initial.warning);
  const [actorId, setActorId] = useState("mahmud");
  useEffect(() => {
    const storage = (event: StorageEvent) => {
      if (event.key !== settingsKey(currentBusinessId) && event.key !== null)
        return;
      const loaded = parseSettings(event.newValue, currentBusinessId);
      if (loaded.recovered) {
        setWarning(
          "Another tab saved invalid settings. Your current settings have been kept.",
        );
        return;
      }
      ref.current = loaded.state;
      setState(loaded.state);
    };
    window.addEventListener("storage", storage);
    return () => window.removeEventListener("storage", storage);
  }, []);
  function persist(next: TenantSettings) {
    ref.current = next;
    setState(next);
    try {
      localStorage.setItem(settingsKey(next.tenantId), JSON.stringify(next));
      setWarning("");
      return true;
    } catch {
      setWarning(
        "Changes are in memory only: browser storage is unavailable or full. Download a settings backup before leaving.",
      );
      return false;
    }
  }
  const save: SettingsContextValue["save"] = (
    section,
    value,
    expectedRevision,
  ) => {
    const result = saveSection(
      ref.current,
      actorId,
      section,
      value,
      expectedRevision,
      new Date().toISOString(),
    );
    if (!result.ok) return result;
    const persisted=persist(result.state);
    return { ok: true, persisted,revision:result.state.revision };
  };
  function updatePersonal(patch: Partial<PersonalSettings>) {
    const next = { ...personalRef.current, ...patch };
    if (!validPersonal(next)) return;
    personalRef.current = next;
    setPersonal(next);
    try {
      localStorage.setItem(personalKey, JSON.stringify(next));
      localStorage.setItem("hisabiq-terminology-mode", next.terminology);
      localStorage.setItem("hisabiq-entry-date-view", next.dateView);
    } catch {
      setWarning(
        "Personal preferences are in memory only because browser storage is unavailable or full.",
      );
    }
  }
  function restore(value: TenantSettings, expectedRevision: number) {
    if (!canManage(ref.current, actorId, "import"))
      return {
        ok: false,
        error: "Only an authorized owner can restore settings.",
      };
    const parsed = parseSettings(JSON.stringify(value), ref.current.tenantId);
    if (parsed.recovered)
      return { ok: false, error: "Choose a valid backup for this business." };
    if (expectedRevision !== ref.current.revision)
      return { ok: false, error: "Settings changed. Review the backup again." };
    const next = structuredClone(ref.current);
    next.sections = parsed.state.sections;
    next.revision++;
    next.events.unshift({
      id: `restore-${next.revision}`,
      at: new Date().toISOString(),
      actor: ref.current.sections.team.employees.find((e) => e.id === actorId)!
        .name,
      section: "Backup restore",
      changes: Object.keys(next.sections),
    });
    persist(next);
    return { ok: true };
  }
  return (
    <SettingsContext.Provider
      value={{
        state,
        personal,
        warning,
        actorId,
        setActorId,
        save,
        updatePersonal,
        restore,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
export function useTenantSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw Error("TenantSettingsProvider is missing");
  return value;
}
