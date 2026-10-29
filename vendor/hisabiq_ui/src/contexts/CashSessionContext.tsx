import {createContext,useContext,useState,type ReactNode} from 'react';

type CashCount={counted:number;expected:number;note:string;savedAt:string;closed:boolean};
type CashSessionContextValue={
 open:boolean;setOpen:(open:boolean)=>void;sessionOpen:boolean;
 openingCash:number;expectedCash:number;sampleMovements:boolean;
 startSession:(opening:number)=>void;saveCount:(counted:number,note:string,close:boolean)=>void;
 lastCount:CashCount|null;
};
const CashSessionContext=createContext<CashSessionContextValue|null>(null);
export function CashSessionProvider({children}:{children:ReactNode}){
 const [open,setOpen]=useState(false);
 const [sessionOpen,setSessionOpen]=useState(true);
 const [openingCash,setOpeningCash]=useState(5000);
 const [sampleMovements,setSampleMovements]=useState(true);
 const [lastCount,setLastCount]=useState<CashCount|null>(null);
 const expectedCash=openingCash+(sampleMovements?38610+7820-3180:0);
 const startSession=(opening:number)=>{
  if(!Number.isFinite(opening)||opening<0)return;
  setOpeningCash(opening);setSampleMovements(false);setLastCount(null);setSessionOpen(true);
 };
 const saveCount=(counted:number,note:string,close:boolean)=>{
  if(!Number.isFinite(counted)||counted<0||!sessionOpen||(close&&counted!==expectedCash&&!note.trim()))return;
  setLastCount({counted,expected:expectedCash,note:note.trim(),savedAt:new Date().toISOString(),closed:close});
  if(close)setSessionOpen(false);
 };
 return <CashSessionContext.Provider value={{open,setOpen,sessionOpen,openingCash,expectedCash,sampleMovements,startSession,saveCount,lastCount}}>{children}</CashSessionContext.Provider>;
}
export function useCashSession(){const ctx=useContext(CashSessionContext);if(!ctx)throw new Error('useCashSession must be used inside CashSessionProvider');return ctx;}
