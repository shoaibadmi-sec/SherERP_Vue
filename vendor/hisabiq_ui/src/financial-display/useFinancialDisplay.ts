import { useTenantSettings } from "../settings/TenantSettingsProvider";
import {
  financialColumns,
  financialLabel,
  resolveFinancialText,
  type FinancialContext,
  type FinancialTerm,
} from "./model";
export function useFinancialDisplay(
  context: FinancialContext,
  languageOverride?: string,
) {
  const { state, personal } = useTenantSettings();
  const display = state.sections.financialTerminology;
  return {
    text: (en: string, bn: string) =>
      resolveFinancialText(
        display,
        context,
        en,
        bn,
        languageOverride ?? personal.language,
      ),
    columns: financialColumns(display, context),
    label: (key: FinancialTerm) =>
      financialLabel(
        display,
        context,
        key,
        languageOverride ?? personal.language,
      ),
    display,
  };
}
