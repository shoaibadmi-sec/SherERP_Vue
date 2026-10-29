import { Reorder } from 'framer-motion';
import { GripVertical, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { Switch } from '../Switch';
import type { DashboardWidget, DashboardWidgetId } from '../../types/erp';

type CustomizeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: DashboardWidget[];
  panels: DashboardWidget[];
  onReorder: (kind: 'metric' | 'panel', next: DashboardWidget[]) => void;
  onToggle: (id: DashboardWidgetId) => void;
  onReset: () => void;
};

function Group({
  title,
  items,
  kind,
  onReorder,
  onToggle






}: {title: string;items: DashboardWidget[];kind: 'metric' | 'panel';onReorder: CustomizeDialogProps['onReorder'];onToggle: CustomizeDialogProps['onToggle'];}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-400">{title}</p>
      <Reorder.Group axis="y" values={items} onReorder={(next) => onReorder(kind, next)} className="space-y-1">
        {items.map((w) =>
        <Reorder.Item
          key={w.id}
          value={w}
          className="flex cursor-grab items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 active:cursor-grabbing active:shadow-pop">
          
            <GripVertical className="size-4 text-helper" aria-hidden="true" />
            <span className="flex-1 text-[13px]">
              <span className={w.visible ? 'text-ink' : 'text-ink-400'}>{w.label}</span>
              <span className="font-bn ml-1.5 text-[11px] text-ink-400">{w.labelBn}</span>
            </span>
            <Switch size="sm" checked={w.visible} onCheckedChange={() => onToggle(w.id)} aria-label={`Show ${w.label}`} />
          </Reorder.Item>
        )}
      </Reorder.Group>
    </div>);

}

export function CustomizeDialog({ open, onOpenChange, metrics, panels, onReorder, onToggle, onReset }: CustomizeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Customize dashboard</DialogTitle>
          <DialogDescription>
            Drag to reorder, switch off what you don’t need. <span className="font-bn">যা দরকার, শুধু তা-ই দেখুন।</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 sm:grid-cols-2">
          <Group title="Metric cards" items={metrics} kind="metric" onReorder={onReorder} onToggle={onToggle} />
          <Group title="Panels" items={panels} kind="panel" onReorder={onReorder} onToggle={onToggle} />
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={onReset}>
            <RotateCcw className="size-4" /> Reset to default
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
