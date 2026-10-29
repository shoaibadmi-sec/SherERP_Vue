import {matchesSearch} from './fuzzySearch.ts';
import type { Party, PartyRole } from '../types/erp';
import type { PartyDraft, PartyRelationship } from '../types/partyLedger';

const roles: PartyRole[] = ['Customer', 'Supplier', 'Vendor', 'Lender', 'Borrower', 'Payee', 'Owner'];

export function validatePartyDraft(draft: PartyDraft, existing: Party[], editingId?: string): string[] {
  const errors: string[] = [];
  if (!draft.name?.trim()) errors.push('Party name is required.');
  if (!draft.roles?.length || !draft.roles.every(role => roles.includes(role))) errors.push('Choose at least one valid role.');
  if (new Set(draft.roles).size !== draft.roles.length) errors.push('Duplicate roles are not permitted.');
  if (draft.id && draft.id !== editingId && existing.some(p => p.id === draft.id)) errors.push('Party ID already exists.');
  if (draft.phone && !/^[\d\s+()-]{3,30}$/.test(draft.phone)) errors.push('Enter a valid phone number.');
  return errors;
}

export function resolvePartySelection(parties: Party[], id?: string, role?: string): {partyId:string; relationship:PartyRelationship}|null {
  const party = parties.find(p => p.id === id) ?? parties[0];
  if (!party) return null;
  return {partyId:party.id, relationship: party.roles.includes(role as PartyRole) ? role as PartyRole : party.roles[0]};
}

export function matchesPartySearch(party: Party, raw: string): boolean {
  return matchesSearch(raw,[party.name,party.nameBn,party.phone,party.area]);
}
