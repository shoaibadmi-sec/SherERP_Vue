import type {ReactNode} from 'react';
import {Tooltip} from '../Tooltip';
import {useUiCopy} from '../../i18n/useUiCopy';
import {reportGuides} from '../../reports/guidance';

export function ReportLabel({en,bn,className=''}:{en:string;bn:string;className?:string}){
 const {text,showHelper}=useUiCopy();
 return <span className={'inline-flex min-w-0 flex-col '+className}><span>{text(en,bn)}</span>{showHelper&&<span data-bangla-helper="" className="font-bn text-[11px] font-normal text-ink-500">{bn}</span>}</span>;
}
export function ReportHelp({guide,label}:{guide:string;label?:string}){
 const {language,showHelper}=useUiCopy(),copy=reportGuides[guide];
 if(!copy)return null;
 const content:ReactNode=<>{language==='Bangla'?copy.bn:<><span>{copy.en}</span>{showHelper&&<span className="mt-2 block border-t border-border pt-2 font-bn">{copy.bn}</span>}</>}</>;
 return <Tooltip interactive label={language==='Bangla'?(label??guide)+' সম্পর্কে জানুন':'About '+(label??guide).toLocaleLowerCase()} content={content}/>;
}

