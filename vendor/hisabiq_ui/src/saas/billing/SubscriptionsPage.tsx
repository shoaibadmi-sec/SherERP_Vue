import { useState } from "react";
import { Link } from "react-router-dom";
import { useSaas, command } from "../SaasProvider";
import { useScoped } from "../hooks";
import { can } from "../permissions";
import {
  Heading,
  DataTable,
  Badge,
  Button,
  Modal,
  Field,
  Select,
  Input,
  Actions,
  money,
} from "../components";
export function SubscriptionsPage() {
  const { state: s, actor, dispatch } = useSaas();
  const rows = useScoped(s.subscriptions, "subscriptions.view");
  const [edit, setEdit] = useState<{ id: string; action: string } | null>(null);
  const sub = s.subscriptions.find((x) => x.id === edit?.id);
  return (
    <>
      <Heading
        title="Subscriptions"
        bn="সাবস্ক্রিপশন · Renewals, trials and scheduled changes"
      />
      <DataTable
        rows={rows}
        columns={[
          {
            label: "Tenant",
            render: (x) => (
              <Link
                className="font-medium text-primary"
                to={`/saas/tenants/${x.tenantId}`}
              >
                {s.tenants.find((t) => t.id === x.tenantId)?.name}
              </Link>
            ),
          },
          {
            label: "Plan",
            render: (x) => (
              <div>
                {x.planName}
                <p className="text-xs text-ink-500">{money(x.price)} / month</p>
              </div>
            ),
          },
          { label: "Status", render: (x) => <Badge>{x.status}</Badge> },
          {
            label: "Renewal",
            render: (x) => (
              <div>
                {x.renewal}
                <p className="max-w-xs text-xs text-ink-500">{x.scheduled}</p>
              </div>
            ),
          },
          {
            label: "Actions",
            render: (x) =>
              can(s, actor, "subscriptions.edit", x.tenantId) ? (
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEdit({ id: x.id, action: "change" })}
                  >
                    Change plan
                  </Button>
                  {x.status === "Trial" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setEdit({ id: x.id, action: "extendTrial" })
                      }
                    >
                      Extend trial
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setEdit({
                        id: x.id,
                        action: x.scheduled ? "undoCancellation" : "cancel",
                      })
                    }
                  >
                    {x.scheduled ? "Undo change" : "Cancel renewal"}
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-ink-500">View only</span>
              ),
          },
        ]}
      />
      {sub && edit && (
        <Modal
          title="Subscription change preview"
          onClose={() => setEdit(null)}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                dispatch(
                  command(
                    `subscription.${edit.action}`,
                    sub.id,
                    Object.fromEntries(new FormData(e.currentTarget)),
                    sub.version,
                  ),
                )
              )
                setEdit(null);
            }}
          >
            <p className="text-sm">
              {s.tenants.find((t) => t.id === sub.tenantId)?.name} ·{" "}
              {sub.planName}
            </p>
            {edit.action === "change" ? (
              <>
                <Field label="Next plan">
                  <Select name="planId">
                    {s.plans
                      .filter((p) => p.status === "Published")
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {money(p.price)}/month
                        </option>
                      ))}
                  </Select>
                </Field>
                <p className="text-xs text-ink-500">
                  Effective at next renewal: {sub.renewal}. No immediate
                  prorated charge. This demo records the scheduled change; it
                  does not run a background renewal job.
                </p>
              </>
            ) : edit.action === "extendTrial" ? (
              <Field label="New trial end">
                <Input
                  type="date"
                  name="date"
                  min={sub.renewal}
                  defaultValue={sub.renewal}
                  required
                />
              </Field>
            ) : (
              <p className="text-sm text-ink-500">
                {edit.action === "cancel"
                  ? `Cancellation is scheduled for ${sub.renewal}. Current access remains until then.`
                  : "The scheduled change will be removed."}
              </p>
            )}
            <Actions>
              <Button type="submit">Confirm change</Button>
            </Actions>
          </form>
        </Modal>
      )}
    </>
  );
}
