// The problems inside #4471, one per filed ticket. Counts follow the desk's view (causes.ts, by tenant).
// `shift` comes from what the desk read in the body (desk-notes.json): those reports stay counted under
// the cause their tenant files them in, so the shift row overlaps that row and does not add to the total.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'shift' | 'unplaced';

export const PROBLEM_TICKETS: Record<Exclude<Problem, 'unplaced'>, { issue: string; what: string }> = {
  parser: {
    issue: 'https://github.com/Angel-Mu/s01e03-what-it-shows/issues/1',
    what: 'shared parser reads month first; day-first tenants get day and month swapped',
  },
  hint: {
    issue: 'https://github.com/Angel-Mu/s01e03-what-it-shows/issues/2',
    what: 'booking-v3 hint says MM/DD/YYYY; the form reads day first',
  },
  shift: {
    issue: 'https://github.com/Angel-Mu/s01e03-what-it-shows/issues/3',
    what: 'date moves by one day across time zones; not a swap',
  },
};

export type ProblemRow = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  filedUnder?: Problem;
};

function row(problem: Problem, rs: Report[], filedUnder?: Problem): ProblemRow {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return { problem, reports: rs, tenants: new Set(rs.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1], filedUnder };
}

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { merged: number; rows: ProblemRow[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p: Problem = causeOf(r, tenantOf(r)) ?? 'unplaced';
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const rows = [...by.entries()].map(([p, rs]) => row(p, rs)).sort((a, b) => b.reports.length - a.reports.length);
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  const shiftRows = [...new Set(moved.map((r) => causeOf(r, tenantOf(r)) ?? 'unplaced'))].map((under) =>
    row('shift', moved.filter((r) => (causeOf(r, tenantOf(r)) ?? 'unplaced') === under), under),
  );
  return { merged: merged.length, rows: [...rows, ...shiftRows] };
}
