import {resolveFinancialText,type FinancialContext} from '../financial-display/model';
import { useTenantSettings } from '../settings/TenantSettingsProvider';
import { showBanglaHelper, uiWord, type UiCopyKey } from './uiCopy';

/** Reads the live Settings language; no second preference or duplicated state. */
export function useUiCopy() {
  const { personal,state } = useTenantSettings();
  const language = personal.language;
  const path=typeof window==='undefined'?'':window.location.hash;
  const context:FinancialContext=path.includes('/purchases')?'Supplier':path.includes('/sales')||path.includes('/pos')?'Customer':path.includes('/vendors')?'Vendor':path.includes('/reports')?'Reports':'Cash & bank';
  const financialText=(english:string,bangla:string)=>resolveFinancialText(state.sections.financialTerminology,context,english,bangla,language);
  return {
    language,
    text: financialText,
    word: (key: UiCopyKey) => financialText(uiWord("English",key),uiWord("Bangla",key)),
    showHelper: showBanglaHelper(language),
  };
}
