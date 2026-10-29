<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { PROBLEM_TICKETS, splitTicket } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';
  import type { Report } from '#lib/kb/causes';

  let { ticket }: { ticket: number } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const issueNo = (url: string) => url.slice(url.lastIndexOf('/') + 1);
</script>

<p class="sum">
  <strong>{split.merged}</strong> reports merged into #{ticket} ·
  <strong>{new Set(split.rows.map((r) => r.problem)).size}</strong>
  {new Set(split.rows.map((r) => r.problem)).size === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.rows as row (row.problem + (row.filedUnder ?? ''))}
      {@const t = row.problem === 'unplaced' ? null : PROBLEM_TICKETS[row.problem]}
      <tr class:open={!t}>
        <td><code>{row.problem}</code>{#if t}<br /><span class="what">{t.what}</span>{/if}</td>
        <td>{row.reports.length}{#if row.filedUnder}<br /><span class="what">within {row.filedUnder}</span>{/if}</td>
        <td>{row.tenants}</td>
        <td>{row.firstSeen} → {row.lastSeen}</td>
        <td>{#if t}<a href={t.issue}>#{issueNo(t.issue)}</a>{:else}no ticket yet: read these{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each split.rows.filter((r) => r.filedUnder) as row (row.filedUnder)}
  <p class="what">The {row.reports.length} <code>{row.problem}</code> reports are filed under <code>{row.filedUnder}</code> by tenant, as the desk counts them, so they are part of that row too.</p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .what { color: var(--muted); font-size: 0.85em; }
  .open td { background: var(--warn-bg); }
  .open td:last-child { color: var(--warn); font-weight: 600; }
</style>
