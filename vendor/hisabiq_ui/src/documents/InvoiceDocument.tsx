import { bundleContentsForReceipt } from "../bundles/bundleDocuments";
import type { ReceiptPreviewProps } from "../components/brand/ReceiptPreview";
import { invoiceDesignDefaults } from "./profile";
import { documentLabel, documentMethod } from "../i18n/documentCopy";
import { formatNumber } from "../utils/currency";
import { AmountInWordsDisplay } from "../components/AmountInWordsDisplay";
export function InvoiceDocument(p: ReceiptPreviewProps) {
  const d = { ...invoiceDesignDefaults(), ...p.branding?.design };
  const language = d.language;
  const bn = language === "Bangla";
  const label = (en: string, bangla = documentLabel("Bangla", en)) => {
    if (bn) return bangla;
    if (language === "English" || bangla === en) return en;
    return <span className="inline-flex flex-col align-top leading-tight"><span>{en}</span><span data-document-helper="" lang="bn" data-table-helper className="font-bn mt-0.5 text-[11px] font-normal text-ink-600">{bangla}</span></span>;
  };
  const n = (v: number) => formatNumber(v, v % 1 ? 2 : 0);
  const thermal = d.paper === "80 mm" || d.paper === "58 mm";
  const sections = {
    header:
      d.showBusiness && d.paper !== "Business Pad" ? (
        <header
          className="invoice-business border-b border-slate-200 pb-4 text-center"
          style={
            d.template === "Classic"
              ? { borderTop: "4px solid #0d7c74", paddingTop: 12 }
              : undefined
          }
        >
          {d.showLogo && p.branding?.logo && (
            <img
              src={p.branding.logo}
              alt="Business logo"
              className="mx-auto mb-2 size-12 object-contain"
            />
          )}
          <h2 className="text-lg font-semibold">
            {bn
              ? p.branding?.nameBn || p.branding?.name
              : p.branding?.name || "HisabIQ"}
          </h2>
          {language === "English + Bangla" && p.branding?.nameBn && (
            <p>{p.branding.nameBn}</p>
          )}
          <p className="text-xs">{p.branding?.address}</p>
          <p className="text-xs">{p.branding?.phone}</p>
        </header>
      ) : null,
    customer: (
      <section className="space-y-1 text-xs">
        <h3 className="mb-3 text-base font-semibold">
          {label("Sales invoice", "বিক্রয় চালান")}
        </h3>
        <div className="flex justify-between gap-2">
          <span>
            {label("Invoice", "চালান")}: {p.invoice}
          </span>
          <span>{p.dateTime}</span>
        </div>
        {d.showCustomer && (
          <p>
            {label("Customer")}: {p.customer || label("Walk-in")}
          </p>
        )}
        {d.showPhone && p.customerPhone && (
          <p>
            {label("Phone")}: {p.customerPhone}
          </p>
        )}
        {d.showGuardian && p.guardianName && (
          <p>
            {label("Guardian")}: {p.guardianName}
          </p>
        )}
        {d.showAddress && p.customerAddress && (
          <p>
            {label("Address")}: {p.customerAddress}
          </p>
        )}
      </section>
    ),
    items: (
      <section>
        <table
          data-erp-table
          className="invoice-lines w-full border-collapse text-xs"
        >
          <thead>
            <tr className="border-y border-slate-300 bg-slate-50">
              <th className="p-2 text-left">{label("Item", "পণ্য")}</th>
              {d.showSku && <th className="p-2 text-left">{label("SKU", "পণ্যের কোড")}</th>}
              {d.showBarcode && (
                <th className="p-2 text-left">{label("Barcode", "বারকোড")}</th>
              )}
              <th className="p-2 text-right">{label("Quantity", "পরিমাণ")}</th>
              <th className="p-2 text-right">{label("Rate", "দর")}</th>
              <th className="p-2 text-right">{label("Total")}</th>
            </tr>
          </thead>
          <tbody>
            {p.lines.map((line, i) => (
              <tr
                key={i}
                className="break-inside-avoid border-b border-slate-200"
              >
                <td className="p-2 align-top">
                  <span>{bn ? line.nameBn || line.name : line.name}</span>
                  {language === "English + Bangla" && line.nameBn && <span data-document-helper="" lang="bn" data-table-helper className="mt-0.5 block font-bn text-[11px] text-ink-600">{line.nameBn}</span>}
                  {d.showSerial && line.serials?.length ? (
                    <p className="mt-1 text-[10px]">
                      {label("Serial")}: {line.serials.join(", ")}
                    </p>
                  ) : null}
                  {d.showWarranty && line.warranty && (
                    <p className="mt-1 text-[10px]">
                      {label("Warranty")}: {line.warranty.duration}{" "}
                      {label(line.warranty.durationUnit)} ·{" "}
                      {label(line.warranty.type)}
                      {line.warranty.terms ? ` · ${line.warranty.terms}` : ""}
                    </p>
                  )}
                  {bundleContentsForReceipt(line).length > 0 && (
                    <div
                      aria-label="Included package products"
                      data-table-helper
                    >
                      {bundleContentsForReceipt(line).map(
                        (component, index) => (
                          <p key={index}>
                            · {component.name} — {component.quantityLabel}
                          </p>
                        ),
                      )}
                    </div>
                  )}
                </td>
                {d.showSku && <td className="p-2">{line.sku || "—"}</td>}
                {d.showBarcode && (
                  <td className="p-2">{line.barcode || "—"}</td>
                )}
                <td className="p-2 text-right align-top">{line.qty}</td>
                <td className="p-2 text-right align-top">{n(line.price)}</td>
                <td className="p-2 text-right align-top">{n(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto mt-3 max-w-xs space-y-1 text-xs">
          <div className="flex justify-between">
            <span>{label("Subtotal")}</span>
            <span>৳{n(p.subtotal)}</span>
          </div>
          {d.showDiscount && p.discount > 0 && (
            <div className="flex justify-between">
              <span>{label("Discount")}</span>
              <span>−৳{n(p.discount)}</span>
            </div>
          )}
          {p.rounding !== 0 && (
            <div className="flex justify-between">
              <span>{label("Rounding")}</span>
              <span>{n(p.rounding)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-semibold">
            <span>{label("Total")}</span>
            <span>৳{n(p.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>{label("Paid")}</span>
            <span>৳{n(p.paid)}</span>
          </div>
          {!!p.change && p.change > 0 && (
            <div className="flex justify-between">
              <span>{label("Change returned", "ফেরত টাকা")}</span>
              <span>৳{n(p.change)}</span>
            </div>
          )}
          {d.showDue && (
            <div className="flex justify-between font-semibold">
              <span>{label("Due")}</span>
              <span>৳{n(p.due)}</span>
            </div>
          )}
        </div>
        {d.showWords && (
          <AmountInWordsDisplay
            amount={p.total}
            language={language}
            variant="receipt"
            label={label("In words", "কথায়")}
          />
        )}
      </section>
    ),
    payments: d.showPayments ? (
      <section className="text-xs">
        <h4 className="font-medium">
          {label("Payment breakdown", "পেমেন্টের বিবরণ")}
        </h4>
        {(p.payments?.length
          ? p.payments
          : [{ method: p.method, amount: p.paid }]
        ).map((payment, i) => (
          <div key={i} className="flex justify-between gap-2">
            <span>
              {documentMethod(language, payment.method)}
              {payment.account ? ` · ${payment.account}` : ""}
            </span>
            <span>৳{n(payment.amount)}</span>
          </div>
        ))}
      </section>
    ) : null,
    notes: (
      <section className="space-y-2 whitespace-pre-wrap break-words text-xs">
        {d.note && (
          <p>
            {label("Notes", "নোট")}: {d.note}
          </p>
        )}
        {d.terms && (
          <p>
            {label("Terms & conditions", "শর্তাবলী")}: {d.terms}
          </p>
        )}
        {d.message && <p>{d.message}</p>}
      </section>
    ),
    signatures: d.showSignatures ? (
      <section className="mt-8 flex justify-between gap-8 pt-5 text-xs">
        <span className="border-t border-slate-400 pt-2">
          {label("Customer signature", "ক্রেতার স্বাক্ষর")}
        </span>
        <span className="border-t border-slate-400 pt-2">
          {label("Seller signature", "বিক্রেতার স্বাক্ষর")}
        </span>
      </section>
    ) : null,
    footer: (
      <footer className="whitespace-pre-wrap text-center text-xs">
        {language === "English" && d.footer === invoiceDesignDefaults().footer ? "Thank you. Please visit again." : d.footer || p.branding?.footer}
      </footer>
    ),
  };
  return (
    <article
      data-invoice-template={d.template}
      data-invoice-paper={d.paper}
      lang={bn ? "bn" : "en"}
      className={`invoice-document theme-light mx-auto space-y-4 bg-white p-5 text-[#0b1a2c] ${d.template === "Classic" ? "invoice-classic" : d.template === "Compact" ? "invoice-compact" : ""}`}
      style={{
        width: thermal ? (d.paper === "58 mm" ? "54mm" : "76mm") : "100%",
        maxWidth: thermal
          ? undefined
          : d.orientation === "Landscape"
            ? "297mm"
            : "210mm",
        paddingTop: d.paper === "Business Pad" ? `${d.topOffset}mm` : undefined,
        fontSize: d.template === "Compact" ? 11 : 13,
        fontFamily: "Geist, 'Hind Siliguri', sans-serif",
      }}
    >
      {p.reconstructed && (
        <p className="border-b border-slate-200 pb-2 text-[10px]">
          {label(
            "Reconstructed copy — original design unavailable",
            "পুনর্গঠিত কপি — মূল ডিজাইন সংরক্ষিত নেই",
          )}
        </p>
      )}
      {d.sections.map((section) => (
        <div key={section} data-invoice-section={section}>
          {sections[section]}
        </div>
      ))}
      {bn && p.lines.some((l) => !l.nameBn) && (
        <p className="invoice-translation-note text-[10px]">
          কিছু পণ্যের বাংলা নাম নেই; সংরক্ষিত নাম দেখানো হয়েছে।
        </p>
      )}
    </article>
  );
}
