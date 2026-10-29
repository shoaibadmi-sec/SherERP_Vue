export interface OutputProfile {
  language: "English" | "English + Bangla" | "Bangla";
  orientation: "Portrait" | "Landscape";
  margin: number;
  showBusiness: boolean;
  showSignatures: boolean;
  footer: string;
}
export function outputProfileDefaults(
  kind: "ledger" | "report",
): OutputProfile {
  return {
    language: "English + Bangla",
    orientation: kind === "report" ? "Landscape" : "Portrait",
    margin: 12,
    showBusiness: true,
    showSignatures: false,
    footer: "",
  };
}
export function validateOutputProfile(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as OutputProfile;
  return (
    ["English", "English + Bangla", "Bangla"].includes(p.language) &&
    ["Portrait", "Landscape"].includes(p.orientation) &&
    Number.isFinite(p.margin) &&
    p.margin >= 2 &&
    p.margin <= 30 &&
    typeof p.showBusiness === "boolean" &&
    typeof p.showSignatures === "boolean" &&
    typeof p.footer === "string" &&
    p.footer.length <= 2000
  );
}
