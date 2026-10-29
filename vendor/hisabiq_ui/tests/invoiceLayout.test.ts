import test from "node:test";
import assert from "node:assert/strict";
import {
  invoicePageCss,
  invoiceDesignDefaults,
} from "../src/documents/profile.ts";
test("Business Pad offset is applied to document once, never to both wrapper and document", () => {
  const css = invoicePageCss({
    ...invoiceDesignDefaults(),
    paper: "Business Pad",
    topOffset: 35,
  });
  assert(!css.includes("#document-receipt{padding-top"));
  assert(css.includes(".invoice-document{padding-top:35mm}"));
});
