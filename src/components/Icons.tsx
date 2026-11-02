/**
 * One icon set across the app: Phosphor. Regular weight for navigation and labels,
 * fill weight only for the small accent icons in the stat strip. Icons never appear
 * inside call to action buttons.
 */
import {
  ArrowCounterClockwise, ArrowUpRight, Bell, Buildings, CaretUpDown, ChartBar, Coins, Crown, DotsThree,
  FunnelSimple, Headset, MagnifyingGlass, Megaphone, PaintBrushBroad, Package, SquaresFour, Target,
  TreeStructure, UserCircle, UsersThree, WarningCircle, X, ChartLineUp, ListChecks, ArrowUp, ArrowDown
} from '@phosphor-icons/react';
import type { Icon as PhIcon, IconWeight } from '@phosphor-icons/react';

type P = { className?: string; size?: number; weight?: IconWeight };
const wrap = (C: PhIcon, size = 16, weight: IconWeight = 'regular') =>
  ({ className = 'i', size: s, weight: w }: P) => <C className={className} size={s ?? size} weight={w ?? weight} aria-hidden="true" />;

export const IconOrg = wrap(TreeStructure);
export const IconChart = wrap(ChartBar);
export const IconPeople = wrap(UsersThree);
export const IconBell = wrap(Bell);
export const IconSort = wrap(CaretUpDown, 14);
export const IconArrow = wrap(ArrowUpRight, 15);
export const IconSearch = wrap(MagnifyingGlass);
export const IconClose = wrap(X);
export const IconMore = wrap(DotsThree, 18, 'bold');
export const IconWarning = wrap(WarningCircle);
export const IconEveryone = wrap(SquaresFour);
export const IconReset = wrap(ArrowCounterClockwise);
export const IconFilter = wrap(FunnelSimple);
export const IconPerson = wrap(UserCircle, 14);
export const IconTable = wrap(ListChecks);
export const IconSortUp = wrap(ArrowUp, 13);
export const IconSortDown = wrap(ArrowDown, 13);

/** Filled accent icons for the stat strip. */
export const StatRevenue = wrap(ChartLineUp, 16, 'fill');
export const StatPeople = wrap(UsersThree, 16, 'fill');
export const StatDepts = wrap(Buildings, 16, 'fill');
export const StatGoal = wrap(Target, 16, 'fill');

/** A recognisable icon per department, falling back to a neutral grid for new ones. */
const DEPT_ICON: Record<string, PhIcon> = {
  Leadership: Crown, Marketing: Megaphone, Creative: PaintBrushBroad, Operations: Package, Support: Headset, Finance: Coins
};
export function DeptIcon({ dept, className = 'i' }: { dept: string; className?: string }) {
  const C = DEPT_ICON[dept] ?? SquaresFour;
  return <C className={className} size={16} weight="regular" aria-hidden="true" />;
}
