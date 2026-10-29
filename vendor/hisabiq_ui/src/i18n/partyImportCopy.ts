import type {UiLanguage} from './uiCopy';
import {partyRoleLabel} from './partyCopy';
import type {PartyRole} from '../types/erp';

/** Presentation-only import errors: do not change CSV parser or accepted role IDs. */
const errors:readonly (readonly [string,string])[]=[
 ['CSV exceeds the 1 MB preview limit.','CSV ফাইলের আকার ১ MB-এর বেশি।'],
 ['Invalid quoted field in CSV.','CSV-তে উদ্ধৃতির চিহ্ন ঠিক নেই।'],
 ['Unexpected content after quoted field.','CSV-তে উদ্ধৃতির পরে অপ্রত্যাশিত লেখা আছে।'],
 ['Unterminated quoted field in CSV.','CSV-তে উদ্ধৃতির চিহ্ন বন্ধ হয়নি।'],
 ['Choose a CSV containing party details.','পার্টির তথ্য আছে এমন CSV ফাইল বাছুন।'],
 ['A name column is required.','নামের কলাম থাকা আবশ্যক।'],
 ['Unknown party role.','সম্পর্কের ধরন চেনা যায়নি।'],
 ['Spreadsheet formula-like text is not allowed.','ফর্মুলার মতো লেখা ব্যবহার করা যাবে না।'],
 ['Duplicate phone in import; review manually.','এই ফাইলে একই ফোন একাধিকবার আছে; যাচাই করুন।'],
 ['Import accepts at most 5,000 data rows.','সর্বোচ্চ ৫,০০০ সারি আনা যাবে।'],
 ['Party name is required.','পার্টির নাম লিখুন।'],
 ['Choose at least one valid role.','অন্তত একটি সঠিক সম্পর্ক বাছুন।'],
 ['Duplicate roles are not permitted.','একই সম্পর্ক দুইবার দেওয়া যাবে না।'],
 ['Party ID already exists.','এই পার্টি আইডি আগেই আছে।'],
 ['Enter a valid phone number.','সঠিক ফোন নম্বর লিখুন।'],
 ['Cannot read CSV.','CSV পড়া যায়নি।'],
 ['Import rejected.','তথ্য আনা যায়নি।']
];
export function partyImportErrorText(language:UiLanguage,message:string):string {
 if(language!=='Bangla')return message;
 return errors.reduce((result,[english,bangla])=>result.replaceAll(english,bangla),message);
}
export function partyImportedRoleLabels(roles:readonly PartyRole[],language:UiLanguage):string {
 return roles.map(role=>partyRoleLabel(role,language)).join(', ');
}
