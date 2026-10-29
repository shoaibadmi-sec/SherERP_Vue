/** Prevent saving an ordinary Purchase against a different supplier when
 * PurchaseEditor is opened in a specific Vendor workspace. */
export function purchaseSupplierGuard(selectedSupplierId:string,lockedVendorId?:string):string|null{
 if(lockedVendorId&&selectedSupplierId!==lockedVendorId)
  return 'Purchase must use the selected Vendor. Open a different Vendor before purchasing from them.';
 return null;
}
