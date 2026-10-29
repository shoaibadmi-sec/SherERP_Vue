import { SettingsTabs } from "./SettingsTabs";
import { SettingsDirectory } from "./SettingsDirectory";
import { settingsSubsections, businessFieldGroup } from "./subsections";
import { listenSettingsPop } from "./navigationGuard";
import { InterfaceSettings } from "./InterfaceSettings";
import type { ModuleViews } from "./moduleViews";
import { OutputDesignSettings } from "./OutputDesignSettings";
import { matchesSearch as fuzzyMatch } from "../utils/fuzzySearch";
import { AppSelect } from "../components/AppSelect";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useId,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Building2,
  ShoppingCart,
  Package,
  ReceiptText,
  Wallet,
  Printer,
  Users,
  Bell,
  SlidersHorizontal,
  Database,
  Save,
  RotateCcw,
  Settings2,
  CheckCircle2,
  ImagePlus,
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import {
  canManage,
  defaults,
  personalDefaults,
  type BusinessSection,
  type PersonalSettings,
  type SettingsSection,
  type SettingsSections,
} from "./model";
import { useTenantSettings } from "./TenantSettingsProvider";
import { sectionNames, settingsFields, type SettingField } from "./fields";
import {
  Button,
  Input,
  Switch,
  SettingCard,
  SettingsDialog,
  SettingsField,
} from "./ui";
import { TeamSettings } from "./TeamSettings";
import { DataSettings } from "./DataSettings";
import { FinancialTerminologySettings } from "./FinancialTerminologySettings";
import { DocumentDesignSettings } from "./DocumentDesignSettings";
import type { FinancialDisplay } from "../financial-display/model";
import { AccountSecuritySettings } from "./AccountSecuritySettings";

const icons = {
  interface: SlidersHorizontal,
  financialTerminology: Wallet,
  business: Building2,
  sales: ShoppingCart,
  products: Package,
  purchases: ReceiptText,
  money: Wallet,
  invoices: Printer,
  team: Users,
  notifications: Bell,
  personal: SlidersHorizontal,
  data: Database,
  security: ShieldCheck,
};
type Draft = SettingsSections[BusinessSection];
function LogoField({
  value,
  disabled,
  id,
  onChange,
  onReading,
}: {
  value: string;
  disabled: boolean;
  id: string;
  onChange: (v: string) => void;
  onReading: (v: boolean) => void;
}) {
  const [error, setError] = useState(""),
    [reading, setReading] = useState(false);
  const readerRef = useRef<FileReader | null>(null);
  useEffect(
    () => () => {
      readerRef.current?.abort();
    },
    [],
  );
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt="Business logo preview"
            className="size-14 rounded-lg border border-border bg-card object-contain p-1"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-lg border border-dashed border-input bg-ink-50 text-ink-500">
            <ImagePlus className="size-6" />
          </div>
        )}
        <input
          id={id}
          aria-label="Business logo"
          type="file"
          disabled={disabled || reading}
          accept="image/png,image/jpeg,image/webp"
          className="min-w-0 text-xs text-ink-600 file:mr-2 file:rounded-md file:border file:border-input file:bg-card file:px-2 file:py-2 file:text-ink"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setError("");
            if (
              !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
              file.size > 250000
            )
              return setError("Use a PNG, JPEG or WebP smaller than 250 KB.");
            setReading(true);
            onReading(true);
            const reader = new FileReader();
            readerRef.current = reader;
            reader.onerror = () => {
              setError("Could not read that image.");
              setReading(false);
              onReading(false);
            };
            reader.onload = () => {
              onChange(String(reader.result));
              setReading(false);
              onReading(false);
            };
            reader.readAsDataURL(file);
          }}
        />
      </div>
      {value && (
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onChange("")}
        >
          Remove logo
        </Button>
      )}
      {reading && (
        <p role="status" className="text-xs text-ink-500">
          Reading logo…
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
function Fields({
  fields,
  value,
  onChange,
  disabled,
  language,
  onReading,
}: {
  fields: SettingField[];
  value: Draft;
  onChange: Dispatch<SetStateAction<Draft>>;
  disabled: boolean;
  language: string;
  onReading: (v: boolean) => void;
}) {
  const data = value as unknown as Record<string, unknown>;
  return (
    <div className="grid gap-x-6 gap-y-5 md:[grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))]">
      {fields.map((field) => {
        const v = data[field.key];
        const update = (next: unknown) =>
          onChange((previous) => ({ ...previous, [field.key]: next }));
        return (
          <div
            key={field.key}
            data-field-key={field.key}
            className={
              field.kind === "textarea" || field.kind === "logo"
                ? "md:col-span-full"
                : ""
            }
          >
            <SettingsField
              label={field.label}
              bn={field.bn}
              language={language}
              hint={`${field.hint}${field.live ? " Connected in this UI." : ""}`}
            >
              {(id, descriptionId) => {
                if (field.kind === "switch")
                  return (
                    <Switch
                      id={id}
                      aria-label={field.label}
                      aria-describedby={descriptionId}
                      checked={v as boolean}
                      onCheckedChange={update}
                      disabled={disabled}
                    />
                  );
                if (field.kind === "select")
                  return (
                    <AppSelect
                      id={id}
                      describedBy={descriptionId}
                      label={field.label}
                      value={v as string}
                      onChange={update}
                      disabled={disabled}
                      options={field.options ?? []}
                    />
                  );
                if (field.kind === "textarea")
                  return (
                    <textarea
                      id={id}
                      aria-label={field.label}
                      aria-describedby={descriptionId}
                      className="min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-ink disabled:opacity-70"
                      value={v as string}
                      onChange={(e) => update(e.target.value)}
                      disabled={disabled}
                    />
                  );
                if (field.kind === "logo")
                  return (
                    <LogoField
                      id={id}
                      disabled={disabled}
                      value={v as string}
                      onChange={update}
                      onReading={onReading}
                    />
                  );
                return (
                  <Input
                    id={id}
                    aria-label={field.label}
                    aria-describedby={descriptionId}
                    type={field.kind}
                    min={field.min}
                    max={field.max}
                    step={field.kind === "number" ? 1 : undefined}
                    disabled={disabled}
                    value={
                      typeof v === "number" && !Number.isFinite(v)
                        ? ""
                        : (v as string | number)
                    }
                    onChange={(e) =>
                      update(
                        field.kind === "number"
                          ? e.target.value === ""
                            ? NaN
                            : Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                );
              }}
            </SettingsField>
          </div>
        );
      })}
    </div>
  );
}
export function SettingsPageContent({
  sectionOverride,
  embedded = false,
}: { sectionOverride?: SettingsSection; embedded?: boolean } = {}) {
  const { section: routeSection } = useParams();
  const navigate = useNavigate();
  const routeState = useLocation().state as {
    settingsTabFocus?: string;
  } | null;
  const section: SettingsSection =
    sectionOverride ??
    (routeSection && routeSection in sectionNames
      ? (routeSection as SettingsSection)
      : "business");
  const { state, personal, actorId, setActorId, save, updatePersonal } =
    useTenantSettings();
  const { theme, setTheme } = useTheme();
  const [readingLogo, setReadingLogo] = useState(false);
  const [draft, setDraft] = useState<Draft>(() =>
    structuredClone(
      state.sections[
        section === "personal" || section === "data" || section === "security"
          ? "business"
          : section
      ],
    ),
  );
  const [baseline, setBaseline] = useState(JSON.stringify(draft)),
    [revision, setRevision] = useState(state.revision);
  const [personalDraft, setPersonalDraft] = useState<PersonalSettings>({
      ...personal,
    }),
    [themeDraft, setThemeDraft] = useState(theme);
  const [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [resetOpen, setResetOpen] = useState(false),
    [reviewOpen, setReviewOpen] = useState(false),
    [leaveOpen, setLeaveOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const tabsId = "settings-" + useId().replace(/:/g, "");
  const [activeSubsections, setActiveSubsections] = useState<
    Record<string, string>
  >({});
  const subsections =
    settingsSubsections[section as keyof typeof settingsSubsections] ?? [];
  const activeSubsection =
    activeSubsections[section] ?? subsections[0]?.id ?? "";
  const selectSubsection = (id: string) =>
    setActiveSubsections((previous) => ({ ...previous, [section]: id }));
  useLayoutEffect(() => {
    if (!embedded && routeState?.settingsTabFocus === section)
      document
        .getElementById(`${tabsId}-${window.matchMedia('(min-width: 1024px)').matches ? 'directory' : 'main'}-${section}`)
        ?.focus({ preventScroll: true });
  }, [section, embedded, routeState, tabsId]);
  const personalDirty =
    JSON.stringify({ ...personalDraft, mode: personal.mode }) !==
      JSON.stringify(personal) || themeDraft !== theme;
  const dirty =
    section === "personal"
      ? personalDirty
      : section === "data" || section === "security"
        ? false
        : JSON.stringify(draft) !== baseline;
  const editable =
    section === "personal" ||
    section === "security" ||
    (section !== "data" && canManage(state, actorId, section));
  const canView =
    section === "personal" ||
    section === "security" ||
    canManage(state, actorId, "view") ||
    (section === "team" &&
      (canManage(state, actorId, "user.account.view") ||
        canManage(state, actorId, "user.role.view")));
  const load = () => {
    const next = structuredClone(
      state.sections[
        section === "personal" || section === "data" || section === "security"
          ? "business"
          : section
      ],
    );
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setRevision(state.revision);
    setPersonalDraft({ ...personal });
    setThemeDraft(theme);
    setError("");
  };
  useEffect(() => {
    load();
    setNotice("");
  }, [section, actorId]);
  function requestChange(action: () => void) {
    if (dirty) {
      pending.current = action;
      setLeaveOpen(true);
    } else action();
  }
  useLayoutEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest?.("a");
      if (!link || link.hasAttribute("download") || link.target === "_blank")
        return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.hash === location.hash) return;
      event.preventDefault();
      event.stopPropagation();
      pending.current = () => navigate(url.hash.slice(1));
      setLeaveOpen(true);
    };
    const originalUrl = location.href;
    const originalHistoryState = window.history.state;
    let resuming = false;
    const pop = (event: PopStateEvent) => {
      if (resuming) {
        resuming = false;
        return;
      }
      if (location.href === originalUrl) {
        event.stopImmediatePropagation();
        return;
      }
      const target = location.hash.slice(1);
      event.stopImmediatePropagation();
      const fromIndex = originalHistoryState?.idx,
        toIndex = event.state?.idx;
      if (
        Number.isInteger(fromIndex) &&
        Number.isInteger(toIndex) &&
        fromIndex !== toIndex
      ) {
        window.history.go(fromIndex - toIndex);
        pending.current = () => {
          resuming = true;
          window.history.go(toIndex - fromIndex);
        };
      } else {
        // External hash entries may have no router index. Keep the current draft visible.
        window.history.pushState(originalHistoryState, "", originalUrl);
        pending.current = () => navigate(target, { replace: true });
      }
      setLeaveOpen(true);
    };
    const stopPop = listenSettingsPop(pop);
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      stopPop();
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty, navigate]);
  const commit = (): boolean => {
    setError("");
    if (section === "personal") {
      updatePersonal({ ...personalDraft, mode: personal.mode });
      setTheme(themeDraft);
      setNotice("Personal preferences saved for this device.");
      return true;
    }
    if (section === "data" || section === "security") return false;
    const result = save(section, draft as never, revision);
    if (!result.ok) {
      setError(result.error || "Could not save settings.");
      setReviewOpen(false);
      return false;
    }
    setRevision(result.revision ?? state.revision + 1);
    setBaseline(JSON.stringify(draft));
    setNotice(
      result.persisted === false
        ? "Changes are in memory only. Download a backup before leaving."
        : "Business settings saved.",
    );
    setReviewOpen(false);
    return true;
  };
  const changes =
    section === "personal" || section === "data" || section === "security"
      ? []
      : (settingsFields[section] || []).filter(
          (field) =>
            JSON.stringify(
              (draft as unknown as Record<string, unknown>)[field.key],
            ) !==
            JSON.stringify(
              (state.sections[section] as unknown as Record<string, unknown>)[
                field.key
              ],
            ),
        );
  const needsReview = changes.some((f) =>
    ["rounding", "allocation", "prefix", "lockDate"].includes(f.key),
  );
  const categoryResults = (Object.keys(sectionNames) as SettingsSection[])
    .filter((key) =>
      fuzzyMatch(query, [
        sectionNames[key].label,
        sectionNames[key].bn,
        sectionNames[key].description,
      ]),
    )
    .map((key) => ({
      section: key,
      field: {
        key: "",
        label: sectionNames[key].label,
        bn: sectionNames[key].bn,
        hint: "",
        kind: "text" as const,
        advanced: key === "team",
      },
    }));
  const results = query.trim()
    ? Object.entries(settingsFields)
        .flatMap(([key, fields]) =>
          fields!
            .filter((f) =>
              fuzzyMatch(query, [
                f.label,
                f.bn,
                f.hint,
                sectionNames[key as SettingsSection].label,
              ]),
            )
            .map((field) => ({ section: key as SettingsSection, field })),
        )
        .concat(categoryResults)
        .slice(0, 12)
    : [];
  const info = sectionNames[section],
    Icon = icons[section];
  return (
    <div data-settings-dirty={dirty} className="erp-settings min-w-0 flex-1 space-y-5">
      <header className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Icon aria-hidden="true" className="size-5 text-primary lg:hidden" />
            <h1
              data-testid="settings-title"
              className="text-xl font-semibold tracking-tight text-ink"
            >
              {personal.language === "Bangla" ? info.bn : info.label}
            </h1>
            {personal.language === "English + Bangla" && (
              <span lang="bn" className="font-bn text-xs text-helper">
                {info.bn}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-ink-500">{section === 'team'
            ? 'Manage who can access this business and what they can do.'
            : info.description}</p>
          <p className="mt-1 text-[11px] text-helper">Settings · {state.sections.business.name} · UI preview</p>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-end gap-3 md:w-auto">
          <div
            className="relative w-full md:w-64"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setQuery("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setQuery("");
                event.currentTarget.querySelector("input")?.focus();
              }
            }}
          >
            <Input
              type="search"
              aria-label="Search settings"
              placeholder={personal.language === "Bangla" ? "সেটিং খুঁজুন…" : "Search settings…"}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <div
                className="absolute left-0 z-30 mt-2 max-h-80 w-full max-w-[calc(100vw-2rem)] space-y-1 overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-pop md:w-96"
                role="region"
                aria-label="Settings search results"
              >
                {results.length ? (
                  results.map(({ section: s, field }) => (
                    <button
                      type="button"
                      key={`${s}-${field.key}`}
                      className="block w-full rounded-md px-2 py-2 text-left text-xs text-ink hover:bg-accent"
                      onClick={() => {
                        const reveal = () => {
                          if (s === "business")
                            setActiveSubsections((previous) => ({
                              ...previous,
                              business: businessFieldGroup(field.key),
                            }));
                          if (s === "invoices")
                            setActiveSubsections((previous) => ({
                              ...previous,
                              invoices: "invoice",
                            }));
                          if (field.advanced)
                            updatePersonal({ mode: "Advanced" });
                          if (s !== section || embedded)
                            navigate(`/app/settings/${s}`);
                          setQuery("");
                          setTimeout(
                            () =>
                              document
                                .querySelector(`[data-field-key="${field.key}"]`)
                                ?.querySelector<HTMLElement>(
                                  "input,textarea,button,[role=combobox]",
                                )
                                ?.focus(),
                            100,
                          );
                        };
                        if (s === section && !embedded) reveal();
                        else requestChange(reveal);
                      }}
                    >
                      {field.label}
                      <span className="mt-1 block text-[10px] text-ink-500">
                        {sectionNames[s].label}
                        {field.advanced ? " · Advanced" : ""}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="p-2 text-xs text-ink-500">
                    No matching settings.
                  </p>
                )}
              </div>
            )}
          </div>
          <label className="min-w-0 space-y-1 text-[11px] font-medium text-ink-600">
            Preview as
            <AppSelect
              label="Demo employee access"
              value={actorId}
              onChange={(id) => requestChange(() => setActorId(id))}
              options={state.sections.team.employees.map((e) => ({
                value: e.id,
                label: e.name + (!e.active ? " · Disabled" : ""),
              }))}
            />
          </label>
          <fieldset className="flex rounded-lg border border-border bg-card p-1">
            <legend className="sr-only">Settings mode</legend>
            {(["Simple", "Advanced"] as const).map((mode) => (
              <label
                key={mode}
                className={`cursor-pointer rounded-md px-3 py-2 text-xs font-medium ${personal.mode === mode ? "bg-accent text-accent-foreground" : "text-ink-600"}`}
              >
                <input
                  className="mr-1.5 size-3"
                  type="radio"
                  name="settings-mode"
                  value={mode}
                  checked={personal.mode === mode}
                  onChange={() => updatePersonal({ mode })}
                />
                {mode}
              </label>
            ))}
          </fieldset>
        </div>
      </header>
      <div className={embedded ? "min-w-0" : "grid min-w-0 items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"}>
        {!embedded && <SettingsDirectory
          items={Object.entries(sectionNames).map(([id, item])=>({ id, ...item }))}
          selected={section} language={personal.language}
          id={`${tabsId}-directory`} panelId={`${tabsId}-content`}
          onSelect={(value)=>{ if (value !== section) requestChange(()=>navigate(`/app/settings/${value}`, { state:{settingsTabFocus:value} })); }}
        />}
        <div className="min-w-0 space-y-4 lg:space-y-0">
      {!embedded && (
        <div className="lg:hidden"><SettingsTabs
          id={`${tabsId}-main`}
          panelId={`${tabsId}-content`}
          label="Settings categories"
          value={section}
          language={personal.language}
          items={Object.entries(sectionNames).map(([id, item]) => ({
            id,
            ...item,
          }))}
          onChange={(value) => {
            if (value !== section)
              requestChange(() =>
                navigate(`/app/settings/${value}`, {
                  state: { settingsTabFocus: value },
                }),
              );
          }}
        /></div>
      )}
      <div
        id={`${tabsId}-content`}
        role={embedded ? undefined : "tabpanel"}
        aria-labelledby={embedded ? undefined : `${tabsId}-main-${section}`}
        className="min-w-0 space-y-4"
      >
        {subsections.length > 0 && (
          <aside className="min-w-0 self-start">
            <SettingsTabs
              secondary inline
              id={`${tabsId}-sub`}
              panelId={`${tabsId}-sub-content`}
              label={`${info.label} sub-settings`}
              libraryTitle={personal.language === "Bangla" ? info.bn : info.label}
              libraryGroup={personal.language === "Bangla" ? "এই বিভাগের সেটিংস" : "In this section"}
              value={activeSubsection}
              language={personal.language}
              items={subsections}
              onChange={selectSubsection}
            />
          </aside>
        )}
        <div
          data-settings-subpanel
          id={`${tabsId}-sub-content`}
          role={subsections.length ? "tabpanel" : undefined}
          aria-labelledby={
            subsections.length ? `${tabsId}-sub-${activeSubsection}` : undefined
          }
          className="min-w-0 space-y-4"
        >
          {!canView ? (
            <SettingCard title="Settings access unavailable">
              <p className="text-sm text-ink-600">
                This demo employee has no active settings access. Choose another
                demo employee or open My preferences.
              </p>
            </SettingCard>
          ) : section === "security" ? (
            <AccountSecuritySettings language={personal.language} />
          ) : section === "data" ? (
            <DataSettings />
          ) : (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!dirty || !editable || readingLogo) return;
                needsReview ? setReviewOpen(true) : commit();
              }}
              className={section === 'team' && !embedded ? 'flex min-h-[calc(100vh-14rem)] flex-col gap-4' : 'space-y-4'}
            >
              {!editable && (
                <p
                  role="status"
                  className="rounded-lg bg-info-bg p-3 text-xs text-info"
                >
                  Read-only access. An authorized business employee can change
                  this section. Advanced mode does not grant extra permissions.
                </p>
              )}
              {section === "team" ? (
                  <TeamSettings
                    state={state}
                    actorId={actorId}
                    language={personal.language}
                    value={draft as SettingsSections["team"]}
                    disabled={!editable}
                    advanced={personal.mode === "Advanced"}
                    onChange={setDraft}
                  />
              ) : section === "interface" ? (
                <InterfaceSettings
                  value={draft as ModuleViews}
                  onChange={setDraft}
                  disabled={!editable}
                />
              ) : section === "financialTerminology" ? (
                <FinancialTerminologySettings
                  value={draft as FinancialDisplay}
                  disabled={!editable}
                  language={personal.language}
                  onChange={setDraft}
                />
              ) : section === "personal" ? (
                <>
                  <SettingCard title="Appearance & language">
                    <div className="grid gap-5 md:grid-cols-2">
                      <SettingsField
                        label="Appearance"
                        bn="চেহারা"
                        language={personal.language}
                        hint="Uses your existing Light, Dark and System theme setting."
                      >
                        {(id) => (
                          <AppSelect
                            id={id}
                            label="Appearance"
                            value={themeDraft}
                            onChange={(next) =>
                              setThemeDraft(next as typeof theme)
                            }
                            options={[
                              { value: "light", label: "Light" },
                              { value: "dark", label: "Dark" },
                              { value: "system", label: "System" },
                            ]}
                          />
                        )}
                      </SettingsField>
                      <SettingsField
                        label="Language"
                        bn="ভাষা"
                        language={personal.language}
                        hint="Applies to settings and navigation. Existing module content remains in its current language."
                      >
                        {(id) => (
                          <AppSelect
                            id={id}
                            label="Language"
                            value={personalDraft.language}
                            onChange={(language) =>
                              setPersonalDraft({
                                ...personalDraft,
                                language:
                                  language as PersonalSettings["language"],
                              })
                            }
                            options={["English + Bangla", "English", "Bangla"]}
                          />
                        )}
                      </SettingsField>
                    </div>
                  </SettingCard>
                  <SettingCard title="Global search · সার্চ">
                    <SettingsField
                      label="Search matching"
                      bn="খোঁজার ধরন"
                      language={personal.language}
                      hint="Both modes tolerate spelling mistakes. Default requires all words; Advanced also finds partial words and broader text matches. Numeric references stay exact. Enter opens the first result."
                    >
                      {(id) => (
                        <AppSelect
                          id={id}
                          label="Search matching"
                          value={personalDraft.searchMode}
                          onChange={(searchMode) =>
                            setPersonalDraft({
                              ...personalDraft,
                              searchMode:
                                searchMode as PersonalSettings["searchMode"],
                            })
                          }
                          options={[
                            {
                              value: "Default",
                              label: "Default — focused fuzzy search",
                            },
                            {
                              value: "Advanced",
                              label: "Advanced — broader fuzzy search",
                            },
                          ]}
                        />
                      )}
                    </SettingsField>
                  </SettingCard>
                  {personal.mode === "Advanced" && (
                    <SettingCard title="Advanced display preferences">
                      <div className="grid gap-5 md:grid-cols-2">
                        <SettingsField
                          label="Table density"
                          bn="টেবিলের ঘনত্ব"
                          hint="Changes row spacing across this business workspace."
                        >
                          {(id) => (
                            <AppSelect
                              id={id}
                              label="Table density"
                              value={personalDraft.density}
                              onChange={(density) =>
                                setPersonalDraft({
                                  ...personalDraft,
                                  density:
                                    density as PersonalSettings["density"],
                                })
                              }
                              options={["Compact", "Comfortable"]}
                            />
                          )}
                        </SettingsField>
                        <SettingsField
                          label="Financial terminology"
                          bn="হিসাবের ভাষা"
                          hint="Uses the existing finance and daybook terminology preference."
                        >
                          {(id) => (
                            <AppSelect
                              id={id}
                              label="Financial terminology"
                              value={personalDraft.terminology}
                              onChange={(terminology) =>
                                setPersonalDraft({
                                  ...personalDraft,
                                  terminology:
                                    terminology as PersonalSettings["terminology"],
                                })
                              }
                              options={[
                                { value: "simple", label: "Simple words" },
                                {
                                  value: "accounting",
                                  label: "Accounting terms",
                                },
                              ]}
                            />
                          )}
                        </SettingsField>
                        <SettingsField
                          label="Transaction date display"
                          bn="লেনদেনের তারিখ"
                          hint="Uses the existing daybook date display preference."
                        >
                          {(id) => (
                            <AppSelect
                              id={id}
                              label="Transaction date display"
                              value={personalDraft.dateView}
                              onChange={(dateView) =>
                                setPersonalDraft({
                                  ...personalDraft,
                                  dateView:
                                    dateView as PersonalSettings["dateView"],
                                })
                              }
                              options={[
                                {
                                  value: "transaction",
                                  label: "Transaction date",
                                },
                                { value: "created", label: "Entry date" },
                              ]}
                            />
                          )}
                        </SettingsField>
                      </div>
                    </SettingCard>
                  )}
                </>
              ) : section === "business" ? (
                <>
                  {settingsSubsections.business.map((group) => (
                    <div key={group.id} hidden={activeSubsection !== group.id}>
                      <SettingCard
                        title={
                          personal.language === "Bangla"
                            ? group.bn
                            : group.label
                        }
                      >
                        <Fields
                          fields={(settingsFields.business ?? []).filter(
                            (field) =>
                              businessFieldGroup(field.key) === group.id &&
                              (!field.advanced || personal.mode === "Advanced"),
                          )}
                          value={draft}
                          onChange={setDraft}
                          disabled={!editable}
                          language={personal.language}
                          onReading={setReadingLogo}
                        />
                        {group.id === "general" && (
                          <p className="border-t border-border pt-4 text-xs text-helper">
                            Currency: BDT · Timezone: Asia/Dhaka
                          </p>
                        )}
                      </SettingCard>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {(section !== "invoices" ||
                    (activeSubsection === "invoice" &&
                      (settingsFields.invoices || []).some(
                        (f) =>
                          !f.advanced &&
                          ["prefix", "copies", "showPurchaseCost"].includes(
                            f.key,
                          ),
                      ))) && (
                    <SettingCard title="Common settings">
                      <Fields
                        fields={(settingsFields[section] || []).filter(
                          (f) =>
                            !f.advanced &&
                            (section !== "invoices" ||
                              ["prefix", "copies", "showPurchaseCost"].includes(
                                f.key,
                              )),
                        )}
                        value={draft}
                        onChange={setDraft}
                        disabled={!editable}
                        language={personal.language}
                        onReading={setReadingLogo}
                      />
                    </SettingCard>
                  )}
                  {personal.mode === "Advanced" &&
                    (section !== "invoices" ||
                      activeSubsection === "invoice") &&
                    (settingsFields[section] || []).some((f) => f.advanced) && (
                      <SettingCard title="Advanced settings">
                        <Fields
                          fields={(settingsFields[section] || []).filter(
                            (f) =>
                              f.advanced &&
                              (section !== "invoices" ||
                                [
                                  "prefix",
                                  "copies",
                                  "showPurchaseCost",
                                ].includes(f.key)),
                          )}
                          value={draft}
                          onChange={setDraft}
                          disabled={!editable}
                          language={personal.language}
                          onReading={setReadingLogo}
                        />
                      </SettingCard>
                    )}
                  {section === "products" && (
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/app/products?view=settings&tab=categories"
                        className="rounded-md border border-input bg-card px-3 py-2 text-xs text-ink"
                      >
                        Manage categories
                      </Link>
                      <Link
                        to="/app/products?view=settings&tab=units"
                        className="rounded-md border border-input bg-card px-3 py-2 text-xs text-ink"
                      >
                        Manage units
                      </Link>
                      <Link
                        to="/app/products?view=settings&tab=brands"
                        className="rounded-md border border-input bg-card px-3 py-2 text-xs text-ink"
                      >
                        Manage brands
                      </Link>
                    </div>
                  )}
                  {section === "money" && (
                    <Link
                      className="inline-block text-sm text-teal-700 hover:underline"
                      to="/app/accounts"
                    >
                      Open accounts management →
                    </Link>
                  )}
                  {section === "invoices" && (
                    <>
                      <div hidden={activeSubsection !== "invoice"}>
                        <DocumentDesignSettings
                          value={draft as SettingsSections["invoices"]}
                          business={state.sections.business}
                          disabled={!editable}
                          onChange={setDraft}
                        />
                      </div>
                      <div hidden={activeSubsection !== "output"}>
                        <OutputDesignSettings
                          value={draft as SettingsSections["invoices"]}
                          business={state.sections.business}
                          disabled={!editable}
                          onChange={setDraft}
                        />
                      </div>
                    </>
                  )}
                  {section === "notifications" && (
                    <SettingCard title="Notification preview">
                      <p className="text-sm text-ink-600">
                        {
                          (draft as SettingsSections["notifications"])
                            .smsTemplate
                        }
                      </p>
                      <p className="text-xs text-ink-500">
                        Example delivery:{" "}
                        {(draft as SettingsSections["notifications"]).channel} ·{" "}
                        {(draft as SettingsSections["notifications"]).time}{" "}
                        Asia/Dhaka. No message is sent.
                      </p>
                      <p className="text-xs text-ink-500">
                        Configure shared sales completion, due collection and
                        courier SMS event switches in Online Sales. SMS sending
                        remains disconnected in this UI preview.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          to="/app/notifications"
                          className="inline-block text-xs text-teal-700 hover:underline"
                        >
                          Configure ERP-wide SMS alerts →
                        </Link>
                        <Link
                          to="/app/subscription"
                          className="inline-block text-xs text-teal-700 hover:underline"
                        >
                          Review SMS packages & credits →
                        </Link>
                      </div>
                    </SettingCard>
                  )}
                  {section === "sales" && (
                    <SettingCard title="POS setup preview">
                      <p className="text-sm text-ink-600">
                        First payment:{" "}
                        {(draft as SettingsSections["sales"]).defaultPayment} ·
                        Rounding:{" "}
                        {(draft as SettingsSections["sales"]).rounding}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {[
                          "Name",
                          ...((draft as SettingsSections["sales"]).customerPhone
                            ? ["Phone"]
                            : []),
                          ...((draft as SettingsSections["sales"]).guardian
                            ? ["Guardian"]
                            : []),
                          ...((draft as SettingsSections["sales"]).address
                            ? ["Address"]
                            : []),
                        ].map((v) => (
                          <span
                            key={v}
                            className="rounded border border-border px-2 py-1 text-ink-600"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-ink-500">
                        Compound quantity: 2 Box 5 Pcs · Additional payments:
                        available · Shortage: Own Stock / Negative Sale / Vendor
                      </p>
                    </SettingCard>
                  )}
                </>
              )}
              {personal.mode === "Simple" && section !== "team" && (
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs text-teal-700 hover:underline"
                  onClick={() => updatePersonal({ mode: "Advanced" })}
                >
                  <Settings2 className="size-4" />
                  Show advanced options
                </button>
              )}
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
                  className="flex items-center gap-2 rounded-lg bg-success-bg p-3 text-sm text-success"
                >
                  <CheckCircle2 className="size-4" />
                  {notice}
                </p>
              )}
              <div className={section === 'team' && !embedded
                ? 'sticky bottom-0 z-10 -mx-3 mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-3 py-3 sm:-mx-4 sm:px-4 lg:-mx-8 lg:px-8'
                : 'sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-pop'}>
                <div className="text-xs text-ink-500">
                  {dirty
                    ? "Unsaved changes"
                    : section === "personal"
                      ? "Saved on this device"
                      : "Business-wide settings"}
                  {section === "products" && (
                    <span className="mt-1 block">
                      New product defaults; existing products retain their
                      values.
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!editable}
                    onClick={() => setResetOpen(true)}
                  >
                    <RotateCcw className="size-4" />
                    Restore defaults
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!dirty}
                    onClick={() => {
                      load();
                      setNotice("Draft discarded. Latest saved values loaded.");
                    }}
                  >
                    Discard
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!dirty || !editable || readingLogo}
                  >
                    <Save className="size-4" />
                    Save changes
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
      </div>
      </div>
      <footer className="flex flex-wrap gap-4 text-xs">
        {state.sections.team.employees
          .find((e) => e.id === actorId)
          ?.roleIds.includes("owner") && (
          <Link className="text-primary hover:underline" to="/app/subscription">
            Subscription & SMS credits
          </Link>
        )}
        <Link className="text-primary hover:underline" to="/app/support">
          Get support
        </Link>
      </footer>
      <SettingsDialog
        title="Discard unsaved changes?"
        description="Your saved settings will be kept. Changes in this form will be discarded."
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
      >
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            onClick={() => {
              if (commit()) {
                setLeaveOpen(false);
                pending.current?.();
                pending.current = null;
              }
            }}
          >
            Save and continue
          </Button>
          <Button variant="outline" onClick={() => setLeaveOpen(false)}>
            Keep editing
          </Button>
          <Button
            onClick={() => {
              setLeaveOpen(false);
              pending.current?.();
              pending.current = null;
            }}
          >
            Discard and continue
          </Button>
        </div>
      </SettingsDialog>
      <SettingsDialog
        title="Restore section defaults?"
        description={`This replaces the ${info.label} form with example defaults. Save changes to apply them; existing records are preserved.`}
        open={resetOpen}
        onClose={() => setResetOpen(false)}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (section === "personal") {
                setPersonalDraft({ ...personalDefaults, mode: personal.mode });
                setThemeDraft("system");
              } else if (section !== "data" && section !== "security")
                setDraft(
                  structuredClone(defaults(state.tenantId).sections[section]),
                );
              setResetOpen(false);
              setNotice("Defaults loaded into this draft. Save to apply.");
            }}
          >
            Load defaults
          </Button>
        </div>
      </SettingsDialog>
      <SettingsDialog
        title="Review settings changes"
        description="These defaults affect future entry. Existing invoice IDs, unit conversions and sold warranty snapshots are preserved."
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
      >
        <div className="space-y-3">
          {changes.map((f) => (
            <div
              key={f.key}
              className="rounded-lg border border-border p-3 text-sm"
            >
              <p className="font-medium">{f.label}</p>
              <p className="mt-1 text-xs text-ink-500">
                {String(
                  (
                    state.sections[
                      section as BusinessSection
                    ] as unknown as Record<string, unknown>
                  )[f.key] || "Not set",
                )}{" "}
                →{" "}
                {String(
                  (draft as unknown as Record<string, unknown>)[f.key] ||
                    "Not set",
                )}
              </p>
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Keep editing
            </Button>
            <Button onClick={commit}>Confirm save</Button>
          </div>
        </div>
      </SettingsDialog>
    </div>
  );
}

export function TenantSettingsPage() {
  const { section } = useParams();
  return <SettingsPageContent key={section || "business"} />;
}
