import type { ComponentProps } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { PartyDetail } from './PartyDetail';
import { PartyDetailResponsive } from './PartyDetailResponsive';

/**
 * Keep the proven desktop Party workspace exactly as implemented on main.
 * Only tablet and phone screens use the Magic Patterns responsive presentation.
 * Both views use the same Party props, data source and accounting callbacks;
 * the inactive view does not mount or open duplicate dialogs.
 */
type Props = ComponentProps<typeof PartyDetailResponsive>;

export function PartyDetailAdaptive(props: Props) {
  const desktop = useMediaQuery('(min-width: 1024px)');
  return desktop ? <PartyDetail {...props} /> : <PartyDetailResponsive {...props} />;
}
