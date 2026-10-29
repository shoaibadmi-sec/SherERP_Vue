import type {ButtonHTMLAttributes,ComponentType,ForwardRefExoticComponent,HTMLAttributes,InputHTMLAttributes,ReactNode,RefAttributes,TableHTMLAttributes,TdHTMLAttributes,ThHTMLAttributes} from 'react';

type Forward<T,P> = ForwardRefExoticComponent<P & RefAttributes<T>>;
export type ButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{
 variant?:'default'|'outline'|'secondary'|'ghost'|'destructive'|'link';
 size?:'default'|'xs'|'sm'|'lg'|'icon'|'icon-xs'|'icon-sm'|'icon-lg';
};
export const Button:Forward<HTMLButtonElement,ButtonProps>;
export const Input:Forward<HTMLInputElement,InputHTMLAttributes<HTMLInputElement>>;
export const Badge:Forward<HTMLSpanElement,HTMLAttributes<HTMLSpanElement>&{variant?:'default'|'secondary'|'destructive'|'outline'}>;
export const Switch:Forward<HTMLInputElement,Omit<InputHTMLAttributes<HTMLInputElement>,'size'>&{size?:'default'|'sm';onCheckedChange?:(checked:boolean)=>void}>;
export const Dialog:ComponentType<{children?:ReactNode;open?:boolean;defaultOpen?:boolean;onOpenChange?:(open:boolean)=>void}>;
export const DialogContent:Forward<HTMLDivElement,HTMLAttributes<HTMLDivElement>&{showCloseButton?:boolean}>;
export const DialogHeader:Forward<HTMLDivElement,HTMLAttributes<HTMLDivElement>>;
export const DialogFooter:Forward<HTMLDivElement,HTMLAttributes<HTMLDivElement>>;
export const DialogTitle:Forward<HTMLHeadingElement,HTMLAttributes<HTMLHeadingElement>>;
export const DialogDescription:Forward<HTMLParagraphElement,HTMLAttributes<HTMLParagraphElement>>;
export const Table:Forward<HTMLTableElement,TableHTMLAttributes<HTMLTableElement>>;
export const TableHeader:Forward<HTMLTableSectionElement,HTMLAttributes<HTMLTableSectionElement>>;
export const TableBody:Forward<HTMLTableSectionElement,HTMLAttributes<HTMLTableSectionElement>>;
export const TableRow:Forward<HTMLTableRowElement,HTMLAttributes<HTMLTableRowElement>>;
export const TableHead:Forward<HTMLTableCellElement,ThHTMLAttributes<HTMLTableCellElement>>;
export const TableCell:Forward<HTMLTableCellElement,TdHTMLAttributes<HTMLTableCellElement>>;
