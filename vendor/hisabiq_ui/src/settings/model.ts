import {moduleViewDefaults,validModuleViews,type ModuleViews} from './moduleViews.ts';
import {outputProfileDefaults,validateOutputProfile,type OutputProfile} from '../documents/outputProfile.ts';
import {invoiceDesignDefaults,validateInvoiceDesign,type InvoiceDesign} from '../documents/profile.ts';
import {financialDefaults,validateFinancialDisplay,type FinancialDisplay} from '../financial-display/model.ts';
import {permissionCatalogue,validateRoleChange,effectivePermissions,type RbacPermission} from './rbac.ts';
export type SettingsMode = "Simple" | "Advanced";
export type SettingsSection =
  | "business"
  | "sales"
  | "products"
  | "purchases"
  | "money"
  | "invoices"
  | "team"
  | "notifications"
  | "personal"
  | "data"
  | "security"
  | "financialTerminology"
  | "interface";
export type BusinessSection = Exclude<SettingsSection, "personal" | "data" | "security">;
export type SettingsPermission = "view" | BusinessSection | "export" | "import" | RbacPermission;
export interface BusinessSettings {
  name: string;
  nameBn: string;
  phone: string;
  email: string;
  address: string;
  logo: string;
  website: string;
  financialYear: string;
  registration: string;
}
export interface SalesSettings {
  barcode: boolean;
  customerPhone: boolean;
  guardian: boolean;
  address: boolean;
  defaultPayment: "Cash" | "Bank" | "bKash" | "Nagad";
  rounding: "Nearest ৳5" | "Nearest ৳1" | "No rounding";
  shortage: "Ask every time" | "Own stock";
  priceOverride: "Owner only" | "Authorized employee";
  discountLimit: number;
  returnDays: number;
}
export interface ProductSettings {
  lowStock: boolean;
  defaultUnit: string;
  priceEntry: "Selected unit" | "Base unit";
  openingUnit: "Stock view unit" | "Base unit";
  minimumUnit: "Stock view unit" | "Base unit";
  allocation: "FIFO" | "FEFO";
  serial: "Off" | "Optional" | "Required";
  warranty: boolean;
  warrantyMonths: number;
  expiry: boolean;
  expiryDays: number;
}
export interface PurchaseSettings {
  memo: boolean;
  attachments: boolean;
  defaultAccount: string;
  approval: boolean;
  backdateDays: number;
  costAllocation: "By value" | "By quantity";
}
export interface MoneySettings {
  defaultCash: string;
  defaultBank: string;
  defaultMobile: string;
  cashSession: boolean;
  closeCount: boolean;
  adjustment: "Owner only" | "Authorized employee";
  lockDate: string;
}
export interface InvoiceSettings {
  profiles?:{ledger:OutputProfile;report:OutputProfile};
  design?: InvoiceDesign;
  paper: "A4" | "80 mm" | "58 mm";
  showLogo: boolean;
  showBangla: boolean;
  footer: string;
  prefix: string;
  showSerial: boolean;
  showWarranty: boolean;
  showPurchaseCost: boolean;
  copies: number;
}
export interface NotificationSettings {
  lowStock: boolean;
  expiry: boolean;
  dues: boolean;
  channel: "In-app only" | "In-app + SMS";
  recipients: string;
  time: string;
  expiryDays: number;
  dueDays: number;
  smsTemplate: string;
}
export interface BusinessRole {
  id: string;
  name: string;
  permissions: SettingsPermission[];
}
export interface BusinessEmployee {
  id: string;
  name: string;
  email: string;
  joinedDate?: string;
  roleIds: string[];
  active: boolean;
}
export interface TeamSettings {
  roles: BusinessRole[];
  employees: BusinessEmployee[];
}
export interface SettingsSections {
  interface:ModuleViews;
  financialTerminology: FinancialDisplay;
  business: BusinessSettings;
  sales: SalesSettings;
  products: ProductSettings;
  purchases: PurchaseSettings;
  money: MoneySettings;
  invoices: InvoiceSettings;
  team: TeamSettings;
  notifications: NotificationSettings;
}
export interface SettingsEvent {
  id: string;
  at: string;
  actor: string;
  section: string;
  changes: string[];
  before?:Record<string,unknown>;
  after?:Record<string,unknown>;
}
export interface TenantSettings {
  schema: 1;
  tenantId: string;
  revision: number;
  sections: SettingsSections;
  events: SettingsEvent[];
}
export interface PersonalSettings {
  mode: SettingsMode;
  language: "English + Bangla" | "English" | "Bangla";
  density: "Compact" | "Comfortable";
  terminology: "simple" | "accounting";
  dateView: "transaction" | "created";
  searchMode: "Default" | "Advanced";
}
export const currentBusinessId = "t1"; // UI fixture; replace with the authenticated business session later.
export const settingsKey = (tenantId: string) =>
  `hisabiq-erp-settings-v1:${tenantId}`;
export const personalKey = "hisabiq-erp-personal-v1";
export const permissions: SettingsPermission[] = [
  "view",
  "business",
  "sales",
  "products",
  "purchases",
  "money",
  "invoices",
  "team",
  "notifications",
  "export",
  "import",
  "financialTerminology",
  "interface",
  ...permissionCatalogue.map(p=>p.code),
];
export const personalDefaults: PersonalSettings = {
  mode: "Simple",
  language: "English + Bangla",
  density: "Compact",
  terminology: "simple",
  dateView: "transaction",
  searchMode: "Default",
};
export function defaults(tenantId = currentBusinessId): TenantSettings {
  return {
    schema: 1,
    tenantId,
    revision: 0,
    sections: {
      financialTerminology:financialDefaults(),
      interface:moduleViewDefaults(),
      business: {
        name: tenantId === "t1" ? "Nawabpur Hardware House" : "Demo business",
        nameBn: "নবাবপুর হার্ডওয়্যার হাউস",
        phone: "01711-234567",
        email: "nawabpur@example.com",
        address: "Nawabpur Road, Dhaka",
        logo: "",
        website: "",
        financialYear: "January–December",
        registration: "",
      },
      sales: {
        barcode: true,
        customerPhone: true,
        guardian: true,
        address: true,
        defaultPayment: "Cash",
        rounding: "Nearest ৳5",
        shortage: "Ask every time",
        priceOverride: "Authorized employee",
        discountLimit: 100,
        returnDays: 30,
      },
      products: {
        lowStock: true,
        defaultUnit: "Gira",
        priceEntry: "Selected unit",
        openingUnit: "Stock view unit",
        minimumUnit: "Stock view unit",
        allocation: "FIFO",
        serial: "Off",
        warranty: false,
        warrantyMonths: 12,
        expiry: false,
        expiryDays: 30,
      },
      purchases: {
        memo: true,
        attachments: true,
        defaultAccount: "Cash counter",
        approval: false,
        backdateDays: 30,
        costAllocation: "By value",
      },
      money: {
        defaultCash: "Cash counter",
        defaultBank: "Dutch-Bangla Bank · 4582",
        defaultMobile: "bKash Business · 01711•••412",
        cashSession: true,
        closeCount: true,
        adjustment: "Owner only",
        lockDate: "",
      },
      invoices: {
        design:invoiceDesignDefaults(),
        profiles:{ledger:outputProfileDefaults("ledger"),report:outputProfileDefaults("report")},
        paper: "A4",
        showLogo: true,
        showBangla: true,
        footer: "Thank you for your business.",
        prefix: "INV",
        showSerial: true,
        showWarranty: true,
        showPurchaseCost: false,
        copies: 1,
      },
      notifications: {
        lowStock: true,
        expiry: true,
        dues: true,
        channel: "In-app only",
        recipients: "Owner",
        time: "09:00",
        expiryDays: 30,
        dueDays: 7,
        smsTemplate:
          "Dear customer, your payment is due. Please contact our business. Thank you.",
      },
      team: {
        roles: [
          {
            id: "owner",
            name: "Business owner",
            permissions: [...permissions],
          },
          {
            id: "manager",
            name: "Manager",
            permissions: [
              "view",
              "sales",
              "products",
              "purchases",
              "invoices",
              "notifications",
              "export",
            ],
          },
          { id: "cashier", name: "Cashier", permissions: ["view"] },
          { id: "storekeeper", name: "Storekeeper", permissions: ["view"] },
          { id: "viewer", name: "Viewer", permissions: ["view"] },
          {
            id: "accountant",
            name: "Accountant",
            permissions: ["view", "money", "export"],
          },
        ],
        employees: [
          {
            id: "mahmud",
            name: "Mahmud Hasan",
            email: "mahmud@example.com",
            roleIds: ["owner"],
            active: true,
          },
          {
            id: "rafiq",
            name: "Rafiq Islam",
            email: "rafiq@example.com",
            roleIds: ["cashier", "accountant"],
            active: true,
          },
          {
            id: "nusrat",
            name: "Nusrat Jahan",
            email: "nusrat@example.com",
            roleIds: ["manager"],
            active: true,
          },
        ],
      },
    },
    events: [],
  };
}
export function canManage(
  state: TenantSettings,
  employeeId: string,
  permission: SettingsPermission,
): boolean {
  const employee = state.sections.team.employees.find(
    (e) => e.id === employeeId,
  );
  if (permission === "import" && !employee?.roleIds.includes("owner"))
    return false;
  if(!employee?.active)return false;
  const held=effectivePermissions(state.sections.team,employeeId);
  if(held.includes(permission))return true;
  if(permission==='view')return held.includes('settings.setting.view');
  if(permission==='team')return ['user.account.create','user.account.edit','user.account.disable','user.role.manage'].some(p=>held.includes(p as SettingsPermission));
  if(['business','sales','products','purchases','money','invoices','notifications','financialTerminology','interface'].includes(permission))return held.includes('settings.setting.edit');
  return false;
}
const plain = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function validateSection<K extends BusinessSection>(
  section: K,
  value: unknown,
): string | null {
  if (!plain(value)) return "Invalid settings section.";
  if(section==="interface")return validModuleViews(value)?null:"Invalid module view preferences.";
  if(section==="financialTerminology") return validateFinancialDisplay(value);
  if(section==="invoices"&&value.profiles!==undefined&&(!plain(value.profiles)||!validateOutputProfile(value.profiles.ledger)||!validateOutputProfile(value.profiles.report)))return "Invalid ledger/report print profile.";
  if(section==="invoices" && value.design!==undefined){const error=validateInvoiceDesign(value.design);if(error)return error;}
  if (section === "team") {
    if (
      !Array.isArray(value.roles) ||
      !Array.isArray(value.employees) ||
      value.roles.length > 40 ||
      value.employees.length > 100
    )
      return "Invalid employee or role list.";
    const roles = value.roles as BusinessRole[],
      employees = value.employees as BusinessEmployee[];
    if (
      roles.some(
        (r) =>
          !plain(r) ||
          typeof r.id !== "string" ||
          typeof r.name !== "string" ||
          !r.name.trim() ||
          !Array.isArray(r.permissions) ||
          r.permissions.some((p) => !permissions.includes(p)),
      )
    )
      return "A role needs a name and valid permissions.";
    if (
      new Set(roles.map((r) => r.id)).size !== roles.length ||
      new Set(roles.map((r) => r.name.trim().toLowerCase())).size !==
        roles.length
    )
      return "Role names and IDs must be unique.";
    const owner = roles.find((r) => r.id === "owner");
    if (
      !owner ||
      !owner.name.trim() ||
      permissions.some((p) => !(owner.permissions as unknown[]).includes(p))
    )
      return "The business owner role is protected.";
    if (
      employees.some(
        (e) =>
          !plain(e) ||
          typeof e.id !== "string" ||
          typeof e.name !== "string" ||
          !e.name.trim() ||
          typeof e.email !== "string" ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email) ||
          (e.joinedDate !== undefined && e.joinedDate !== "" &&
            (typeof e.joinedDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(e.joinedDate) ||
              Number.isNaN(Date.parse(e.joinedDate)) || new Date(e.joinedDate).toISOString().slice(0, 10) !== e.joinedDate)) ||
          typeof e.active !== "boolean" ||
          !Array.isArray(e.roleIds) ||
          !e.roleIds.length ||
          e.roleIds.some((id) => !roles.some((r) => r.id === id)),
      )
    )
      return "Each employee needs a valid email, joined date (if entered) and at least one existing role.";
    if (
      new Set(employees.map((e) => e.id)).size !== employees.length ||
      new Set(employees.map((e) => e.email.trim().toLowerCase())).size !==
        employees.length
    )
      return "Employee emails and IDs must be unique.";
    if (!employees.some((e) => e.active && e.roleIds.includes("owner")))
      return "Keep at least one active business owner.";
    return null;
  }
  const baseline = defaults().sections[section] as unknown as Record<
    string,
    unknown
  >;
  for (const [key, expected] of Object.entries(baseline)) {
    const v = value[key];
    if (
      typeof v !== typeof expected ||
      (typeof v === "number" && (!Number.isFinite(v) || v < 0)) ||
      (typeof v === "string" && v.length > (key === "logo" ? 400000 : 2000))
    )
      return `Invalid value for ${key}.`;
  }
  const enums: Record<string, string[]> = {
    financialYear: ["January–December", "July–June"],
    defaultPayment: ["Cash", "Bank", "bKash", "Nagad"],
    rounding: ["Nearest ৳5", "Nearest ৳1", "No rounding"],
    shortage: ["Ask every time", "Own stock"],
    priceOverride: ["Owner only", "Authorized employee"],
    defaultUnit: ["Pcs", "Gira", "Kg", "Ft", "Bag", "Coil", "Pair", "L"],
    priceEntry: ["Selected unit", "Base unit"],
    openingUnit: ["Stock view unit", "Base unit"],
    minimumUnit: ["Stock view unit", "Base unit"],
    allocation: ["FIFO", "FEFO"],
    serial: ["Off", "Optional", "Required"],
    costAllocation: ["By value", "By quantity"],
    adjustment: ["Owner only", "Authorized employee"],
    paper: ["A4", "80 mm", "58 mm"],
    channel: ["In-app only", "In-app + SMS"],
  };
  for (const [k, list] of Object.entries(enums))
    if (k in value && !list.includes(value[k] as string))
      return `Choose a valid ${k}.`;
  if (section === "business") {
    if (!(value.name as string).trim()) return "Business name is required.";
    if (
      value.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email as string)
    )
      return "Enter a valid business email.";
    if (value.website && !/^https?:\/\/[^\s]+$/.test(value.website as string))
      return "Website must start with https:// or http://.";
    if (
      value.logo &&
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
        value.logo as string,
      )
    )
      return "Use a PNG, JPEG or WebP logo.";
  }
  if (
    section === "sales" &&
    ((value.discountLimit as number) > 100 ||
      !Number.isInteger(value.returnDays))
  )
    return "Discount must be 0–100%; return days must be a whole number.";
  if (
    section === "products" &&
    (!Number.isInteger(value.expiryDays) ||
      (value.warrantyMonths as number) < 1 ||
      !Number.isInteger(value.warrantyMonths))
  )
    return "Use whole warning days and at least one warranty month.";
  if (
    section === "invoices" &&
    (!/^[A-Z0-9-]{1,12}$/.test(value.prefix as string) ||
      !Number.isInteger(value.copies) ||
      (value.copies as number) < 1 ||
      (value.copies as number) > 5)
  )
    return "Use a 1–12 character uppercase prefix and 1–5 copies.";
  if (
    section === "money" &&
    value.lockDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(value.lockDate as string) ||
      Number.isNaN(Date.parse(value.lockDate as string)) ||
      new Date(value.lockDate as string).toISOString().slice(0, 10) !==
        value.lockDate)
  )
    return "Enter a valid posting lock date.";
  if (
    section === "notifications" &&
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time as string)
  )
    return "Choose a valid notification time.";
  return null;
}
export function validPersonal(v: unknown): v is PersonalSettings {
  if (!plain(v)) return false;
  return (
    ["Simple", "Advanced"].includes(v.mode as string) &&
    ["English + Bangla", "English", "Bangla"].includes(v.language as string) &&
    ["Compact", "Comfortable"].includes(v.density as string) &&
    ["simple", "accounting"].includes(v.terminology as string) &&
    ["transaction", "created"].includes(v.dateView as string) &&
    (v.searchMode === undefined || ["Default", "Advanced"].includes(v.searchMode as string))
  );
}
export function parseSettings(
  raw: string | null,
  tenantId: string,
): { state: TenantSettings; recovered: boolean } {
  if (!raw) return { state: defaults(tenantId), recovered: false };
  try {
    const v = JSON.parse(raw);
    if(plain(v)&&plain(v.sections)){
      if(plain(v.sections.team)&&Array.isArray(v.sections.team.roles)){
        const owner=v.sections.team.roles.find((r:unknown)=>plain(r)&&r.id==='owner');
        if(plain(owner)&&Array.isArray(owner.permissions)&&owner.permissions.every((p:unknown)=>typeof p==='string')&&['view','business','sales','products','purchases','money','invoices','team','notifications','export','import'].every(p=>(owner.permissions as unknown[]).includes(p))){owner.permissions=[...new Set([...owner.permissions,...permissions])];}
      }
      if(v.sections.interface===undefined)v.sections.interface=moduleViewDefaults();
      if(v.sections.financialTerminology===undefined)v.sections.financialTerminology=financialDefaults();
      if(plain(v.sections.invoices)&&v.sections.invoices.profiles===undefined)v.sections.invoices.profiles={ledger:outputProfileDefaults("ledger"),report:outputProfileDefaults("report")};
      if(plain(v.sections.invoices)&&v.sections.invoices.design===undefined){const old=v.sections.invoices;v.sections.invoices.design={...invoiceDesignDefaults(),paper:old.paper,language:old.showBangla?"English + Bangla":"English",showLogo:old.showLogo,showSerial:old.showSerial,showWarranty:old.showWarranty,footer:old.footer};}
    }
    if (
      !plain(v) ||
      v.schema !== 1 ||
      v.tenantId !== tenantId ||
      !Number.isInteger(v.revision) ||
      (v.revision as number) < 0 ||
      !plain(v.sections) ||
      Object.keys(defaults().sections).some((k) =>
        validateSection(
          k as BusinessSection,
          (v.sections as Record<string, unknown>)[k],
        ),
      ) ||
      !Array.isArray(v.events) ||
      v.events.some(
        (e) =>
          !plain(e) ||
          typeof e.id !== "string" ||
          typeof e.at !== "string" ||
          Number.isNaN(Date.parse(e.at)) ||
          typeof e.actor !== "string" ||
          typeof e.section !== "string" ||
          !Array.isArray(e.changes) ||
          e.changes.some((k) => typeof k !== "string"),
      )
    )
      throw Error("Invalid saved settings");
    return { state: v as unknown as TenantSettings, recovered: false };
  } catch {
    return { state: defaults(tenantId), recovered: true };
  }
}
export function saveSection<K extends BusinessSection>(
  state: TenantSettings,
  employeeId: string,
  section: K,
  value: SettingsSections[K],
  expectedRevision: number,
  now: string,
) {
  if (!canManage(state, employeeId, section))
    return {
      ok: false as const,
      error: "You do not have permission to change this section.",
    };
  if (state.revision !== expectedRevision)
    return {
      ok: false as const,
      error:
        "Settings changed since you opened this form. Discard to load the latest values.",
    };
  const error = validateSection(section, value);
  if (error) return { ok: false as const, error };
  if (
    section === "team" &&
    !state.sections.team.employees
      .find((e) => e.id === employeeId)
      ?.roleIds.includes("owner")
  ) {
    const ownerIds = (team: TeamSettings) =>
      team.employees
        .filter((e) => e.roleIds.includes("owner"))
        .map((e) => e.id)
        .sort();
    if (
      JSON.stringify(ownerIds(state.sections.team)) !==
      JSON.stringify(ownerIds(value as TeamSettings))
    )
      return {
        ok: false as const,
        error: "Only a business owner can change owner assignments.",
      };
  }
  if(section === "team"){
    const team=value as TeamSettings;
    for(const role of team.roles.filter(r=>JSON.stringify(r)!==JSON.stringify(state.sections.team.roles.find(old=>old.id===r.id)))){const error=validateRoleChange(state.sections.team,role,employeeId);if(error)return {ok:false as const,error};}
    const held=effectivePermissions(state.sections.team,employeeId);
    for(const member of team.employees){
      const old=state.sections.team.employees.find(e=>e.id===member.id);
      if(!old&&!held.includes('user.account.create'))return {ok:false as const,error:'You cannot create users.'};
      if(old&&old.active!==member.active&&!held.includes('user.account.disable'))return {ok:false as const,error:'You cannot disable or reactivate users.'};
      if(old&&JSON.stringify({...old,active:member.active})!==JSON.stringify(member)&&!held.includes('user.account.edit'))return {ok:false as const,error:'You cannot edit users.'};
      const owner=state.sections.team.employees.find(e=>e.id===employeeId)?.roleIds.includes('owner');
      if(!owner&&member.roleIds.filter(id=>!old?.roleIds.includes(id)).some(id=>team.roles.find(r=>r.id===id)?.permissions.some(p=>!held.includes(p))))return {ok:false as const,error:'You cannot assign authority beyond your delegated permissions.'};
    }
    if(state.sections.team.employees.some(e=>!team.employees.some(next=>next.id===e.id)))return {ok:false as const,error:'Disable an employee instead of deleting their identity.'};
    for(const role of state.sections.team.roles.filter(r=>!team.roles.some(next=>next.id===r.id))){const error=validateRoleChange(state.sections.team,null,employeeId,role.id);if(error)return {ok:false as const,error};}
  }
  const current = state.sections[section] as unknown as Record<string, unknown>;
  const changes = Object.keys(current).filter(
    (k) =>
      JSON.stringify(current[k]) !==
      JSON.stringify((value as unknown as Record<string, unknown>)[k]),
  );
  if (!changes.length) return { ok: true as const, state };
  const next = structuredClone(state);
  next.sections[section] = structuredClone(value);
  next.revision++;
  next.events.unshift({
    id: `${next.revision}-${now}`,
    at: now,
    actor: state.sections.team.employees.find((e) => e.id === employeeId)!.name,
    section,
    changes,
    before:Object.fromEntries(changes.map(k=>[k,structuredClone(current[k])])),
    after:Object.fromEntries(changes.map(k=>[k,structuredClone((value as unknown as Record<string,unknown>)[k])])),
  });
  next.events = next.events.slice(0, 100);
  return { ok: true as const, state: next };
}
export function roundInvoice(net: number, setting: SalesSettings["rounding"]) {
  const step = setting === "Nearest ৳5" ? 5 : setting === "Nearest ৳1" ? 1 : 0;
  return step ? Math.round(net / step) * step : Math.round(net * 100) / 100;
}
