import type { ChequeRecord } from '../data/cheques.ts';

export function chequeMoneyEffect(cheque: ChequeRecord) {
  if (cheque.status !== 'Cleared') return { moneyIn: 0, moneyOut: 0 };
  return cheque.direction === 'Received'
    ? { moneyIn: cheque.amount, moneyOut: 0 }
    : { moneyIn: 0, moneyOut: cheque.amount };
}
