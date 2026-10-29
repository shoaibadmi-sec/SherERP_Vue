import { useEffect, useState } from 'react';
import { defaultWidgets } from '../data/dashboard';
import type { DashboardWidget, DashboardWidgetId } from '../types/erp';

const KEY = 'hisabiq.dashboard.layout.v1';

function load(): DashboardWidget[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultWidgets;
    const saved = JSON.parse(raw) as {id: DashboardWidgetId;visible: boolean;}[];
    const byId = new Map(defaultWidgets.map((w) => [w.id, w]));
    const restored = saved.
    filter((s) => byId.has(s.id)).
    map((s) => ({ ...(byId.get(s.id) as DashboardWidget), visible: s.visible }));
    const missing = defaultWidgets.filter((w) => !saved.some((s) => s.id === w.id));
    return [...restored, ...missing];
  } catch {
    return defaultWidgets;
  }
}

export function useDashboardLayout() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(widgets.map(({ id, visible }) => ({ id, visible }))));
  }, [widgets]);

  const metrics = widgets.filter((w) => w.kind === 'metric');
  const panels = widgets.filter((w) => w.kind === 'panel');

  const setGroup = (kind: 'metric' | 'panel', next: DashboardWidget[]) => {
    setWidgets(kind === 'metric' ? [...next, ...panels] : [...metrics, ...next]);
  };

  const toggle = (id: DashboardWidgetId) =>
  setWidgets((ws) => ws.map((w) => w.id === id ? { ...w, visible: !w.visible } : w));

  const move = (id: DashboardWidgetId, dir: -1 | 1) => {
    const w = widgets.find((x) => x.id === id);
    if (!w) return;
    const group = w.kind === 'metric' ? [...metrics] : [...panels];
    const visible = group.filter((g) => g.visible);
    const vi = visible.findIndex((g) => g.id === id);
    const target = visible[vi + dir];
    if (!target) return;
    const a = group.findIndex((g) => g.id === id);
    const b = group.findIndex((g) => g.id === target.id);
    [group[a], group[b]] = [group[b], group[a]];
    setGroup(w.kind, group);
  };

  const reset = () => setWidgets(defaultWidgets);

  return { widgets, metrics, panels, setGroup, toggle, move, reset };
}