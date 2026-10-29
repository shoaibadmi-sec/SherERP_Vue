/*
 * Coverage claims, read by `pnpm test:inventory` (owner request 2026-09-03).
 *
 * @covers dialog:stock-adjust
 * @covers dialog:cancel-document
 * @covers dialog:record-expense
 * @covers dialog:receive-payment
 * @covers dialog:pay-supplier
 * @covers dialog:change-transaction-date
 */
import { flushPromises, mount } from '@vue/test-utils';
import InputNumber from 'primevue/inputnumber';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProductResponse } from '@sher/core-contracts';

import { ApiError } from '../src/api/client';
import { useSession } from '../src/auth/session';
import CancelDocumentDialog from '../src/components/CancelDocumentDialog.vue';
import ChangeTransactionDateDialog from '../src/components/corrections/ChangeTransactionDateDialog.vue';
import DateOnlyPicker from '../src/components/DateOnlyPicker.vue';
import AmountInput from '../src/components/fields/AmountInput.vue';
import RecordExpenseDialog from '../src/components/money/RecordExpenseDialog.vue';
import PaySupplierDialog from '../src/components/purchasing/PaySupplierDialog.vue';
import ReceivePaymentDialog from '../src/components/sales/ReceivePaymentDialog.vue';
import StockAdjustDialog from '../src/components/StockAdjustDialog.vue';

/**
 * UI-44 for the one-task dialogs — the modals the owner's rule makes the whole
 * interaction surface for editing, paying, returning and correcting.
 *
 * Six dialogs, no page between them and the ledger. They had no component test
 * of any kind: a template that failed to parse, a label that stopped naming its
 * box, or a Save that posted with a required field blank would all have passed
 * lint, typecheck and every other suite, because nothing mounted them.
 *
 * Every field here is found the way a person finds it — by the words printed
 * beside it — and never by a class name. A test that reaches for `.field input`
 * keeps passing after the label is deleted, which is exactly the defect it was
 * supposed to catch (owner rule: labels are for the shopkeeper, not decoration).
 */

// ---------------------------------------------------------------------------
// The API surface these dialogs post through. Mocked per module, not per call,
// so a dialog that starts reaching for a seventh endpoint fails loudly here.
// ---------------------------------------------------------------------------
const adjustStock = vi.fn();
const recordExpense = vi.fn();
const correctExpense = vi.fn();
const fetchAccounts = vi.fn();
const fetchDayStatus = vi.fn();
const fetchParties = vi.fn();
const fetchCustomerStanding = vi.fn();
const receiveCustomerPayment = vi.fn();
const fetchSupplierDue = vi.fn();
const paySupplier = vi.fn();
const fetchTransactionDateContext = vi.fn();
const changeTransactionDate = vi.fn();

vi.mock('../src/api/inventory', () => ({ adjustStock: (...args: unknown[]) => adjustStock(...args) }));
vi.mock('../src/api/expenses', () => ({
  recordExpense: (...args: unknown[]) => recordExpense(...args),
  correctExpense: (...args: unknown[]) => correctExpense(...args),
}));
vi.mock('../src/api/money', () => ({
  fetchAccounts: (...args: unknown[]) => fetchAccounts(...args),
  fetchDayStatus: (...args: unknown[]) => fetchDayStatus(...args),
}));
vi.mock('../src/api/parties', () => ({ fetchParties: (...args: unknown[]) => fetchParties(...args) }));
vi.mock('../src/api/sales', () => ({
  fetchCustomerStanding: (...args: unknown[]) => fetchCustomerStanding(...args),
  receiveCustomerPayment: (...args: unknown[]) => receiveCustomerPayment(...args),
}));
vi.mock('../src/api/purchasing', () => ({
  fetchSupplierDue: (...args: unknown[]) => fetchSupplierDue(...args),
  paySupplier: (...args: unknown[]) => paySupplier(...args),
}));
vi.mock('../src/api/corrections', () => ({
  fetchTransactionDateContext: (...args: unknown[]) => fetchTransactionDateContext(...args),
  changeTransactionDate: (...args: unknown[]) => changeTransactionDate(...args),
}));

// The day-start rescue path is its own dialog with its own behaviour; mounting
// it here would drag its calls into six suites that are not about it (R-E12).
vi.mock('../src/components/money/StartDayDialog.vue', () => ({
  default: { name: 'StartDayDialog', template: '<div />' },
}));

// ---------------------------------------------------------------------------
// Accessible queries.
//
// PrimeVue's overlays teleport to `<body>`, so every mount stubs `teleport` and
// renders in place; the helpers below then read the document the way assistive
// technology would — a `<label for>` resolved to the control carrying that id,
// or a wrapping `<label>` resolved to the control inside it.
// ---------------------------------------------------------------------------
const MOUNT_OPTIONS = { global: { stubs: { teleport: true } }, attachTo: document.body } as const;

/** Every control a label can legitimately be naming, PrimeVue's included. */
const CONTROL = 'input, textarea, select, [role="combobox"], [role="spinbutton"], [role="listbox"]';

function squash(text: string | null): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * The control a shopkeeper reaches after reading `text` on the screen.
 *
 * Throws with the labels that *are* on screen when there is no match, because
 * "expected undefined to be truthy" tells nobody which label went missing.
 */
function fieldByLabel(text: string): HTMLElement {
  const labels = [...document.body.querySelectorAll('label')];
  const label = labels.find((candidate) => squash(candidate.textContent).startsWith(text));
  if (label === undefined) {
    throw new Error(
      `No label starting "${text}". On screen: ${labels.map((l) => `"${squash(l.textContent)}"`).join(', ')}`,
    );
  }

  const target = label.getAttribute('for');
  const control =
    target === null
      ? label.querySelector<HTMLElement>(CONTROL)
      : document.getElementById(target);

  if (control === null || control === undefined) {
    throw new Error(`The label "${squash(label.textContent)}" names no control`);
  }
  return control;
}

/** A button by the words on it — its label, or its accessible name. */
function buttonByName(name: string): HTMLElement {
  const buttons = [...document.body.querySelectorAll('button')];
  const found = buttons.find(
    (button) => squash(button.textContent) === name || button.getAttribute('aria-label') === name,
  );
  if (found === undefined) {
    throw new Error(
      `No button named "${name}". On screen: ${buttons.map((b) => `"${squash(b.textContent)}"`).join(', ')}`,
    );
  }
  return found;
}

/** Open the dropdown named by `label` and read back what it offers. */
async function optionsOf(label: string): Promise<string[]> {
  const combobox = fieldByLabel(label);
  combobox.click();
  await flushPromises();
  return [...document.body.querySelectorAll('[role="option"]')].map((option) =>
    squash(option.textContent),
  );
}

/** Pick the option printed as `option` from the dropdown named `label`. */
async function chooseOption(label: string, option: string): Promise<void> {
  await optionsOf(label);
  const wanted = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find(
    (candidate) => squash(candidate.textContent) === option,
  );
  if (wanted === undefined) throw new Error(`"${label}" does not offer "${option}"`);
  // PrimeVue's Select commits a choice on the pointer press, not on the click
  // alone, so both are sent — a bare `click()` leaves the old value selected.
  wanted.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  wanted.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await flushPromises();
}

/**
 * A figure from a description list, read by the term printed beside it.
 *
 * Vue strips the whitespace between `<dt>` and `<dd>`, so the rendered text
 * runs the two together; reading the pair through the markup that pairs them is
 * both more honest and more legible than matching `SettlesX2,500`.
 */
function figureFor(term: string): string {
  const found = [...document.body.querySelectorAll('dt')].find(
    (candidate) => squash(candidate.textContent) === term,
  );
  if (found === undefined) {
    throw new Error(
      `No figure called "${term}". On screen: ${[...document.body.querySelectorAll('dt')].map((d) => `"${squash(d.textContent)}"`).join(', ')}`,
    );
  }
  return squash(found.nextElementSibling?.textContent ?? null);
}

/** Type into a plain text box the way a person does. */
async function type(control: HTMLElement, value: string): Promise<void> {
  const box = control as HTMLInputElement | HTMLTextAreaElement;
  box.value = value;
  box.dispatchEvent(new Event('input', { bubbles: true }));
  await flushPromises();
}

async function click(element: HTMLElement): Promise<void> {
  element.click();
  await flushPromises();
}

const ACCOUNTS = {
  accounts: [
    {
      id: '01ACCTDRAWERAAAAAAAAAAAAAA',
      name: 'Cash Drawer',
      type: 'CASH',
      holderName: null,
      reference: null,
      isDrawer: true,
      status: 'ACTIVE',
      balanceMinor: 500_000,
      openingAmountMinor: null,
      openingDate: null,
      version: 1,
    },
    {
      id: '01ACCTBANKAAAAAAAAAAAAAAAA',
      name: 'City Bank',
      type: 'BANK',
      holderName: 'Karim Stores',
      reference: '1234',
      isDrawer: false,
      status: 'ACTIVE',
      balanceMinor: 2_000_000,
      openingAmountMinor: null,
      openingDate: null,
      version: 1,
    },
    // Filtered out by every dialog: a closed account cannot take money.
    {
      id: '01ACCTCLOSEDAAAAAAAAAAAAAA',
      name: 'Old Bank',
      type: 'BANK',
      holderName: null,
      reference: null,
      isDrawer: false,
      status: 'CLOSED',
      balanceMinor: 0,
      openingAmountMinor: null,
      openingDate: null,
      version: 1,
    },
  ],
};

let wrappers: Array<{ unmount: () => void }> = [];

function track<T extends { unmount: () => void }>(wrapper: T): T {
  wrappers.push(wrapper);
  return wrapper;
}

beforeEach(() => {
  const session = useSession();
  session.signIn({ accessToken: 'test-access', refreshToken: 'test-refresh' }, 'karim');
  session.setPermissions([]);
  for (const spy of [
    adjustStock,
    recordExpense,
    correctExpense,
    fetchAccounts,
    fetchDayStatus,
    fetchParties,
    fetchCustomerStanding,
    receiveCustomerPayment,
    fetchSupplierDue,
    paySupplier,
    fetchTransactionDateContext,
    changeTransactionDate,
  ]) {
    spy.mockReset();
  }
  fetchAccounts.mockResolvedValue(ACCOUNTS);
  fetchParties.mockResolvedValue({ data: [], page: { nextCursor: null, hasMore: false } });
  adjustStock.mockResolvedValue(undefined);
  recordExpense.mockResolvedValue(undefined);
  receiveCustomerPayment.mockResolvedValue(undefined);
  paySupplier.mockResolvedValue(undefined);
  changeTransactionDate.mockResolvedValue(undefined);
});

afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount();
  wrappers = [];
  document.body.innerHTML = '';
  useSession().clear();
});

// ===========================================================================
// 1. StockAdjustDialog — §5.10, the `Stock` action on a Products row
// ===========================================================================
const COLA: ProductResponse = {
  id: '01PRODCOLAAAAAAAAAAAAAAAAA',
  name: '500ml',
  displayName: 'Coca Cola 500ml',
  brandId: null,
  brandName: null,
  categoryId: null,
  categoryName: null,
  parentCategoryName: null,
  sku: 'COLA-500',
  barcode: null,
  description: null,
  baseUnitId: '01UNITPIECEAAAAAAAAAAAAAAA',
  baseUnitName: 'Piece',
  sellingPriceMinor: 15_000,
  purchasePriceMinor: 10_000,
  minStockQty: 24_000,
  status: 'ACTIVE',
  defaultDiscountType: null,
  defaultDiscountValue: null,
  offerEnabled: false,
  offerPriceMinor: null,
  offerStartDate: null,
  offerEndDate: null,
  offerLive: false,
  tracksExpiry: false,
  tracksSerial: false,
  conversion: null,
  hasImage: false,
  usualSupplierId: null,
  usualSupplierName: null,
  minOrderQty: null,
  warrantyMonths: null,
  supplierWarrantyMonths: null,
  stockQty: 48_000,
  stockValueMinor: 480_000,
  stockStatus: 'IN_STOCK',
  hasStockHistory: true,
  version: 1,
};

describe('StockAdjustDialog', () => {
  async function open() {
    const wrapper = track(
      mount(StockAdjustDialog, { props: { product: COLA }, ...MOUNT_OPTIONS }),
    );
    // PrimeVue's Dialog paints one tick after mount; nothing is on screen before it.
    await flushPromises();
    return wrapper;
  }

  it('opens on the product, with every §5.10 box named by its own label', async () => {
    await open();

    expect(document.body.textContent).toContain('Coca Cola 500ml');
    expect(document.body.textContent).toContain('In stock now: 48 Piece');
    // Resolved through `for` → `id`, so deleting a label breaks this test.
    expect(fieldByLabel('Add or remove').id).toBe('stock-amount');
    expect(fieldByLabel('Reason').id).toBe('stock-reason');
    expect(fieldByLabel('Note').id).toBe('stock-note');
    expect(fieldByLabel('Date').id).toBe('stock-date');
  });

  // Closed list, because the Damaged & Written-off report groups by these four
  // and free text cannot be grouped.
  it('offers exactly the four reasons the report can group', async () => {
    await open();

    expect(await optionsOf('Reason')).toEqual([
      'Damaged — নষ্ট হয়েছে',
      'Recount — গুনে দেখলাম',
      'Lost or stolen — হারিয়েছে',
      'Other — অন্য কারণ',
    ]);
  });

  it('refuses to post an adjustment of nothing, and says so instead', async () => {
    await open();

    await click(buttonByName('Save adjustment'));

    expect(document.body.textContent).toContain(
      'Enter how much to add or remove — use a minus sign to remove',
    );
    expect(adjustStock).not.toHaveBeenCalled();
  });

  // "Other" is the reason that explains nothing by itself, so it is the one
  // reason that has to be written down.
  it('refuses "Other" without a note', async () => {
    await open();
    await type(fieldByLabel('Add or remove'), '-3');
    await chooseOption('Reason', 'Other — অন্য কারণ');

    await click(buttonByName('Save adjustment'));

    expect(document.body.textContent).toContain('Write what happened');
    expect(adjustStock).not.toHaveBeenCalled();
  });

  it('sends the signed quantity at quantity scale, with the reason and the note', async () => {
    await open();
    await type(fieldByLabel('Add or remove'), '-3');
    await type(fieldByLabel('Note'), '  Three bottles broken  ');

    await click(buttonByName('Save adjustment'));

    // Quantity scale is 3 (B8): `-3` on the screen is -3000 on the wire, and the
    // dialog computes nothing else — the server resolves the cost.
    expect(adjustStock).toHaveBeenCalledWith(
      'test-access',
      {
        productId: COLA.id,
        qtyDelta: -3_000,
        reason: 'DAMAGE',
        note: 'Three bottles broken',
      },
      expect.any(String),
    );
  });

  it("shows the server's own code and message when the adjustment is refused (UI-28)", async () => {
    // Technical references belong to support/audit-authorized users, not all operators.
    useSession().setPermissions([...useSession().permissions.value, 'audit.event.view']);
    adjustStock.mockRejectedValue(new ApiError('PERIOD_LOCKED', 'That month is closed', 409));
    await open();
    await type(fieldByLabel('Add or remove'), '10');

    await click(buttonByName('Save adjustment'));

    expect(document.body.textContent).toContain('PERIOD_LOCKED');
    expect(document.body.textContent).toContain('That month is closed');
  });

  it('closes without posting anything when Cancel is pressed', async () => {
    const wrapper = await open();

    await click(buttonByName('Cancel'));

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.emitted('adjusted')).toBeUndefined();
    expect(adjustStock).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 2. CancelDocumentDialog — Phase 9.2, §2.5
//
// This one calls no API of its own: it takes a `submit` prop and the screen
// that opened it decides which endpoint cancelling means. So there is no API
// module to mock here, and the assertion that would have named an endpoint
// names that callback instead — which is the real contract this dialog has.
// ===========================================================================
describe('CancelDocumentDialog', () => {
  const submit = vi.fn();

  async function open() {
    submit.mockReset();
    submit.mockResolvedValue(undefined);
    const wrapper = track(
      mount(CancelDocumentDialog, {
        props: {
          title: 'Expense EXP-2026-000012',
          consequence: 'Petty Cash gets ৳1,500 back.',
          amountMinor: 150_000,
          submit,
        },
        ...MOUNT_OPTIONS,
      }),
    );
    await flushPromises();
    return wrapper;
  }

  it('names what is being cancelled and what cancelling does', async () => {
    await open();

    expect(document.body.textContent).toContain('Expense EXP-2026-000012');
    expect(document.body.textContent).toContain('Petty Cash gets ৳1,500 back.');
    expect(fieldByLabel('Why is it being cancelled?').id).toBe('cancel-reason');
    // The shopkeeper's terms, not the ledger's: nothing is deleted.
    expect(document.body.textContent).toContain('Nothing is deleted');
  });

  // Owner's rule: the before-and-after figures explain a correction, and
  // nothing but the person explains a cancellation.
  it('refuses a blank reason and asks for one', async () => {
    await open();

    await click(buttonByName('Cancel it'));

    expect(document.body.textContent).toContain('Say why this is being cancelled');
    expect(submit).not.toHaveBeenCalled();
  });

  it('refuses a reason too short to be one', async () => {
    await open();
    await type(fieldByLabel('Why is it being cancelled?'), 'x');

    await click(buttonByName('Cancel it'));

    expect(document.body.textContent).toContain('Say why this is being cancelled');
    expect(submit).not.toHaveBeenCalled();
  });

  it('hands the trimmed reason to the caller and reports it cancelled', async () => {
    const wrapper = await open();
    await type(fieldByLabel('Why is it being cancelled?'), '  Recorded twice by mistake  ');

    await click(buttonByName('Cancel it'));

    expect(submit).toHaveBeenCalledWith('Recorded twice by mistake');
    expect(wrapper.emitted('cancelled')).toHaveLength(1);
  });

  it("keeps the document and calls nothing when 'Keep it' is pressed", async () => {
    const wrapper = await open();

    await click(buttonByName('Keep it'));

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.emitted('cancelled')).toBeUndefined();
    expect(submit).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 3. RecordExpenseDialog — §5.12
// ===========================================================================
const CATEGORIES = [
  { id: '01CATRENTAAAAAAAAAAAAAAAAA', code: 'RENT', name: 'Rent', isSystem: false, status: 'ACTIVE' as const, spentMinor: 0 },
  { id: '01CATFUELAAAAAAAAAAAAAAAAA', code: 'FUEL', name: 'Fuel', isSystem: false, status: 'ACTIVE' as const, spentMinor: 0 },
  // Archived: still on the books for history, never offered for a new expense.
  { id: '01CATOLDAAAAAAAAAAAAAAAAAA', code: 'OLD', name: 'Old thing', isSystem: false, status: 'ARCHIVED' as const, spentMinor: 0 },
];

describe('RecordExpenseDialog', () => {
  async function open() {
    const wrapper = track(
      mount(RecordExpenseDialog, { props: { categories: CATEGORIES }, ...MOUNT_OPTIONS }),
    );
    await flushPromises();
    return wrapper;
  }

  /*
   * PrimeVue's `InputNumber` re-derives its own value from key events rather
   * than from the DOM value, so a synthetic `input` on its box is ignored — a
   * limitation of the widget under jsdom, not of the dialog. The amount is
   * therefore typed through `AmountInput`'s own contract, which is the same
   * `update:modelValue` a keystroke produces in the browser.
   */
  async function typeAmount(wrapper: Awaited<ReturnType<typeof open>>, taka: number) {
    wrapper.findComponent(AmountInput).vm.$emit('update:modelValue', taka);
    await flushPromises();
  }

  it('opens with the three things an expense is, each one labelled', async () => {
    await open();

    expect(document.body.textContent).toContain('Record expense');
    expect(fieldByLabel('What for')).toBeTruthy();
    expect(fieldByLabel('Amount')).toBeTruthy();
    expect(fieldByLabel('Paid from')).toBeTruthy();
    expect(fieldByLabel('Paid to')).toBeTruthy();
    expect(fieldByLabel('Note')).toBeTruthy();
  });

  it('offers only the categories still in use, and only live accounts', async () => {
    await open();

    expect(await optionsOf('What for')).toEqual(['Rent', 'Fuel']);
  });

  it('offers each live account with the balance behind it, and never a closed one', async () => {
    await open();

    const offered = await optionsOf('Paid from');
    expect(offered).toEqual(['Cash Drawer — ৳5,000', 'City Bank — ৳20,000']);
    expect(offered.some((option) => option.startsWith('Old Bank'))).toBe(false);
  });

  /*
   * This dialog refuses an incomplete expense by disabling Save rather than by
   * printing a message — there is no inline validation text to assert, so the
   * refusal is asserted where the dialog actually makes it. Pressing the
   * disabled button is still driven here, because "disabled" that still posts
   * is the defect worth catching.
   */
  it('will not save an expense of nothing', async () => {
    await open();

    expect(buttonByName('Save').hasAttribute('disabled')).toBe(true);
    await click(buttonByName('Save'));
    expect(recordExpense).not.toHaveBeenCalled();
  });

  it('posts the category, the amount in minor units and the account code', async () => {
    const wrapper = await open();
    await typeAmount(wrapper, 1_500);
    await type(fieldByLabel('Note'), '  August rent  ');

    await click(buttonByName('Save'));

    expect(recordExpense).toHaveBeenCalledWith(
      'test-access',
      {
        // The category becomes half an account code (`EXPENSE:RENT`), which is
        // why it is chosen and never typed.
        categoryId: '01CATRENTAAAAAAAAAAAAAAAAA',
        amountMinor: 150_000,
        accountCode: 'CASH:01ACCTDRAWERAAAAAAAAAAAAAA',
        payeePartyId: null,
        note: 'August rent',
        backdateReason: null,
      },
      expect.any(String),
    );
  });

  // §5.19: only somebody with `period.backdate` is offered an earlier date, and
  // an earlier date is never accepted without a reason for it.
  it('hides the date box from anyone who may not backdate', async () => {
    await open();

    expect(() => fieldByLabel('Date')).toThrow();
  });

  it('asks why, and refuses to save, once a backdater moves the date', async () => {
    useSession().setPermissions(['period.backdate']);
    const wrapper = await open();
    await typeAmount(wrapper, 1_500);
    expect(buttonByName('Save').hasAttribute('disabled')).toBe(false);

    wrapper.findComponent(DateOnlyPicker).vm.$emit('update:modelValue', '2026-08-01');
    await flushPromises();

    expect(fieldByLabel('Why this date')).toBeTruthy();
    expect(buttonByName('Save').hasAttribute('disabled')).toBe(true);
    await click(buttonByName('Save'));
    expect(recordExpense).not.toHaveBeenCalled();

    await type(fieldByLabel('Why this date'), 'Found the receipt today');
    await click(buttonByName('Save'));
    expect(recordExpense).toHaveBeenCalledWith(
      'test-access',
      expect.objectContaining({
        businessDate: '2026-08-01',
        backdateReason: 'Found the receipt today',
      }),
      expect.any(String),
    );
  });

  it('closes without recording anything when Cancel is pressed', async () => {
    const wrapper = await open();

    await click(buttonByName('Cancel'));

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(recordExpense).not.toHaveBeenCalled();
    expect(correctExpense).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 4. ReceivePaymentDialog — §5.8
// ===========================================================================
const STANDING = {
  partyId: '01PARTYRAHIMAAAAAAAAAAAAAA',
  name: 'Rahim',
  phone: '01711000000',
  dueMinor: 300_000,
  advanceMinor: 0,
  creditLimitMinor: null,
  openInvoices: [
    {
      id: '01SALEOLDAAAAAAAAAAAAAAAAA',
      number: 'INV-2026-000101',
      businessDate: '2026-07-01',
      dueDate: null,
      grandTotalMinor: 200_000,
      outstandingMinor: 200_000,
    },
    {
      id: '01SALENEWAAAAAAAAAAAAAAAAA',
      number: 'INV-2026-000140',
      businessDate: '2026-08-15',
      dueDate: null,
      grandTotalMinor: 100_000,
      outstandingMinor: 100_000,
    },
  ],
};

describe('ReceivePaymentDialog', () => {
  async function open(props: Record<string, unknown> = {}) {
    fetchCustomerStanding.mockResolvedValue(STANDING);
    const wrapper = track(
      mount(ReceivePaymentDialog, {
        props: { partyId: STANDING.partyId, partyName: 'Rahim', ...props },
        ...MOUNT_OPTIONS,
      }),
    );
    await flushPromises();
    return wrapper;
  }

  /** As for the expense dialog: PrimeVue's number box is driven by its contract. */
  async function typeAmount(wrapper: Awaited<ReturnType<typeof open>>, taka: number) {
    wrapper.findComponent(InputNumber).vm.$emit('update:modelValue', taka);
    await flushPromises();
  }

  it('opens on the customer, with each box named', async () => {
    await open();

    expect(document.body.textContent).toContain('Rahim');
    expect(document.body.textContent).toContain('Outstanding — বাকি ৳3,000');
    expect(fieldByLabel('Amount received')).toBeTruthy();
    expect(fieldByLabel('Into which account')).toBeTruthy();
    expect(fieldByLabel('Note')).toBeTruthy();
  });

  it('offers the live accounts money can arrive into', async () => {
    await open();

    expect(await optionsOf('Into which account')).toEqual(['Cash Drawer', 'City Bank']);
  });

  /*
   * Owner rule, instant recalculation: what this settles, what is left and what
   * would be held as an advance all move as the amount is typed — no save, no
   * reload. Oldest invoice first, exactly as the server will allocate it.
   */
  it('reallocates oldest-first and re-totals the moment the amount changes', async () => {
    const wrapper = await open();

    await typeAmount(wrapper, 2_500);

    expect(figureFor('Settles')).toBe('৳2,500');
    expect(figureFor('Still owing')).toBe('৳500');
    // An advance is only shown when there is one to hold.
    expect(() => figureFor('Held as advance')).toThrow();

    await typeAmount(wrapper, 3_500);

    expect(figureFor('Settles')).toBe('৳3,000');
    expect(figureFor('Held as advance')).toBe('৳500');
  });

  /*
   * Like the expense dialog, this one refuses by disabling Receive rather than
   * by printing a message, so the refusal is asserted at the button.
   */
  it('will not receive nothing', async () => {
    const wrapper = await open();

    await typeAmount(wrapper, 0);

    expect(buttonByName('Receive').hasAttribute('disabled')).toBe(true);
    await click(buttonByName('Receive'));
    expect(receiveCustomerPayment).not.toHaveBeenCalled();
  });

  // The money is not posted on the first press: the figures are shown back
  // before anything reaches the ledger.
  it('confirms the figures before posting, then sends the account code and the amount', async () => {
    const wrapper = await open();
    await typeAmount(wrapper, 3_000);

    await click(buttonByName('Receive'));
    expect(receiveCustomerPayment).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('Receive this money?');

    await click(buttonByName('Receive টাকা জমা নিন'));

    expect(receiveCustomerPayment).toHaveBeenCalledWith(
      'test-access',
      {
        customerPartyId: STANDING.partyId,
        accountCode: 'CASH:01ACCTDRAWERAAAAAAAAAAAAAA',
        amountMinor: 300_000,
        // Opened from the customer rather than one invoice: the server settles
        // the oldest bills first, so no invoice is named.
        saleIds: [],
        note: null,
      },
      expect.any(String),
    );
    expect(wrapper.emitted('received')).toHaveLength(1);
  });

  // Opened from one invoice, the same dialog settles that invoice only.
  it('names the one invoice when opened from it', async () => {
    const wrapper = await open({ saleId: '01SALENEWAAAAAAAAAAAAAAAAA' });
    await typeAmount(wrapper, 1_000);

    await click(buttonByName('Receive'));
    await click(buttonByName('Receive টাকা জমা নিন'));

    expect(receiveCustomerPayment).toHaveBeenCalledWith(
      'test-access',
      expect.objectContaining({ amountMinor: 100_000, saleIds: ['01SALENEWAAAAAAAAAAAAAAAAA'] }),
      expect.any(String),
    );
  });

  it('closes without posting when Cancel is pressed', async () => {
    const wrapper = await open();

    await click(buttonByName('Cancel'));

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(receiveCustomerPayment).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 5. PaySupplierDialog — §5.9
// ===========================================================================
const DUE = {
  supplierPartyId: '01PARTYSUPPLIERAAAAAAAAAAA',
  supplierName: 'Abul Traders',
  outstandingMinor: 450_000,
  bills: [
    {
      id: '01PURCHOLDAAAAAAAAAAAAAAAA',
      number: 'PUR-2026-000031',
      businessDate: '2026-07-10',
      dueDate: null,
      grandTotalMinor: 300_000,
      dueMinor: 300_000,
      overdue: true,
    },
    {
      id: '01PURCHNEWAAAAAAAAAAAAAAAA',
      number: 'PUR-2026-000048',
      businessDate: '2026-08-20',
      dueDate: null,
      grandTotalMinor: 150_000,
      dueMinor: 150_000,
      overdue: false,
    },
  ],
};

describe('PaySupplierDialog', () => {
  async function open(props: Record<string, unknown> = {}) {
    fetchSupplierDue.mockResolvedValue(DUE);
    const wrapper = track(
      mount(PaySupplierDialog, {
        props: { supplierId: DUE.supplierPartyId, supplierName: 'Abul Traders', ...props },
        ...MOUNT_OPTIONS,
      }),
    );
    await flushPromises();
    return wrapper;
  }

  it('says it is loading before the debt arrives (UI-27)', async () => {
    fetchSupplierDue.mockReturnValue(new Promise(() => undefined));
    track(
      mount(PaySupplierDialog, {
        props: { supplierId: DUE.supplierPartyId, supplierName: 'Abul Traders' },
        ...MOUNT_OPTIONS,
      }),
    );
    await flushPromises();

    const busy = document.body.querySelector('[aria-busy="true"]');
    expect(busy).not.toBeNull();
    expect(busy?.getAttribute('aria-label')).toBe('Loading');
  });

  it('opens on what is owed, with every box named', async () => {
    await open();

    expect(document.body.textContent).toContain('Owed to this supplier');
    expect(document.body.textContent).toContain('৳4,500');
    expect(fieldByLabel('Amount').id).toBe('pay-amount');
    expect(fieldByLabel('Paid from').id).toBe('pay-account');
    expect(fieldByLabel('Date').id).toBe('pay-date');
    expect(fieldByLabel('Note').id).toBe('pay-note');
  });

  // Which bills the money clears, shown before it is handed over.
  it('lists the bills this payment settles, oldest first', async () => {
    await open();

    const shown = squash(document.body.textContent);
    expect(shown).toContain('PUR-2026-000031');
    expect(shown).toContain('PUR-2026-000048');
    expect(shown.indexOf('PUR-2026-000031')).toBeLessThan(shown.indexOf('PUR-2026-000048'));
  });

  it('offers the live accounts, and marks which one is the drawer', async () => {
    await open();

    expect(await optionsOf('Paid from')).toEqual(['Cash Drawer (drawer)', 'City Bank']);
  });

  /*
   * Two refusals the browser can make on its own, both expressed by disabling
   * the button rather than by a message: nothing, and more than is owed. Paying
   * a supplier more than the debt would create an advance this dialog does not
   * post, so it is refused here rather than at the server.
   */
  it('will not pay nothing', async () => {
    await open();
    await type(fieldByLabel('Amount'), '');

    expect(buttonByName('Pay ৳0').hasAttribute('disabled')).toBe(true);
    await click(buttonByName('Pay ৳0'));
    expect(paySupplier).not.toHaveBeenCalled();
  });

  it('will not pay more than is owed', async () => {
    await open();
    await type(fieldByLabel('Amount'), '5000');

    expect(buttonByName('Pay ৳5,000').hasAttribute('disabled')).toBe(true);
    await click(buttonByName('Pay ৳5,000'));
    expect(paySupplier).not.toHaveBeenCalled();
  });

  it('pre-fills the whole debt, and posts it with the account code and the date', async () => {
    const wrapper = await open();

    // The commonest payment is the whole of it, so that is what is waiting.
    expect((fieldByLabel('Amount') as HTMLInputElement).value).toBe('4500');
    await type(fieldByLabel('Note'), '  Paid by hand  ');

    await click(buttonByName('Pay ৳4,500'));

    expect(paySupplier).toHaveBeenCalledWith(
      'test-access',
      expect.objectContaining({
        supplierPartyId: DUE.supplierPartyId,
        amountMinor: 450_000,
        accountCode: 'CASH:01ACCTDRAWERAAAAAAAAAAAAAA',
        note: 'Paid by hand',
        // No bill named: the oldest bills are settled first.
        purchaseId: null,
      }),
      expect.any(String),
    );
    expect(wrapper.emitted('paid')).toHaveLength(1);
  });

  // The same dialog from "Pay this bill" settles that bill only.
  it('narrows to one bill when opened from it', async () => {
    await open({ purchaseId: '01PURCHNEWAAAAAAAAAAAAAAAA', purchaseNumber: 'PUR-2026-000048' });

    expect(document.body.textContent).toContain('Owed on PUR-2026-000048');
    expect(document.body.textContent).not.toContain('PUR-2026-000031');
    expect((fieldByLabel('Amount') as HTMLInputElement).value).toBe('1500');

    await click(buttonByName('Pay ৳1,500'));

    expect(paySupplier).toHaveBeenCalledWith(
      'test-access',
      expect.objectContaining({
        amountMinor: 150_000,
        purchaseId: '01PURCHNEWAAAAAAAAAAAAAAAA',
      }),
      expect.any(String),
    );
  });

  it("shows the server's own refusal (UI-28)", async () => {
    // Technical references belong to support/audit-authorized users, not all operators.
    useSession().setPermissions([...useSession().permissions.value, 'audit.event.view']);
    paySupplier.mockRejectedValue(new ApiError('PERIOD_LOCKED', 'That month is closed', 409));
    await open();

    await click(buttonByName('Pay ৳4,500'));

    expect(document.body.textContent).toContain('PERIOD_LOCKED');
    expect(document.body.textContent).toContain('That month is closed');
  });

  it('closes without paying when Cancel is pressed', async () => {
    const wrapper = await open();

    await click(buttonByName('বাতিল'));

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(paySupplier).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 6. ChangeTransactionDateDialog — Phase 11.2, D-43, UI-70, UI-72
// ===========================================================================
const CONTEXT = {
  documentType: 'EXPENSE',
  documentId: '01EXPENSEAAAAAAAAAAAAAAAAA',
  number: 'EXP-2026-000012',
  version: 3,
  businessDate: '2026-08-20',
  originalBusinessDate: null,
  amountMinor: 150_000,
  today: '2026-09-03',
  currentPeriodOpen: true,
  mayChange: true,
  mayChangeLocked: false,
  earliestAllocatedDate: null,
  earliestAllocatedNumber: null,
  drawerSessionDate: null,
};

describe('ChangeTransactionDateDialog', () => {
  async function open(context: Record<string, unknown> = {}) {
    fetchTransactionDateContext.mockResolvedValue({ ...CONTEXT, ...context });
    const wrapper = track(
      mount(ChangeTransactionDateDialog, {
        props: { documentType: 'EXPENSE' as const, documentId: CONTEXT.documentId },
        ...MOUNT_OPTIONS,
      }),
    );
    await flushPromises();
    return wrapper;
  }

  /*
   * The date box is deliberately not typeable: `DateOnlyPicker` sets PrimeVue's
   * `manual-input=false`, so the input is read-only and the calendar is the only
   * way in. A new day is therefore chosen through the picker's own contract,
   * which is what the calendar emits when a day is clicked.
   */
  async function chooseDate(wrapper: Awaited<ReturnType<typeof open>>, date: string) {
    wrapper.findComponent(DateOnlyPicker).vm.$emit('update:modelValue', date);
    await flushPromises();
  }

  it('asks the server what may move before showing anything', async () => {
    await open();

    expect(fetchTransactionDateContext).toHaveBeenCalledWith(
      'test-access',
      'EXPENSE',
      CONTEXT.documentId,
    );
    expect(document.body.textContent).toContain('EXP-2026-000012');
    expect(document.body.textContent).toContain('now dated 2026-08-20');
    expect(fieldByLabel('New date').id).toBe('redate-date');
  });

  // UI-75: three of the four reasons cost a tap rather than a sentence.
  it('offers the four reasons as one tap each', async () => {
    await open();

    const reasons = [...document.body.querySelectorAll('button')]
      .map((button) => squash(button.textContent))
      .filter((text) => text.includes('ভুল তারিখ') || text.includes('দেরিতে তুলেছি') || text.includes('ব্যাংকের তারিখ') || text.includes('অন্য কারণ'));
    expect(reasons).toEqual([
      'Wrong date typed ভুল তারিখ',
      'Entered late দেরিতে তুলেছি',
      "Bank's date ব্যাংকের তারিখ",
      'Other reason অন্য কারণ',
    ]);
  });

  /*
   * Every refusal the browser can already make is made before Save, so the
   * shopkeeper is not told no after typing. The server checks all of them
   * again — this is help, never authority.
   */
  it('refuses the day it is already on', async () => {
    const wrapper = await open();

    await chooseDate(wrapper, '2026-08-20');

    expect(document.body.textContent).toContain('That is the day it is already on');
    expect(buttonByName('Change date').hasAttribute('disabled')).toBe(true);
    await click(buttonByName('Change date'));
    expect(changeTransactionDate).not.toHaveBeenCalled();
  });

  it('refuses a date in the future', async () => {
    const wrapper = await open();

    await chooseDate(wrapper, '2026-09-30');

    expect(document.body.textContent).toContain('A transaction cannot be dated in the future');
    expect(changeTransactionDate).not.toHaveBeenCalled();
  });

  it('refuses a date before the bill the money settles', async () => {
    const wrapper = await open({
      earliestAllocatedDate: '2026-08-10',
      earliestAllocatedNumber: 'PUR-2026-000031',
    });

    await chooseDate(wrapper, '2026-08-01');

    expect(squash(document.body.textContent)).toContain(
      'This settles PUR-2026-000031 dated 2026-08-10 — it cannot be dated earlier',
    );
    expect(changeTransactionDate).not.toHaveBeenCalled();
  });

  // Owner decision 2026-08-31: a reason is never blank, and "Other" is the one
  // that has to be written out.
  it('refuses "Other" until it is written out', async () => {
    const wrapper = await open();
    await chooseDate(wrapper, '2026-08-25');
    await click(buttonByName('Other reason অন্য কারণ'));

    expect(buttonByName('Change date').hasAttribute('disabled')).toBe(true);
    await click(buttonByName('Change date'));
    expect(changeTransactionDate).not.toHaveBeenCalled();

    await type(fieldByLabel('In your own words'), 'The bill was dated the day it was delivered');
    expect(buttonByName('Change date').hasAttribute('disabled')).toBe(false);
  });

  it('sends the new day with the document version and the reason', async () => {
    const wrapper = await open();
    await chooseDate(wrapper, '2026-08-25');

    await click(buttonByName('Change date'));

    expect(changeTransactionDate).toHaveBeenCalledWith('test-access', {
      documentType: 'EXPENSE',
      documentId: CONTEXT.documentId,
      // D-32 optimistic locking: the version the dialog opened on.
      version: 3,
      businessDate: '2026-08-25',
      reasonCode: 'WRONG_DATE',
      reasonText: null,
      confirmPassword: null,
      acknowledgeClosedPeriod: false,
    });
    expect(wrapper.emitted('changed')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  /*
   * A closed month the caller may not open is refused outright; one they may
   * costs them the warning, the tick and their own password (UI-72).
   */
  it('refuses a closed month nobody may reopen', async () => {
    const wrapper = await open({ currentPeriodOpen: false, mayChangeLocked: false });

    await chooseDate(wrapper, '2026-08-25');

    expect(document.body.textContent).toContain('That month is closed — ask the owner to move this');
    expect(changeTransactionDate).not.toHaveBeenCalled();
  });

  it('asks the owner to acknowledge and re-enter their password for a closed month', async () => {
    const wrapper = await open({ currentPeriodOpen: false, mayChangeLocked: true });
    await chooseDate(wrapper, '2026-08-25');

    expect(document.body.textContent).toContain('That month is closed.');
    expect(buttonByName('Change date').hasAttribute('disabled')).toBe(true);

    const acknowledge = document.body.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(acknowledge).not.toBeNull();
    (acknowledge as HTMLInputElement).checked = true;
    (acknowledge as HTMLInputElement).dispatchEvent(new Event('change', { bubbles: true }));
    await flushPromises();

    // Still refused: the tick alone is not the step-up.
    expect(buttonByName('Change date').hasAttribute('disabled')).toBe(true);

    await type(fieldByLabel('Your password'), 'correct horse');
    await click(buttonByName('Change date'));

    expect(changeTransactionDate).toHaveBeenCalledWith(
      'test-access',
      expect.objectContaining({ confirmPassword: 'correct horse', acknowledgeClosedPeriod: true }),
    );
  });

  it('closes without moving anything when Cancel is pressed', async () => {
    const wrapper = await open();

    await click(buttonByName('Cancel'));

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(changeTransactionDate).not.toHaveBeenCalled();
  });
});
