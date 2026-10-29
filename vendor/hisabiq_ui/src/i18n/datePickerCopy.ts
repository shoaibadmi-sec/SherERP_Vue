import type {UiLanguage} from './uiCopy';
import {uiText} from './uiCopy';
import {formatDay,formatRange,utcDate,type IsoRange} from '../utils/dateRange';

/** Calendar translations affect visible text only; ISO values and datePreset keys remain English. */
export const datePresetBn:Record<string,string>={
 'Today':'আজ',
 'Yesterday':'গতকাল',
 'Last 7 days':'গত ৭ দিন',
 'This week':'এই সপ্তাহ',
 'This month':'এই মাস',
 'Last month':'গত মাস'
};
export const weekdaysBn=['সোম','মঙ্গল','বুধ','বৃহ','শুক্র','শনি','রবি'] as const;
const banglaGregorian='bn-BD-u-ca-gregory';
export function datePickerMonthLabel(language:UiLanguage,first:string):string {
 return new Intl.DateTimeFormat(language==='Bangla'?banglaGregorian:'en-GB',{
  month:'long',year:'numeric',timeZone:'UTC'
 }).format(utcDate(first));
}
export function datePickerDayLabel(language:UiLanguage,iso:string):string {
 if(language!=='Bangla')return formatDay(iso);
 return iso?new Intl.DateTimeFormat(banglaGregorian,{
  day:'numeric',month:'short',year:'numeric',timeZone:'UTC'
 }).format(utcDate(iso)):'তারিখ বাছুন';
}
export function datePickerRangeLabel(language:UiLanguage,value:IsoRange):string {
 if(language!=='Bangla')return formatRange(value);
 if(value.from&&value.to)return value.from===value.to?
  datePickerDayLabel(language,value.from):
  datePickerDayLabel(language,value.from)+' – '+datePickerDayLabel(language,value.to);
 return value.from?datePickerDayLabel(language,value.from)+' – …':'সব তারিখ';
}
export function datePickerWord(language:UiLanguage,en:string,bn:string):string {
 return uiText(language,en,bn);
}
