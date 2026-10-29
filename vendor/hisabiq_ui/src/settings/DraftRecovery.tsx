import { useState, useSyncExternalStore } from "react";
import {
  getSalesPreviewSnapshot,
  subscribeSalesPreview,
  listDeletedSalesDrafts,
  restoreSalesDraft,
} from "../data/salesPreviewStore";
import { useTenantSettings } from "./TenantSettingsProvider";
import { canManage } from "./model";
import { Button, SettingCard, Input } from "./ui";
export function DraftRecovery() {
  const { state, actorId } = useTenantSettings();
  useSyncExternalStore(subscribeSalesPreview, getSalesPreviewSnapshot);
  const [query, setQuery] = useState(""),
    [notice, setNotice] = useState("");
  const ctx = {
    tenantId: state.tenantId,
    actorId,
    allowed: canManage(state, actorId, "sales"),
  };
  const rows = listDeletedSalesDrafts(ctx).filter((r) =>
    (r.draft.label + " " + r.draft.customer)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <SettingCard title="Recycle Bin · রিসাইকেল বিন">
      <p className="text-xs text-helper">
        Deleted sales drafts can be restored for 30 days on every plan. This
        uses the current session’s actual draft store; reloading resets that
        preview store. Posted financial records are never restored here.
      </p>
      <Input
        aria-label="Search deleted drafts"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search deleted drafts"
      />
      {rows.map((r) => (
        <div
          key={r.draft.id}
          className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-[13px]"
        >
          <div>
            <strong>{r.draft.label}</strong>
            <p className="text-xs text-helper">
              {r.draft.customer || "Walk-in"} · Deleted by {r.deletedBy}
            </p>
            <p className="text-xs text-helper">
              Recover before{" "}
              {new Date(r.expiresAt).toLocaleString("en-GB", {
                timeZone: "Asia/Dhaka",
              })}{" "}
              · Dhaka
            </p>
          </div>
          <Button
            variant="outline"
            disabled={Date.now() >= Date.parse(r.expiresAt)}
            onClick={() => {
              try {
                restoreSalesDraft(r.draft.id, ctx, new Date().toISOString());
                setNotice(
                  "Draft restored with its original identity. No money or stock posted.",
                );
              } catch (e) {
                setNotice(
                  e instanceof Error ? e.message : "Could not restore.",
                );
              }
            }}
          >
            Restore draft
          </Button>
        </div>
      ))}
      {!rows.length && (
        <p className="text-xs text-helper">
          No eligible deleted drafts in this session.
        </p>
      )}
      {notice && (
        <p role="status" className="text-xs">
          {notice}
        </p>
      )}
    </SettingCard>
  );
}
