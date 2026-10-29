import type {UiLanguage} from './uiCopy';
import {uiText} from './uiCopy';
import type {ImportTarget} from '../import/importTypes';
import {translateKnownImportValidation} from './importValidationCopy';

/** Only translate human-readable UI copy. ImportTarget, CSV headers and decisions remain stable IDs. */
export function importTargetTitle(language:UiLanguage,target:ImportTarget):string {
 const pair=target==='product'?['Import products','পণ্য আনুন']:
  target==='customer'?['Import customers','ক্রেতার তথ্য আনুন']:['Import suppliers','সরবরাহকারীর তথ্য আনুন'];
 return uiText(language,pair[0],pair[1]);
}
const knownErrors:readonly (readonly [string,string])[]=[
 ['Select a file with at least one heading row.','কলামের নামসহ একটি ফাইল বাছুন।'],
 ['Invalid column mapping.','কলামের মিল ঠিক নেই।'],
 ['Select at least one valid row to import.','আনার জন্য অন্তত একটি সঠিক সারি বাছুন।'],
 ['Import was not applied.','তথ্য আনা যায়নি।'],
 ['Unable to read file.','ফাইল পড়া যায়নি।'],
 ['Unable to generate template.','নমুনা ফাইল তৈরি করা যায়নি।'],
 ['A required column is not mapped.','প্রয়োজনীয় কলামের মিল দেওয়া হয়নি।'],
 ['A name column is required.','নামের কলাম থাকা আবশ্যক।']
];
export function importWizardError(language:UiLanguage,message:string):string {
 if(language!=='Bangla')return message;
 return translateKnownImportValidation(knownErrors.reduce((m,[english,bangla])=>m.replaceAll(english,bangla),message));
}
