export const moduleViewCatalog = {
  sales: {
    label: "Sales",
    key: "hisabiq-sales-visible-columns",
    essential: ["invoice", "customer", "total", "paid", "due"],
    columns: [
      "invoice",
      "customer",
      "items",
      "total",
      "profit",
      "paid",
      "due",
      "payment",
      "status",
    ],
  },
  products: {
    label: "Products",
    key: "hisabiq-products-visible-columns",
    essential: ["product", "stock", "selling"],
    columns: [
      "index",
      "product",
      "category",
      "stock",
      "stockValue",
      "unit",
      "purchase",
      "selling",
      "status",
    ],
  },
} as const;
export type ViewModule = keyof typeof moduleViewCatalog;
export type ModuleViews = {
  sales: Record<string, boolean>;
  products: Record<string, boolean>;
};
export const moduleViewDefaults = (): ModuleViews => ({
  sales: {},
  products: {},
});
export function resolveModuleColumns(
  module: ViewModule,
  defaults: Record<string, boolean>,
  business: Record<string, boolean>,
  personal: Record<string, boolean>,
): Record<string, boolean> {
  const def = moduleViewCatalog[module];
  return Object.fromEntries(
    def.columns.map((k) => [
      k,
      (def.essential as readonly string[]).includes(k)
        ? true
        : (personal[k] ?? business[k] ?? defaults[k] ?? true),
    ]),
  );
}
export function validModuleViews(value: unknown): value is ModuleViews {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!("sales" in value) || !("products" in value)) return false;
  return Object.entries(value).every(
    ([key, columns]) =>
      key in moduleViewCatalog &&
      !!columns &&
      typeof columns === "object" &&
      !Array.isArray(columns) &&
      Object.entries(columns).every(
        ([k, v]) =>
          (
            moduleViewCatalog[key as ViewModule].columns as readonly string[]
          ).includes(k) && typeof v === "boolean",
      ),
  );
}
