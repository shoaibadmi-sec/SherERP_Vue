import React, { useState } from "react";
import { useSaas, command } from "../SaasProvider";
import { can } from "../permissions";
import { publicArticles } from "./transitions";
import {
  Heading,
  Card,
  Badge,
  Button,
  Modal,
  Field,
  Select,
  Input,
  Area,
  Actions,
  Empty,
} from "../components";
export function KnowledgePage() {
  const { state: s, actor, dispatch } = useSaas();
  const [edit, setEdit] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const p = s.articles.find((x) => x.id === edit);
  const rows = publicArticles(s, actor).filter((x) =>
    `${x.title} ${x.body}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <Heading
        title="Knowledge base"
        bn="সহায়িকা · Helpful answers for tenants and staff"
      >
        {can(s, actor, "knowledge.edit") && (
          <Button onClick={() => setEdit("new")}>Write article</Button>
        )}
      </Heading>
      <div className="mb-4 max-w-md">
        <Input
          aria-label="Search articles"
          value={q}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQ(e.target.value)
          }
          placeholder="Search articles…"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((x) => (
          <Card key={x.id} title={x.title} aside={<Badge>{x.status}</Badge>}>
            <p className="mb-3 text-xs text-ink-500">{x.audience}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {x.body}
            </p>
            {can(s, actor, "knowledge.edit") && (
              <Actions>
                <Button variant="outline" onClick={() => setEdit(x.id)}>
                  Edit
                </Button>
                <Button
                  onClick={() =>
                    dispatch(command("article.publish", x.id, {}, x.version))
                  }
                >
                  Publish
                </Button>
              </Actions>
            )}
          </Card>
        ))}
      </div>
      {!rows.length && <Empty />}
      {edit && (
        <Modal title="Edit knowledge article" onClose={() => setEdit(null)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                dispatch(
                  command(
                    "article.save",
                    p?.id,
                    Object.fromEntries(new FormData(e.currentTarget)),
                    p?.version,
                  ),
                )
              )
                setEdit(null);
            }}
          >
            <Field label="Title">
              <Input name="title" defaultValue={p?.title} required />
            </Field>
            <Field label="Audience">
              <Select name="audience" defaultValue={p?.audience}>
                <option>Public</option>
                <option>Internal</option>
              </Select>
            </Field>
            <Field label="Article">
              <Area name="body" rows={8} defaultValue={p?.body} required />
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
