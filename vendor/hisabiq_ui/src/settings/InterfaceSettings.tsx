import { useState } from "react";
import {
  moduleViewCatalog,
  type ModuleViews,
  type ViewModule,
} from "./moduleViews";
import { useModuleColumns } from "./useModuleColumns";
import { Button, SettingCard, SettingsField } from "./ui";
import { AppSelect } from "../components/AppSelect";
function Columns({
  module,
  value,
  onChange,
  disabled,
}: {
  module: ViewModule;
  value: ModuleViews;
  onChange: (v: ModuleViews) => void;
  disabled: boolean;
}) {
  const [scope, setScope] = useState("mine");
  const def = moduleViewCatalog[module];
  const personal = useModuleColumns(
    module,
    def.key,
    Object.fromEntries(def.columns.map((k) => [k, true])),
  );
  const columns =
    scope === "mine"
      ? personal.columns
      : {
          ...Object.fromEntries(def.columns.map((k) => [k, true])),
          ...value[module],
        };
  return (
    <SettingCard title={`${def.label} columns · কলাম`}>
      {" "}
      <SettingsField label="Apply to" bn="কার জন্য">
        {(id) => (
          <AppSelect
            id={id}
            label="Apply to"
            value={scope}
            onChange={setScope}
            options={[
              { value: "mine", label: "My view · Saves instantly" },
              ...(!disabled
                ? [
                    {
                      value: "business",
                      label: "Business defaults · Save changes to apply",
                    },
                  ]
                : []),
            ]}
          />
        )}
      </SettingsField>
      <div className="grid gap-3 sm:grid-cols-2">
        {def.columns.map((k) => {
          const essential = (def.essential as readonly string[]).includes(k);
          return (
            <label
              key={k}
              className="flex items-center justify-between gap-2 text-[13px]"
            >
              <span>
                {k
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (x) => x.toUpperCase())}
                {essential && (
                  <span className="ml-2 text-xs text-helper">Required</span>
                )}
              </span>
              <input
                type="checkbox"
                disabled={essential || (scope === "business" && disabled)}
                checked={essential || columns[k] !== false}
                onChange={(e) =>
                  scope === "mine"
                    ? personal.setColumns({
                        ...personal.columns,
                        [k]: e.target.checked,
                      })
                    : onChange({
                        ...value,
                        [module]: { ...value[module], [k]: e.target.checked },
                      })
                }
              />
            </label>
          );
        })}
      </div>
      <Button
        variant="outline"
        onClick={() =>
          scope === "mine"
            ? personal.reset()
            : onChange({ ...value, [module]: {} })
        }
      >
        Use inherited defaults
      </Button>
      <p role="status" className="text-xs text-helper">
        {personal.warning ||
          (scope === "mine"
            ? "Your choices affect only this browser. Hiding a column does not revoke permission to its data."
            : "Business defaults affect inheriting views; personal choices remain. Save changes to apply.")}
      </p>
      <p className="text-xs text-helper">
        Column choices change layout only. This preview does not enforce
        confidential data access; production requires source-level permission
        filtering. Report columns remain in the Reports column chooser.
      </p>
    </SettingCard>
  );
}
export function InterfaceSettings(props: {
  value: ModuleViews;
  onChange: (v: ModuleViews) => void;
  disabled: boolean;
}) {
  const [module, setModule] = useState<ViewModule>("sales");
  return (
    <div className="space-y-3">
      <SettingsField label="Module" bn="মডিউল">
        {(id) => (
          <AppSelect
            id={id}
            label="Module"
            value={module}
            onChange={(v) => setModule(v as ViewModule)}
            options={Object.entries(moduleViewCatalog).map(([value, d]) => ({
              value,
              label: d.label,
            }))}
          />
        )}
      </SettingsField>
      <Columns key={module} module={module} {...props} />
    </div>
  );
}
