import {readPreviewSettings} from '../documents/previewSettings.ts';
import {validateOutputProfile,type OutputProfile} from '../documents/outputProfile.ts';
import {documentHeading} from '../i18n/documentCopy.ts';
import type {UiLanguage} from '../i18n/uiCopy';
import {documentLabel,printDocumentLanguage} from '../i18n/documentCopy.ts';

export type Report={title:string;subtitle?:string;headers:string[];rows:(string|number)[][];language?:UiLanguage;profile?:OutputProfile;businessName?:string};
const escape=(value:string|number)=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]??char));
export function reportHtml(report:Report):string{
 const profile=report.profile;
 if(profile&&!validateOutputProfile(profile))throw Error('Invalid report print profile.');
 const language=profile?.language??report.language??'English + Bangla';
 return '<!doctype html><html lang="'+printDocumentLanguage(language)+'"><head><meta charset="utf-8"><title>'+escape(report.title)+'</title><style>body{font-family:system-ui,"Hind Siliguri","Noto Sans Bengali",sans-serif;color:#0b1a2c;padding:20px}h1{font-size:20px}p{font-size:12px}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border-bottom:1px solid #d5dddf;padding:8px;text-align:left;vertical-align:top;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}@page{size:A4 '+(profile?.orientation.toLowerCase()??'landscape')+';margin:'+(profile?.margin??12)+'mm}@media print{body{padding:0}}</style></head><body>'+((profile?.showBusiness&&report.businessName)?'<h2>'+escape(report.businessName)+'</h2>':'')+'<h1>'+escape(documentHeading(language,report.title))+'</h1><p>'+escape(report.subtitle??'')+'</p><p>'+escape(documentLabel(language,'HisabIQ UI preview · verify source records before sharing.'))+'</p><table><thead><tr>'+report.headers.map(header=>'<th scope="col">'+escape(documentHeading(language,header))+'</th>').join('')+'</tr></thead><tbody>'+report.rows.map(row=>'<tr>'+row.map(cell=>'<td>'+escape(cell)+'</td>').join('')+'</tr>').join('')+'</tbody></table>'+(report.rows.length?'':'<p>'+escape(documentLabel(language,'No transactions in this selection.'))+'</p>')+(profile?.showSignatures?'<p style="margin-top:40px">'+escape(documentHeading(language,'Signature'))+' __________________</p>':'')+(profile?.footer?'<footer>'+escape(profile.footer)+'</footer>':'')+'</body></html>';
}
export function reportCsv(headers:string[],rows:(string|number)[][]):string{
 const cell=(value:string|number)=>{let text=String(value);if(typeof value==='string'&&/^\s*[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};
 return '\uFEFF'+[headers,...rows].map(row=>row.map(cell).join(',')).join('\r\n');
}
/** An isolated print document avoids the Party statement's page-wide visibility rules. */
export function printReport(report:Report):boolean{
 const preview=window.open('','_blank');
 if(!preview)return false;
 preview.opener=null;
 const settings=readPreviewSettings();
 const configured=report.profile?report:settings?{...report,profile:settings.sections.invoices.profiles?.report,businessName:settings.sections.business.name}:report;
 preview.document.write(reportHtml(configured));preview.document.close();
 setTimeout(()=>{preview.focus();preview.print();},100);
 return true;
}
export function downloadReport(filename:string,headers:string[],rows:(string|number)[][]):void{
 const url=URL.createObjectURL(new Blob([reportCsv(headers,rows)],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
