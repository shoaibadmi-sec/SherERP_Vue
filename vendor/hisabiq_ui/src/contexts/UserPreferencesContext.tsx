import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { EntryDateView, TerminologyMode } from "../types/transactions";
import { useTenantSettings } from "../settings/TenantSettingsProvider";
type UserPreferencesValue = {
  terminologyMode: TerminologyMode;
  entryDateView: EntryDateView;
  setTerminologyMode: (mode: TerminologyMode) => void;
  setEntryDateView: (view: EntryDateView) => void;
};
const UserPreferencesContext = createContext<UserPreferencesValue | null>(null);
export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { personal, updatePersonal } = useTenantSettings();
  const value = useMemo<UserPreferencesValue>(
    () => ({
      terminologyMode: personal.terminology,
      entryDateView: personal.dateView,
      setTerminologyMode: (mode) => updatePersonal({ terminology: mode }),
      setEntryDateView: (view) => updatePersonal({ dateView: view }),
    }),
    [personal.terminology, personal.dateView, updatePersonal],
  );
  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context)
    throw new Error(
      "useUserPreferences must be used inside UserPreferencesProvider",
    );
  return context;
}
