import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PartyAvatar } from '../PartyAvatar';
import { duesToCollect } from '../../data/dashboard';
import { parties } from '../../data/parties';
import { taka } from '../../utils/currency';

export function DuesList() {
  const max = Math.max(...duesToCollect.map((d) => d.amount));
  return (
    <ul className="divide-y divide-border">
      {duesToCollect.map((d) => {
        const party = parties.find((p) => p.id === d.partyId);
        return (
          <li key={d.partyId}>
            <Link to={`/app/parties?id=${d.partyId}`} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-ink-50">
              <PartyAvatar name={d.name} color={party?.avatarColor} size={30} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13px] font-medium text-ink">{d.name}</p>
                  <p className="text-[13px] font-semibold tabular-nums text-ink">{taka(d.amount)}</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={`h-full rounded-full ${d.overdueDays > 20 ? 'bg-danger' : d.overdueDays > 7 ? 'bg-warning' : 'bg-teal-500'}`}
                      style={{ width: `${d.amount / max * 100}%` }} />
                    
                  </div>
                  <span className={`shrink-0 text-[11px] ${d.overdueDays > 20 ? 'text-danger' : 'text-ink-500'}`}>
                    {d.overdueDays}d overdue
                  </span>
                </div>
              </div>
              <ChevronRight className="size-4 text-helper group-hover:text-ink-500" aria-hidden="true" />
            </Link>
          </li>);

      })}
    </ul>);

}
