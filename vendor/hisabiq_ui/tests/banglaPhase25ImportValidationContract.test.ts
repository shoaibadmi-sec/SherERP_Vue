import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(p:string)=>readFileSync(p,'utf8');
test('Known importer validation messages have Bangla display equivalents',()=>{
 const c=read('src/i18n/importValidationCopy.ts');
 for(const label of [
  'CSV exceeds the 1 MB preview limit.','XLSX exceeds the 5 MB preview limit.',
  'The same source column cannot be mapped more than once.','Product Name is required.',
  'Duplicate SKU in this file. Row skipped.','SKU already exists; choose Skip or Update master data.',
  'Phone matches multiple Parties. Enter the exact Party ID or correct the phone.',
  'Opening amount must be nonnegative with at most two decimals.',
  'Required serial tracking must list exactly one serial per opening base unit.'
 ])assert.ok(c.includes(label),label);
 for(const dynamic of ['Invalid quoted CSV field at line','SKU belongs to','Duplicate serial:','An active opening balance already exists for','role is already assigned'])assert.ok(c.includes(dynamic),dynamic);
});
test('Only Bangla mode localizes source errors; unknown messages and data remain untouched',()=>{
 const helper=read('src/i18n/importWizardCopy.ts');
 assert.match(helper,/if\(language!==['"]Bangla['"]\)return message/);
 assert.match(helper,/translateKnownImportValidation\(knownErrors\.reduce/);
 const validation=read('src/i18n/importValidationCopy.ts');
 assert.match(validation,/let value=message/);
 assert.match(validation,/replaceAll\(original,bangla\)/);
 assert.match(validation,/return value/);
 assert.match(validation,/Preserve dynamic names, IDs, source row numbers, units and financial directions/);
});
test('Import adapters, source verification and machine-readable error report remain unchanged',()=>{
 const wizard=read('src/components/import/ImportWizard.tsx');
 const review=read('src/components/import/ImportReviewStep.tsx');
 const upload=read('src/components/import/ImportUploadStep.tsx');
 const finish=read('src/components/import/ImportFinishStep.tsx');
 assert.ok(wizard.includes('onApply(rows,'));
 assert.ok(wizard.includes('importWizardError(language,'));
 assert.ok(review.includes('importWizardError(language,issue.message)'));
 assert.ok(upload.includes('parseImportFile(file)'));
 assert.ok(upload.includes('importWizardError(language,'));
 assert.ok(finish.includes('makeImportErrorCsv(rejectedRows)'));
 for(const file of ['src/import/productImport.ts','src/import/partyImport.ts','src/import/fileReader.ts','src/import/columnMapping.ts'])assert.ok(read(file).length>500,file);
});
