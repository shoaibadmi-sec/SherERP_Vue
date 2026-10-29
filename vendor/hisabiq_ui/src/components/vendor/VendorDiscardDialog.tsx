import {Button} from '../Button';
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from '../Dialog';
import {useUiCopy} from '../../i18n/useUiCopy';

/** Shared confirmation: never discard a Vendor draft on an accidental tab or Vendor change. */
export function VendorDiscardDialog({open,onCancel,onDiscard}:{
 open:boolean;onCancel:()=>void;onDiscard:()=>void;
}){
 const {text}=useUiCopy();
 return <Dialog open={open} onOpenChange={value=>{if(!value)onCancel();}}>
  <DialogContent aria-label={text('Leave without saving?','সংরক্ষণ না করে বের হবেন?')} className="w-[calc(100vw-2rem)] max-w-md">
   <DialogHeader>
    <DialogTitle>{text('Leave without saving?','সংরক্ষণ না করে বের হবেন?')}</DialogTitle>
    <DialogDescription>{text('You have unsaved changes. Switching now will discard them.','কিছু কাজ সংরক্ষণ করা হয়নি। এখন বদলালে সেগুলো হারিয়ে যাবে।')}</DialogDescription>
   </DialogHeader>
   <DialogFooter className="flex flex-wrap justify-end gap-2">
    <Button type="button" variant="outline" onClick={onCancel}>{text('Keep editing','সম্পাদনা চালিয়ে যান')}</Button>
    <Button type="button" onClick={onDiscard} className="bg-danger text-white hover:opacity-90">{text('Discard changes','পরিবর্তন বাদ দিন')}</Button>
   </DialogFooter>
  </DialogContent>
 </Dialog>;
}
