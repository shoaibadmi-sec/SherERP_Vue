import {invoicePageCss,validateInvoiceDesign} from '../../documents/profile';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReceiptPreview, type ReceiptPreviewProps } from './ReceiptPreview';
import {documentLabel,printDocumentLanguage} from '../../i18n/documentCopy';

const printCss = `body{margin:0;background:white;color:#0b1a2c;font-family:system-ui,'Hind Siliguri','Noto Sans Bengali',sans-serif}#document-receipt{width:288px;margin:auto}#document-receipt .truncate{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:anywhere}#document-receipt li{break-inside:avoid}@page{size:80mm 297mm;margin:2mm}@media print{body *{visibility:visible!important}#document-receipt{position:static!important}#document-receipt>div{box-shadow:none!important;--tw-ring-shadow:none!important}}`;

/** Render the same receipt as POS/Sales, with React escaping every source field. */
export function receiptPrintHtml(props: ReceiptPreviewProps, styles: Array<{css?: string;href?: string}> = [], baseUrl = ''): string {
  const design=props.branding?.design;
  if(design&&validateInvoiceDesign(design))throw Error('Invalid document profile.');
  const css=design?printCss+invoicePageCss(design)+'#document-receipt{width:auto} .invoice-document{box-shadow:none;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}.invoice-classic .invoice-business{border-top:4px solid #0d7c74;padding-top:12px}.invoice-compact{font-size:11px}.invoice-compact>div{margin-top:8px}.invoice-compact td{padding:4px}':printCss;
  return '<!doctype html>' + renderToStaticMarkup(
    <html lang={printDocumentLanguage(design?.language??props.language??"English + Bangla")} data-theme="light"><head><meta charSet="utf-8" />
      <title>{props.invoice}</title>{baseUrl && <base href={baseUrl} />}
      {styles.map((style,i) => style.href ? <link key={i} rel="stylesheet" href={style.href} /> : <style key={i} dangerouslySetInnerHTML={{__html:(style.css ?? '').replace(/<\/style/gi,'<\\/style')}} />)}
      <style dangerouslySetInnerHTML={{__html:css}} />
    </head><body><main id="document-receipt"><ReceiptPreview {...props} /><p style={{fontSize:10,textAlign:'center'}}>{documentLabel(design?.language??props.language??'English + Bangla','HisabIQ UI preview')}</p></main></body></html>
  );
}

export function printReceipt(props: ReceiptPreviewProps, target?: Window): boolean {
  const view = target ?? window.open('', '_blank');
  if (!view) return false;
  view.opener = null;
  const styles = [...document.querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style,link[rel="stylesheet"]')]
    .map(node => node instanceof HTMLLinkElement ? {href:node.href} : {css:node.textContent ?? ''});
  view.document.open();
  view.document.write(receiptPrintHtml(props, styles, document.baseURI));
  view.addEventListener('load', async () => {
    await view.document.fonts.ready;
    view.focus(); view.print();
  }, {once:true});
  view.document.close();
  return true;
}
