/** Bangladesh taka amount in Bangla words (লক্ষ/কোটি, টাকা/পয়সা). */
const words = [
 'শূন্য','এক','দুই','তিন','চার','পাঁচ','ছয়','সাত','আট','নয়',
 'দশ','এগারো','বারো','তেরো','চৌদ্দ','পনেরো','ষোলো','সতেরো','আঠারো','উনিশ',
 'বিশ','একুশ','বাইশ','তেইশ','চব্বিশ','পঁচিশ','ছাব্বিশ','সাতাশ','আঠাশ','ঊনত্রিশ',
 'ত্রিশ','একত্রিশ','বত্রিশ','তেত্রিশ','চৌত্রিশ','পঁয়ত্রিশ','ছত্রিশ','সাঁইত্রিশ','আটত্রিশ','ঊনচল্লিশ',
 'চল্লিশ','একচল্লিশ','বিয়াল্লিশ','তেতাল্লিশ','চুয়াল্লিশ','পঁয়তাল্লিশ','ছেচল্লিশ','সাতচল্লিশ','আটচল্লিশ','ঊনপঞ্চাশ',
 'পঞ্চাশ','একান্ন','বাহান্ন','তিপ্পান্ন','চুয়ান্ন','পঞ্চান্ন','ছাপ্পান্ন','সাতান্ন','আটান্ন','ঊনষাট',
 'ষাট','একষট্টি','বাষট্টি','তেষট্টি','চৌষট্টি','পঁয়ষট্টি','ছেষট্টি','সাতষট্টি','আটষট্টি','ঊনসত্তর',
 'সত্তর','একাত্তর','বাহাত্তর','তিয়াত্তর','চুয়াত্তর','পঁচাত্তর','ছিয়াত্তর','সাতাত্তর','আটাত্তর','ঊনআশি',
 'আশি','একাশি','বিরাশি','তিরাশি','চুরাশি','পঁচাশি','ছিয়াশি','সাতাশি','আটাশি','ঊননব্বই',
 'নব্বই','একানব্বই','বিরানব্বই','তিরানব্বই','চুরানব্বই','পঁচানব্বই','ছিয়ানব্বই','সাতানব্বই','আটানব্বই','নিরানব্বই'
] as const;
function underThousand(value:number):string {
 if(value<100)return words[value];
 const hundreds=Math.floor(value/100),rest=value%100;
 return words[hundreds]+'শত'+(rest?' '+words[rest]:'');
}
function positiveWords(value:number):string {
 if(value===0)return words[0];
 const parts:string[]=[];
 // Bangladesh numbering: every new group above হাজার is two digits.
 for(const [unit,label] of [[10000000,'কোটি'],[100000,'লক্ষ'],[1000,'হাজার']] as const){
  if(value>=unit){
   const count=Math.floor(value/unit);
   parts.push((count<1000?underThousand(count):positiveWords(count))+' '+label);
   value%=unit;
  }
 }
 if(value)parts.push(underThousand(value));
 return parts.join(' ');
}
/** Converts safely rounded paisa to Bengali text. Non-finite amounts produce no words. */
const englishSmall = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
function englishWords(value: number): string {
 if(value < 20) return englishSmall[value];
 if(value < 100) return ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'][Math.floor(value / 10)] + (value % 10 ? '-' + englishSmall[value % 10] : '');
 if(value < 1000) return englishSmall[Math.floor(value / 100)] + ' hundred' + (value % 100 ? ' ' + englishWords(value % 100) : '');
 for(const [unit, label] of [[10000000,'crore'],[100000,'lakh'],[1000,'thousand']] as const) {
  if(value >= unit) return englishWords(Math.floor(value / unit)) + ' ' + label + (value % unit ? ' ' + englishWords(value % unit) : '');
 }
 return '';
}
export function amountInWords(value:number, language: 'Bangla' | 'English' = 'Bangla'):string {
 if(!Number.isFinite(value))return '';
 const paisa=Math.round(Math.abs(value)*100);
 if(!Number.isSafeInteger(paisa))return '';
 const taka=Math.floor(paisa/100),remainder=paisa%100;
 if(language === 'English') {
  const result = (value < 0 && paisa > 0 ? 'minus ' : '') + englishWords(taka) + ' taka' + (remainder ? ' and ' + englishWords(remainder) + ' paisa' : '') + ' only';
  return result[0].toUpperCase() + result.slice(1);
 }
 return (value<0&&paisa>0?'ঋণাত্মক ':'')+positiveWords(taka)+' টাকা'+(remainder?' '+positiveWords(remainder)+' পয়সা':'')+' মাত্র';
}
