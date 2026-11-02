# OrgBoard: Org Design Tool

A working prototype of the Org Design Tool for OrgBuild. It shows a founder how their company is structured, who owns which outcome, how each person is doing against their KPI, and how that performance rolls up through managers and departments to the company goal.

The sample company is **Halden**, a skincare brand doing about $2.25M a month with 13 people across 5 departments, aiming for $5M a month.

## Try the brief's example

1. Find **Tom Becker** (Video Editor). He is at 18 of 30 videos, so he is **Behind**.
2. His manager **Marcus Lee** (Head of Creative) is personally **On track**, but his **Team** shows **1 off track**.
3. **Priya Shah** (CMO) and **Daniel Reyes** (CEO) both see the problem in their team status, and the reporting line from Tom to the top turns red.
4. Set Tom's number to 30 (in the table, or open his card and press **Set to target**). Marcus, Creative, Priya and the line above all clear on their own.
5. Refresh the page. Everything is still there.

## Run it

```bash
npm install
npm run dev      # local development
npm test         # domain tests (rollup rules, restructuring, layout)
npm run build    # production build into dist/
```

Deploys on Vercel with the default Vite settings (build command `npm run build`, output `dist`).

## How performance rolls up

* **Own status** compares a person's current number with their target.
  * On track: 100% of target or better
  * At risk: 85% to 99%
  * Behind: under 85%
  * Some KPIs are better when lower (for example "books closed by day 4" against a day 5 target). The tool handles both directions.
* **Team status** looks at **everyone below** a person, not only direct reports. That is why the CMO sees a problem two levels down.
* Own and team status are always shown separately, so a manager who is hitting their own number but has a struggling team is never shown as fully on track.
* **Department status** is the weakest result inside the department. The department chart shows the average KPI score (capped at 125%).
* **Department status** is shown as the bar color in Department health: violet when everyone is on track, amber or red when anyone inside is off track, even if the average reaches the target.
* A role that is not measured yet says what is missing ("No KPI yet", "Needs a target", "Needs a number"). It is not counted as failing, and a team with an unmeasured person reads "1 without a KPI" instead of "All on track".
* **Off track only** lists only the people below target (in the table, the sidebar count and the header). On the chart, their managers stay visible too, so you can follow the path up to the founder.

## Project structure

```
src/
  domain/            Pure logic, no React. Fully unit tested.
    types.ts         Person, Kpi, Status
    seed.ts          Halden sample company
    org.ts           Tree helpers, reparent (with cycle guard), add and remove roles, repair of saved data
    performance.ts   Own, team, line and department status, plus number formatting
    layout.ts        Compact org chart layout and connector paths
    *.test.ts        Vitest tests, including the brief's Head of Creative scenario
  state/
    store.ts         App state, localStorage persistence, undo
    selectors.ts     Search and spotlight filtering
    dom.ts           Scroll and focus helpers
  components/        Sidebar, TabBar, Header, StatCards, OrgChart, PersonCard,
                     DepartmentChart, NeedsAttention, PeopleTable, DetailPanel,
                     AttentionPopover, NumberField, Toast
  styles/
    tokens.css       Colors, shadows and font in one place
    app.css          Component styles
```

## Key decisions

* **One screen.** The chart, the department view and the people table are three answers to three founder questions, all on the same page and all reading from the same data.
* **Color only means status.** Green, amber and red mark performance. Blue is used for chart data. Everything else is neutral.
* **Status is never color alone.** Every status has a dot or tag plus a word.
* **Compact chart.** People without reports stack under their manager, so a whole 10 to 20 person company fits on screen without zooming.
* **Lines trace problems.** A reporting line turns amber or red when the person below it, or anyone in their team, is off track.
* **Safe restructuring.** Drag a card onto a new manager or use "Reports to" in the panel (works on touch). Removing a role moves their reports up and asks first. Every change can be undone.
* **No save button.** Changes save as you type, with a small "All changes saved" note.
* **Saved data is repaired on load,** so a broken or old save never crashes the app.

## Not included on purpose

Accounts, history over time, notifications and multiple companies. Each would matter in a real product, but they would take focus away from the core experience the brief asks for.
