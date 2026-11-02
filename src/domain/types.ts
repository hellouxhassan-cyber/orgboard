export type Unit = 'number' | 'currency' | 'percent' | 'ratio' | 'day';
export type Direction = 'higher' | 'lower';
/** Own KPI status. `none` means the role has no measurable KPI yet. */
export type Status = 'on' | 'risk' | 'behind' | 'none';
export type Severity = Exclude<Status, 'none'>;

export interface Kpi {
  name: string;
  unit: Unit;
  dir: Direction;
  target: number | null;
  current: number | null;
}

export interface Person {
  id: string;
  name: string;
  title: string;
  dept: string;
  managerId: string | null;
  outcome: string;
  kpi: Kpi;
}

export interface Company {
  name: string;
  goal: number;
}

export interface OrgState {
  v: 2;
  company: Company;
  people: Person[];
}
