export type Actor = { kind: "staff" | "tenant"; id: string; tenantId?: string };
export type Permission = `${string}.${string}`;
export type Role = {
  id: string;
  name: string;
  permissions: Permission[];
  version: number;
};
export type Assignment = {
  staffId: string;
  roleId: string;
  tenantIds: "all" | string[];
};
export type Staff = {
  id: string;
  name: string;
  email: string;
  status: string;
  owner: boolean;
  version: number;
  sessionVersion: number;
};
export type Tenant = {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  status: string;
  version: number;
  invitation: string;
};
export type Plan = {
  id: string;
  name: string;
  price: number;
  yearly: number;
  sms: number;
  users: number;
  features: string;
  status: string;
  version: number;
};
export type Subscription = {
  id: string;
  tenantId: string;
  planId: string;
  planName: string;
  price: number;
  status: string;
  renewal: string;
  scheduled: string;
  version: number;
};
export type Invoice = {
  id: string;
  tenantId: string;
  description: string;
  amount: number;
  due: string;
  status: string;
  purpose: "subscription" | "sms" | "service" | "other";
  units: number;
  sourceId: string;
  fulfilled: boolean;
  validDays?: number;
  version: number;
};
export type Attachment = { name: string; data: string; type: string };
export type Payment = {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: string;
  account: string;
  reference: string;
  status: string;
  createdBy: string;
  reviewer: string;
  reason: string;
  evidence?: Attachment;
  version: number;
};
export type Receipt = {
  id: string;
  paymentId: string;
  tenantId: string;
  amount: number;
  date: string;
};
export type Allocation = {
  id: string;
  receiptId: string;
  invoiceId: string;
  tenantId: string;
  amount: number;
};
export type Adjustment = {
  id: string;
  receiptId: string;
  tenantId: string;
  amount: number;
  reason: string;
  kind: "Refund" | "Reversal";
  date: string;
};
export type Credit = {
  id: string;
  tenantId: string;
  units: number;
  source: string;
  expires: string;
  messageId?: string;
};
export type SmsMessage = {
  id: string;
  tenantId: string;
  recipient: string;
  text: string;
  units: number;
  status: string;
  version: number;
};
export type SmsPackage = {
  id: string;
  name: string;
  units: number;
  price: number;
  days: number;
  version: number;
};
export type Service = {
  id: string;
  name: string;
  price: number;
  recurring: boolean;
  version: number;
};
export type Order = {
  id: string;
  tenantId: string;
  serviceId: string;
  name: string;
  price: number;
  status: string;
  assignee: string;
  due: string;
  deliverable: string;
  version: number;
};
export type Ticket = {
  id: string;
  tenantId: string;
  subject: string;
  priority: string;
  category: string;
  status: string;
  assignee: string;
  due: string;
  linked: string;
  version: number;
};
export type Reply = {
  id: string;
  ticketId: string;
  tenantId: string;
  author: string;
  text: string;
  internal: boolean;
  date: string;
  attachment?: Attachment;
};
export type Article = {
  id: string;
  title: string;
  body: string;
  audience: string;
  status: string;
  version: number;
};
export type Grant = {
  id: string;
  tenantId: string;
  staffId: string;
  reason: string;
  scope: string;
  expires: string;
  status: string;
  version: number;
};
export type Announcement = {
  id: string;
  title: string;
  body: string;
  tenantIds: string[];
  channel: string;
  scheduled: string;
  status: string;
  version: number;
};
export type Audit = {
  id: string;
  actor: string;
  action: string;
  target: string;
  tenantId: string;
  date: string;
  reason: string;
  before: string;
  after: string;
};
export type SaasState = {
  version: 1;
  tenants: Tenant[];
  staff: Staff[];
  roles: Role[];
  assignments: Assignment[];
  plans: Plan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  payments: Payment[];
  receipts: Receipt[];
  allocations: Allocation[];
  adjustments: Adjustment[];
  credits: Credit[];
  sms: SmsMessage[];
  packages: SmsPackage[];
  templates: { id: string; name: string; text: string; version: number }[];
  services: Service[];
  orders: Order[];
  tickets: Ticket[];
  replies: Reply[];
  articles: Article[];
  grants: Grant[];
  announcements: Announcement[];
  audit: Audit[];
  completed: string[];
  settings: {
    timezone: string;
    currency: string;
    grace: number;
    releaseFailed: boolean;
    collectionAccount: string;
  };
};
export type SaasCommand = {
  id: string;
  type: string;
  target?: string;
  expectedVersion?: number;
  data: Record<string, unknown>;
};
export type CommandResult =
  { ok: true; state: SaasState } | { ok: false; error: string };
