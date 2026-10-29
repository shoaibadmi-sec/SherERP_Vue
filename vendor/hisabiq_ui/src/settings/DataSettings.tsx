import { SettingsSqlBackup } from "./SettingsSqlBackup";
import { SettingsActivity } from "./SettingsActivity";
import {DraftRecovery} from './DraftRecovery';
import { AppSelect } from '../components/AppSelect';
import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import { canManage, parseSettings, type TenantSettings } from "./model";
import { useTenantSettings } from "./TenantSettingsProvider";
import {
  Button,
  SettingCard,
  SettingsDialog,
  download,
} from "./ui";
import { sectionNames } from "./fields";

async function readFile(file: File, reportError: (message: string) => void) {
  try {
    return await file.text();
  } catch {
    reportError("Could not read that file. Please choose it again.");
    return null;
  }
}

export function DataSettings() {
  const { state, actorId, restore } = useTenantSettings();
  const [backup, setBackup] = useState<TenantSettings | null>(null),
    [revision, setRevision] = useState(0),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [csv, setCsv] = useState<string[][]>([]),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [preview, setPreview] = useState(false);
  const exportAllowed = canManage(state, actorId, "export"),
    importAllowed = canManage(state, actorId, "import");
  const changed = backup
    ? Object.keys(state.sections).filter(
        (k) =>
          JSON.stringify(state.sections[k as keyof typeof state.sections]) !==
          JSON.stringify(backup.sections[k as keyof typeof state.sections]),
      )
    : [];
  return (
    <div className="space-y-5">
      <DraftRecovery/>
      <SettingsSqlBackup state={state} exportAllowed={exportAllowed} importAllowed={importAllowed} onReview={backup => { setBackup(backup); setRevision(state.revision); }} />
      <div className="grid gap-4 xl:grid-cols-2">
        <SettingCard title="Settings backup">
          <p className="text-sm text-ink-600">
            Backup for {state.sections.business.name}. Includes business
            preferences and employee role configuration; personal appearance
            stays on this device.
          </p>
          <Button
            disabled={!exportAllowed}
            variant="outline"
            onClick={() =>
              download(
                `hisabiq-settings-${state.tenantId}.json`,
                JSON.stringify(state, null, 2),
              )
            }
          >
            <Download className="size-4" />
            Download settings backup
          </Button>
          <label className="block space-y-2 text-sm font-medium">
            Restore settings backup
            <input
              aria-label="Restore settings backup"
              disabled={!importAllowed}
              type="file"
              accept="application/json,.json"
              className="block w-full text-xs text-ink-600 file:mr-3 file:rounded-md file:border file:border-input file:bg-card file:px-3 file:py-2 file:text-ink"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setError("");
                if (file.size > 1000000)
                  return setError(
                    "Choose a settings backup smaller than 1 MB.",
                  );
                const content = await readFile(file, setError);
                if (content === null) return;
                const loaded = parseSettings(content, state.tenantId);
                if (loaded.recovered)
                  return setError(
                    "Invalid backup or a backup from another business.",
                  );
                setBackup(loaded.state);
                setRevision(state.revision);
              }}
            />
          </label>
          <p className="text-xs text-ink-500">
            Restore updates settings only. It does not delete invoices, stock or
            ledger records.
          </p>
        </SettingCard>
        <SettingCard title="Record exports & import preview">
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-md border border-input px-3 py-2 text-sm text-ink"
              to="/app/products"
            >
              Product exports
            </Link>
            <Link
              className="rounded-md border border-input px-3 py-2 text-sm text-ink"
              to="/app/sales"
            >
              Sales records
            </Link>
            <Link
              className="rounded-md border border-input px-3 py-2 text-sm text-ink"
              to="/app/daybook"
            >
              Daybook exports
            </Link>
          </div>
          <p className="text-xs text-ink-500">
            Record exports stay in their owning modules. Preview a simple
            product CSV mapping below; this demo does not create products.
          </p>
          <label className="block space-y-2 text-sm font-medium">
            Product CSV preview
            <input
              aria-label="Product CSV preview"
              disabled={!importAllowed}
              type="file"
              accept="text/csv,.csv"
              className="block w-full text-xs text-ink-600 file:mr-3 file:rounded-md file:border file:border-input file:bg-card file:px-3 file:py-2 file:text-ink"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (file.size > 100000)
                  return setError("Choose a CSV smaller than 100 KB.");
                const content = await readFile(file, setError);
                if (content === null) return;
                if (content.includes('"'))
                  return setError(
                    "This preview accepts plain comma-separated rows without quoted fields.",
                  );
                const rows = content
                  .trim()
                  .split(/\r?\n/)
                  .map((row) => row.split(",").map((v) => v.trim()));
                if (
                  rows.length < 2 ||
                  !rows[0].length ||
                  rows.some((row) => row.length !== rows[0].length)
                )
                  return setError(
                    "CSV must have a header and consistent columns.",
                  );
                setCsv(rows);
                setMapping({});
                setPreview(false);
                setError("");
              }}
            />
          </label>
          {csv.length > 0 && (
            <div className="space-y-3">
              {["Product name", "Category", "Base unit"].map((field) => (
                <label
                  key={field}
                  className="block space-y-1 text-xs font-medium"
                >
                  {field}
                  <AppSelect label={`Map ${field}`}
                    value={mapping[field] || ''}
                    onChange={(next) => setMapping({ ...mapping, [field]: next })}
                    options={[{ value: '', label: 'Choose CSV column' }, ...csv[0].map((header, i) => ({
                      value: String(i), label: header
                    }))]} />

                </label>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  if (!mapping["Product name"])
                    return setError(
                      "Map a product name column before previewing.",
                    );
                  setPreview(true);
                  setError("");
                }}
              >
                Preview import
              </Button>
              {preview && (
                <div
                  role="status"
                  className="rounded-lg bg-accent p-3 text-sm text-accent-foreground"
                >
                  {csv.length - 1} rows ready for review. First product:{" "}
                  {csv[1][Number(mapping["Product name"])] || "(empty name)"}.
                  No records imported.
                </div>
              )}
            </div>
          )}
        </SettingCard>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-danger-bg p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-success-bg p-3 text-sm text-success"
        >
          {notice}
        </p>
      )}
      {canManage(state,actorId,"audit.event.view") && <SettingsActivity events={state.events} />}
      <SettingsDialog
        title="Review settings restore"
        description="Review the affected sections before replacing their saved settings."
        open={!!backup}
        onClose={() => setBackup(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            Business: {backup?.sections.business.name}
          </p>
          {changed.length ? (
            <ul className="list-inside list-disc space-y-1 text-sm">
              {changed.map((k) => (
                <li key={k}>
                  {sectionNames[k as keyof typeof sectionNames].label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">
              This backup matches the current settings.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBackup(null)}>
              Cancel
            </Button>
            <Button
              disabled={!changed.length || !importAllowed}
              onClick={() => {
                if (!backup) return;
                const result = restore(backup, revision);
                if (!result.ok)
                  return setError(result.error || "Restore failed");
                setBackup(null);
                setNotice(
                  "Business settings restored. Existing records were preserved.",
                );
              }}
            >
              <Upload className="size-4" />
              Restore settings
            </Button>
          </div>
        </div>
      </SettingsDialog>
    </div>
  );
}
