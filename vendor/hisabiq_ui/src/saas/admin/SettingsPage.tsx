import { useSaas, command } from "../SaasProvider";
import { can } from "../permissions";
import {
  Heading,
  Card,
  Field,
  Input,
  Button,
  Actions,
  Badge,
} from "../components";
export function SettingsPage() {
  const { state: s, actor, dispatch, resetDemo } = useSaas();
  const editable = can(s, actor, "settings.edit");
  return (
    <>
      <Heading
        title="Platform settings"
        bn="সেটিংস · Keep policies explicit and simple"
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Billing and messaging policies">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              dispatch(
                command("settings.update", undefined, {
                  ...f,
                  releaseFailed: f.releaseFailed === "on",
                }),
              );
            }}
          >
            <Field label="Currency">
              <Input value="BDT" readOnly />
            </Field>
            <Field label="Business timezone">
              <Input value="Asia/Dhaka" readOnly />
            </Field>
            <Field label="Grace period (days)">
              <Input
                name="grace"
                type="number"
                min="0"
                max="90"
                defaultValue={s.settings.grace}
                disabled={!editable}
                required
              />
            </Field>
            <Field label="Collection account label">
              <Input
                name="collectionAccount"
                defaultValue={s.settings.collectionAccount}
                disabled={!editable}
                required
              />
            </Field>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                name="releaseFailed"
                defaultChecked={s.settings.releaseFailed}
                disabled={!editable}
              />
              Release failed-message reservations in demo
            </label>
            <p className="text-xs text-ink-500">
              Production refunds and charging depend on provider policy. No real
              credentials are stored here.
            </p>
            {editable && (
              <Actions>
                <Button type="submit">Save policies</Button>
              </Actions>
            )}
          </form>
        </Card>
        <div className="space-y-5">
          <Card title="Integrations">
            <div className="flex justify-between text-sm">
              <span>Payment gateways</span>
              <Badge>Disconnected</Badge>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span>SMS provider</span>
              <Badge>Disconnected</Badge>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-ink-500">
              Manual evidence review works in this prototype. Secure provider
              setup, webhooks and actual sends require backend integration.
              Connection tests are unavailable until an integration is
              configured.
            </p>
          </Card>
          {editable && (
            <Card title="Demo data">
              <p className="text-xs text-ink-500">
                Reset removes local demo changes and restores example records in
                this browser.
              </p>
              <Actions>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Reset all SaaS demo changes in this browser?",
                      )
                    )
                      resetDemo();
                  }}
                >
                  Reset demo data
                </Button>
              </Actions>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
