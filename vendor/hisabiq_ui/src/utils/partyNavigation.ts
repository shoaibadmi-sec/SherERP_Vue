import type { PartyRole } from '../types/erp';
import type { IsoRange } from './dateRange';

/** UI context carried by a Party-originated editor; not a financial source record. */
export type PartyWorkspaceContext = {
  range:IsoRange;
  kind:string;
  ledgerQuery:string;
  page:number;
  pageSize:number;
  role:PartyRole|'All';
  query:string;
  scrollY:number;
  directoryScrollTop:number;
};
