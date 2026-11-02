import type { Direction, OrgState, Person, Unit } from './types';

function P(id: string, name: string, title: string, dept: string, managerId: string | null, outcome: string,
  kname: string, unit: Unit, dir: Direction, target: number, current: number): Person {
  return { id, name, title, dept, managerId, outcome, kpi: { name: kname, unit, dir, target, current } };
}

/** Halden: a sample skincare brand doing about $2M a month with 13 people. */
export const SEED: OrgState = {
  v: 2,
  company: { name: 'Halden', goal: 5_000_000 },
  people: [
    P('p1', 'Daniel Reyes', 'Founder & CEO', 'Leadership', null, 'Grow Halden from $2M to $5M a month', 'Monthly revenue', 'currency', 'higher', 2_200_000, 2_250_000),
    P('p2', 'Priya Shah', 'CMO', 'Marketing', 'p1', 'Profitable new customer growth', 'Blended MER', 'ratio', 'higher', 3.0, 3.2),
    P('p3', 'Marcus Lee', 'Head of Creative', 'Creative', 'p2', 'A steady supply of ads that win', 'Winning ads per month', 'number', 'higher', 8, 9),
    P('p4', 'Ella Novak', 'Creative Strategist', 'Creative', 'p3', 'Strong ad concepts briefed into production', 'Concepts briefed', 'number', 'higher', 20, 22),
    P('p5', 'Tom Becker', 'Video Editor', 'Creative', 'p3', 'Finished video ads delivered on time', 'Videos delivered', 'number', 'higher', 30, 18),
    P('p6', 'Aisha Khan', 'Performance Marketer', 'Marketing', 'p2', 'Paid spend that returns profitably', 'Paid ROAS', 'ratio', 'higher', 2.5, 2.6),
    P('p7', 'Liam Carter', 'Retention Manager', 'Marketing', 'p2', 'Repeat revenue from existing customers', 'Email share of revenue', 'percent', 'higher', 25, 23),
    P('p8', 'Nina Petrova', 'COO', 'Operations', 'p1', 'Orders that arrive on time, every time', 'On time delivery', 'percent', 'higher', 98, 97),
    P('p9', 'Omar Haddad', 'Supply Chain Manager', 'Operations', 'p8', 'Best sellers always in stock', 'In stock rate', 'percent', 'higher', 95, 96),
    P('p10', 'Grace Kim', 'Support Lead', 'Support', 'p8', 'Customers who feel looked after', 'Customer satisfaction', 'percent', 'higher', 92, 94),
    P('p11', 'Ben Ortiz', 'Support Agent', 'Support', 'p10', 'Fast, complete answers to every ticket', 'Tickets solved per day', 'number', 'higher', 60, 63),
    P('p12', 'Rachel Moore', 'Head of Finance', 'Finance', 'p1', 'Healthy margins and clean books', 'Contribution margin', 'percent', 'higher', 30, 31),
    P('p13', 'Jason Wu', 'Bookkeeper', 'Finance', 'p12', 'Monthly books closed fast and accurately', 'Books closed by', 'day', 'lower', 5, 4)
  ]
};

export const cloneSeed = (): OrgState => JSON.parse(JSON.stringify(SEED));
