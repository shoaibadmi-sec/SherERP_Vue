export type ImportTarget='product'|'customer'|'supplier';
export type ImportStep='upload'|'map'|'review'|'finish';
export type ImportRowDecision='create'|'update-master'|'add-role'|'skip'|'reject';
export type ImportIssue={
 sourceRow:number; field?:string; severity:'error'|'warning'; message:string;
};
export type ImportCell=string|number|boolean|Date|null;
export type ImportTable={
 fileName:string; sheet:string; sheetNames:string[]; headers:string[];
 rows:Array<{sourceRow:number;cells:ImportCell[]}>;
};
export type ColumnMapping=Record<string,number|null>;
export type StagedImportRow={
 sourceSheet:string;sourceRow:number;original:Record<string,string>;
 mapped:Record<string,unknown>;issues:ImportIssue[];
 match?:{kind:'strong'|'suggested';existingId:string;label:string;hasRole?:boolean};
 decision:ImportRowDecision;
};
export type ImportResult={
 sessionId:string;created:number;masterUpdated:number;roleAdded:number;
 openingSources:number;openingLots:number;skipped:number;rejected:number;errors:ImportIssue[];
};
export type ImportFieldSchema={key:string;label:string;labelBn?:string;required:boolean;aliases:readonly string[];example:string};
