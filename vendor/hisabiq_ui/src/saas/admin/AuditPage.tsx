import { auditEvents } from "./auditSelectors";
import { useState } from "react";
import { useSaas } from "../SaasProvider";
import { Heading, DataTable, Button, Modal, when } from "../components";
export function AuditPage() {
  const { state: s, actor } = useSaas();
  const rows = auditEvents(s, actor);
  const [id, setId] = useState("");
  const event = rows.find((x) => x.id === id);
  return (
    <>
      <Heading
        title="Audit log"
        bn="কার্যক্রমের ইতিহাস · Recorded actions cannot be edited"
      />
      <DataTable
        rows={rows}
        columns={[
          { label: "Time", render: (a) => when(a.date) },
          {
            label: "Employee",
            render: (a) =>
              s.staff.find((e) => e.id === a.actor)?.name || a.actor,
          },
          { label: "Action", render: (a) => a.action },
          {
            label: "Record",
            render: (a) => (
              <span className="block max-w-48 truncate">{a.target}</span>
            ),
          },
          { label: "Reason", render: (a) => a.reason || "—" },
          {
            label: "Details",
            render: (a) => (
              <Button size="sm" variant="outline" onClick={() => setId(a.id)}>
                Inspect
              </Button>
            ),
          },
        ]}
      />
      {event && (
        <Modal title="Audit event" onClose={() => setId("")}>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold">Action</dt>
              <dd>
                {event.action} · {event.actor}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Before</dt>
              <dd className="mt-2 break-all rounded bg-ink-50 p-3 text-xs">
                {event.before}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">After</dt>
              <dd className="mt-2 break-all rounded bg-ink-50 p-3 text-xs">
                {event.after}
              </dd>
            </div>
          </dl>
        </Modal>
      )}
    </>
  );
}
