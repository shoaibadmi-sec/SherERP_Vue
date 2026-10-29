import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=(path:string)=>readFileSync(path,'utf8');

test('Shared import stages use localized visual labels and stable import state identifiers',()=>{
 const wizard=source('src/components/import/ImportWizard.tsx');
 const helpers=source('src/i18n/importWizardCopy.ts');
 for(const stage of ["'upload'","'map'","'review'","'finish'"]){
  assert.ok(wizard.includes(stage));
 }
 for(const target of ["target==='product'","target==='customer'"]){
  assert.ok(helpers.includes(target),target);
 }
 for(const invariant of ['suggestColumnMapping(target,','mapImportRows(current,mapping)','onApply(rows,','setResult(outcome)','step===\'review\'&&onApply','row.decision!==\'skip\'']){
  assert.ok(wizard.includes(invariant),invariant);
 }
 assert.match(wizard,/importTargetTitle\(language,target\)/);
 assert.match(wizard,/importWizardError\(language,/);
});
test('Upload and mapping preserve file reader, formats, field keys and column index values',()=>{
 const upload=source('src/components/import/ImportUploadStep.tsx');
 const mapping=source('src/components/import/ImportMappingStep.tsx');
 for(const key of ['parseImportFile(file)','makeTemplateCsv(target)','makeTemplateXlsx(target)','onRead(data)','onSelect','selected?.sheet']){
  assert.ok(upload.includes(key),key);
 }
 for(const key of ['fieldsFor(target)','mapping[f.key]','onMapping({...mapping,[f.key]','v===\'none\'?null:Number(v)','table.headers.map']){
  assert.ok(mapping.includes(key),key);
 }
 assert.match(mapping,/fieldLabel\(f.label,f.labelBn\?\?f.label\)/);
 assert.ok(mapping.includes("text('— Do not import —'"));
});
test('Shared row review retains conversion, source references, skip/edit decisions and verified opening warnings',()=>{
 const review=source('src/components/import/ImportReviewStep.tsx');
 for(const key of ['toBasePrice(','toBaseQuantity(','validateMappedRow(','onRowsChange(rows.map(','row.sourceRow','row.match.hasRole',
   "value:'add-role'","value:'update-master'","value:'skip'","value:'create'"]){
  assert.ok(review.includes(key),key);
 }
 assert.match(review,/partyOpeningPreview\(row,target,language\)/);
 assert.match(review,/productConversion\(row,language\)/);
 assert.match(review,/importWizardError\(language,issue.message\)/);
 const wizard=source('src/components/import/ImportWizard.tsx');
 assert.ok(wizard.includes("row.mapped.openingStock:row.mapped.openingAmount"));
 assert.ok(wizard.includes("no payment account is changed.") || wizard.includes("ক্যাশ, ব্যাংক বা মোবাইল হিসাব বদলাবে না"));
});
test('Finish remains in-memory only and error report stays machine-readable',()=>{
 const finish=source('src/components/import/ImportFinishStep.tsx');
 for(const key of ['makeImportErrorCsv(rejectedRows)','downloadImportBlob(','result.openingSources','result.openingLots','result.roleAdded','onAnother','onView']){
  assert.ok(finish.includes(key),key);
 }
 assert.match(finish,/In-memory UI preview only — no records were saved to a server/);
});
