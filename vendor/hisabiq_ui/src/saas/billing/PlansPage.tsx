import { useState } from "react";
import { useSaas, command } from "../SaasProvider";
import { can } from "../permissions";
import {
  Heading,
  Button,
  Input,
  Card,
  Badge,
  Modal,
  Field,
  Area,
  Actions,
  money,
} from "../components";
export function PlansPage() {
  const { state: s, actor, dispatch } = useSaas();
  const [edit, setEdit] = useState<string | null>(null);
  const p = s.plans.find((p) => p.id === edit);
  const editable = can(s, actor, "plans.edit");
  return (
    <>
      <Heading
        title="Plans"
        bn="প্ল্যান · Simple offers, preserved billing history"
      >
        {editable && (
          <Button onClick={() => setEdit("new")}>Create plan</Button>
        )}
      </Heading>
      <p className="mb-4 text-xs text-ink-500">
        Example prices only. Publishing changes new purchases; existing
        subscription and invoice snapshots are preserved.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {s.plans.map((p) => (
          <Card key={p.id} title={p.name} aside={<Badge>{p.status}</Badge>}>
            <p className="text-3xl font-semibold">
              {money(p.price)}
              <span className="text-xs font-normal text-ink-500"> / month</span>
            </p>
            <p className="mt-2 text-xs text-ink-500">
              {money(p.yearly)} / year · Version {p.version}
            </p>
            <ul className="my-5 space-y-2 text-sm">
              <li>{p.users} team members</li>
              <li>{p.sms} included SMS credits</li>
              <li className="text-ink-500">{p.features}</li>
            </ul>
            {editable && (
              <Actions>
                <Button variant="outline" onClick={() => setEdit(p.id)}>
                  Edit draft
                </Button>
                <Button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Publish ${p.name}? Existing bills will not change.`,
                      )
                    )
                      dispatch(command("plan.publish", p.id, {}, p.version));
                  }}
                >
                  Publish
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    dispatch(command("plan.retire", p.id, {}, p.version))
                  }
                >
                  Retire
                </Button>
              </Actions>
            )}
          </Card>
        ))}
      </div>
      {edit && (
        <Modal
          title={p ? "Edit plan draft" : "Create plan"}
          onClose={() => setEdit(null)}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              if (
                dispatch(
                  command(
                    "plan.saveDraft",
                    p?.id,
                    {
                      ...f,
                      price: Math.round(Number(f.price) * 100),
                      yearly: Math.round(Number(f.yearly) * 100),
                    },
                    p?.version,
                  ),
                )
              )
                setEdit(null);
            }}
          >
            <Field label="Plan name">
              <Input name="name" defaultValue={p?.name} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["price", "Monthly price (BDT)", p ? p.price / 100 : ""],
                ["yearly", "Yearly price (BDT)", p ? p.yearly / 100 : ""],
                ["sms", "SMS allowance", p?.sms || 0],
                ["users", "Users", p?.users || 1],
              ].map(([name, label, value]) => (
                <Field key={name} label={String(label)}>
                  <Input
                    name={String(name)}
                    type="number"
                    min={name === "sms" ? 0 : 1}
                    step={name === "price" || name === "yearly" ? "0.01" : "1"}
                    defaultValue={value}
                    required
                  />
                </Field>
              ))}
            </div>
            <Field label="Features">
              <Area name="features" defaultValue={p?.features} required />
            </Field>
            <Actions>
              <Button type="submit">Save draft</Button>
            </Actions>
          </form>
        </Modal>
      )}
    </>
  );
}
