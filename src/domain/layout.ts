import { children, root } from './org';
import type { OrgState } from './types';

/** Card and spacing sizes for the org chart, in px. */
export const CARD_W = 192, CARD_H = 128;
const V = 44, G = 20, IND = 28, SG = 12;

interface Col { type: 'stack' | 'branch'; items?: string[]; node?: Node; w: number; h: number }
interface Node { id: string; w: number; h: number; cw?: number; cols?: Col[]; single?: boolean }

export interface Link { child: string; manager: string; d: string }
export interface Layout { width: number; height: number; pos: Record<string, { x: number; y: number }>; links: Link[] }

/**
 * Compact top down layout. People with no reports are stacked vertically under their
 * manager on a thin spine; people with reports get their own column. This keeps a
 * 10 to 20 person company readable on one screen without zooming.
 */
export function layoutOrg(s: OrgState): Layout {
  const r = root(s);
  if (!r) return { width: 0, height: 0, pos: {}, links: [] };

  const build = (id: string): Node => {
    const ks = children(s, id);
    if (!ks.length) return { id, w: CARD_W, h: CARD_H };
    const cols: Col[] = [];
    let stack: Col | null = null;
    ks.forEach(k => {
      if (!children(s, k.id).length) {
        if (!stack) { stack = { type: 'stack', items: [], w: 0, h: 0 }; cols.push(stack); }
        stack.items!.push(k.id);
      } else cols.push({ type: 'branch', node: build(k.id), w: 0, h: 0 });
    });
    cols.forEach(c => {
      if (c.type === 'stack') { c.w = IND + CARD_W; c.h = c.items!.length * CARD_H + (c.items!.length - 1) * SG; }
      else { c.w = c.node!.w; c.h = c.node!.h; }
    });
    const cw = cols.reduce((a, c) => a + c.w, 0) + G * (cols.length - 1);
    return { id, cols, single: cols.length === 1 && cols[0].type === 'stack', cw, w: Math.max(CARD_W, cw), h: CARD_H + V + Math.max(...cols.map(c => c.h)) };
  };

  const pos: Layout['pos'] = {};
  const links: Link[] = [];
  const stub = (sx: number, cy: number, tx: number) => `V${cy + CARD_H / 2 - 8}Q${sx},${cy + CARD_H / 2} ${sx + 8},${cy + CARD_H / 2}H${tx}`;

  const place = (node: Node, x: number, y: number) => {
    if (!node.cols) { pos[node.id] = { x, y }; return; }
    const childY = y + CARD_H + V;
    if (node.single) {
      pos[node.id] = { x, y };
      const sx = x + 14;
      node.cols[0].items!.forEach((id, i) => {
        const cy = childY + i * (CARD_H + SG);
        pos[id] = { x: x + IND, y: cy };
        links.push({ child: id, manager: node.id, d: `M${sx},${y + CARD_H}${stub(sx, cy, x + IND)}` });
      });
      return;
    }
    const sx0 = x + (node.w - node.cw!) / 2;
    const px = sx0 + node.cw! / 2 - CARD_W / 2;
    pos[node.id] = { x: px, y };
    const pcx = px + CARD_W / 2, busY = y + CARD_H + V / 2;
    const elbow = (tx: number) => {
      if (Math.abs(tx - pcx) < 1) return `M${pcx},${y + CARD_H}V${busY}`;
      const dir = tx > pcx ? 1 : -1, rr = Math.min(8, Math.abs(tx - pcx) / 2);
      return `M${pcx},${y + CARD_H}V${busY - rr}Q${pcx},${busY} ${pcx + dir * rr},${busY}H${tx - dir * rr}Q${tx},${busY} ${tx},${busY + rr}`;
    };
    let cx = sx0;
    node.cols.forEach(c => {
      if (c.type === 'stack') {
        const sx = cx + 14, left = cx;
        c.items!.forEach((id, i) => {
          const cy = childY + i * (CARD_H + SG);
          pos[id] = { x: left + IND, y: cy };
          links.push({ child: id, manager: node.id, d: `${elbow(sx)}${stub(sx, cy, left + IND)}` });
        });
      } else {
        place(c.node!, cx, childY);
        const tx = pos[c.node!.id].x + CARD_W / 2;
        links.push({ child: c.node!.id, manager: node.id, d: `${elbow(tx)}V${childY}` });
      }
      cx += c.w + G;
    });
  };

  const tree = build(r.id);
  place(tree, 0, 0);
  return { width: tree.w, height: tree.h, pos, links };
}
