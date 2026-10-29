import { localDateTime } from "./schedule";
import { useState } from "react";
import { useSaas, command } from "../SaasProvider";
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
  Area,
  Actions,
} from "../components";
import { segments } from "../messaging/transitions";
export function AnnouncementsPage() {
  const { state: s, actor, dispatch } = useSaas();
  const [edit, setEdit] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [ids, setIds] = useState<string[]>([]);
  const [channel, setChannel] = useState("In-app");
  const ann = s.announcements.find((x) => x.id === edit);
  const editable = can(s, actor, "announcements.edit");
  return (
    <>
      <Heading
        title="Announcements"
        bn="ঘোষণা · Preview the audience before delivery"
      >
        {editable && (
          <Button
            onClick={() => {
              setEdit("new");
              setBody("");
              setIds([]);
              setChannel("In-app");
            }}
          >
            New announcement
          </Button>
        )}
      </Heading>
      <DataTable
        rows={s.announcements}
        columns={[
          {
            label: "Announcement",
            render: (x) => (
              <div className="font-medium">
                {x.title}
                <p className="max-w-xs text-xs font-normal text-ink-500">
                  {x.body}
                </p>
              </div>
            ),
          },
          {
            label: "Audience",
            render: (x) => `${x.tenantIds.length} tenants · ${x.channel}`,
          },
          { label: "Scheduled", render: (x) => x.scheduled },
          { label: "Status", render: (x) => <Badge>{x.status}</Badge> },
          {
            label: "Actions",
            render: (x) =>
              editable && (
                <div className="flex flex-wrap gap-1">
                  {x.status !== "Delivered" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEdit(x.id);
                        setBody(x.body);
                        setIds(x.tenantIds);
                        setChannel(x.channel);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {x.status === "Draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        dispatch(
                          command("announcement.schedule", x.id, {}, x.version),
                        )
                      }
                    >
                      Schedule
                    </Button>
                  )}
                  {["Draft", "Scheduled"].includes(x.status) && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Simulate delivery to ${x.tenantIds.length} tenants? No real messages will be sent.`,
                            )
                          )
                            dispatch(
                              command(
                                "announcement.simulateDelivery",
                                x.id,
                                {},
                                x.version,
                              ),
                            );
                        }}
                      >
                        Simulate delivery
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const reason = window.prompt("Cancellation reason");
                          if (reason)
                            dispatch(
                              command(
                                "announcement.cancel",
                                x.id,
                                { reason },
                                x.version,
                              ),
                            );
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              ),
          },
        ]}
      />
      {edit && (
        <Modal
          title="Announcement and audience preview"
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
                    "announcement.save",
                    ann?.id,
                    {
                      ...f,
                      tenantIds: ids,
                      body,
                      channel,
                      scheduled: new Date(String(f.scheduled)).toISOString(),
                    },
                    ann?.version,
                  ),
                )
              )
                setEdit(null);
            }}
          >
            <Field label="Title">
              <Input name="title" defaultValue={ann?.title} required />
            </Field>
            <Field label="Message">
              <Area
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </Field>
            <Field label="Channel">
              <Select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                {["In-app", "Email", "SMS"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Scheduled time (device timezone)">
              <Input
                type="datetime-local"
                name="scheduled"
                required
                defaultValue={ann ? localDateTime(ann.scheduled) : undefined}
              />
            </Field>
            <fieldset className="space-y-2 rounded-lg border border-border p-3">
              <legend className="text-xs font-semibold">Audience</legend>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setIds(
                    s.tenants
                      .filter((t) => t.status === "Active")
                      .map((t) => t.id),
                  )
                }
              >
                Select active tenants
              </Button>
              {s.tenants.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={ids.includes(t.id)}
                    onChange={(e) =>
                      setIds(
                        e.target.checked
                          ? [...ids, t.id]
                          : ids.filter((id) => id !== t.id),
                      )
                    }
                  />
                  {t.name}
                </label>
              ))}
            </fieldset>
            <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
              Preview: {ids.length} tenants · {channel}
              {channel === "SMS"
                ? ` · estimated ${ids.length * segments(body)} segments; provider pricing is not connected`
                : ""}
              . Delivery is demo-only.
            </p>
            <Actions>
              <Button type="submit">Save draft</Button>
            </Actions>
          </form>
        </Modal>
      )}
    </>
  );
}
