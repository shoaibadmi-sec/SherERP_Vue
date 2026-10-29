import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useSaas } from "./SaasProvider";
import { can } from "./permissions";
import { Heading, Card, Metric, Badge, Empty, money } from "./components";
export function OverviewPage() {
  const { state: s, actor } = useSaas();
  const tenants = s.tenants.filter((t) => can(s, actor, "tenants.view", t.id));
  const payments = s.payments.filter(
    (p) =>
      can(s, actor, "payments.verify", p.tenantId) && p.status === "Pending",
  );
  const tickets = s.tickets.filter(
    (t) =>
      can(s, actor, "support.view", t.tenantId) &&
      !["Resolved", "Closed"].includes(t.status),
  );
  const subscriptions = s.subscriptions.filter((t) =>
    can(s, actor, "subscriptions.view", t.tenantId),
  );
  const finance = can(s, actor, "reports.view");
  const name = s.staff.find((x) => x.id === actor.id)?.name.split(" ")[0];
  return (
    <>
      <Heading
        title={`Good to see you, ${name}`}
        bn="আজকের কাজ এক জায়গায় · Your HisabIQ operations at a glance"
      >
        <span className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-ink-500">
          Demo data · Asia/Dhaka
        </span>
      </Heading>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/saas/tenants">
          <Metric
            label="Active tenants"
            value={tenants.filter((t) => t.status === "Active").length}
            detail={`${tenants.length} businesses in your scope`}
          />
        </Link>
        <Link to="/saas/payments">
          <Metric
            label="Awaiting verification"
            value={payments.length}
            detail="Submitted proof · not confirmed cash"
          />
        </Link>
        <Link to="/saas/support">
          <Metric
            label="Open support tickets"
            value={tickets.length}
            detail={`${tickets.filter((t) => t.assignee === actor.id).length} assigned to you`}
          />
        </Link>
        {finance ? (
          <Link to="/saas/reports">
            <Metric
              label="Monthly recurring revenue"
              value={money(
                subscriptions
                  .filter((x) => x.status === "Active")
                  .reduce((v, x) => v + x.price, 0),
              )}
              detail="Active monthly plan snapshots · demo"
            />
          </Link>
        ) : (
          <Metric
            label="Your responsibilities"
            value={s.assignments.filter((g) => g.staffId === actor.id).length}
            detail="Combined roles in one workspace"
          />
        )}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card
            title="Needs your attention"
            aside={
              <span className="text-xs text-ink-500">Live demo queues</span>
            }
          >
            <div className="space-y-3">
              {payments.map((p) => (
                <Link
                  key={p.id}
                  to={`/saas/payments/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-ink-50"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Verify {money(p.amount)}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {s.tenants.find((t) => t.id === p.tenantId)?.name} ·{" "}
                      {p.method}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>Pending</Badge>
                    <ArrowRight size={15} />
                  </div>
                </Link>
              ))}
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  to={`/saas/support/${t.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-ink-50"
                >
                  <div>
                    <p className="text-sm font-medium">{t.subject}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      {t.id} ·{" "}
                      {s.tenants.find((x) => x.id === t.tenantId)?.name}
                    </p>
                  </div>
                  <Badge>{t.priority}</Badge>
                </Link>
              ))}
              {!payments.length && !tickets.length && (
                <Empty text="You're all caught up. No pending work in your scope." />
              )}
            </div>
          </Card>
          <Card title="Tenant health">
            <div className="space-y-4">
              {tenants.map((t) => (
                <Link
                  key={t.id}
                  to={`/saas/tenants/${t.id}`}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-xs font-semibold text-teal-700">
                      {t.name
                        .split(" ")
                        .slice(0, 2)
                        .map((x) => x[0])
                        .join("")}
                    </span>
                    <div className="text-sm font-medium">
                      {t.name}
                      <p className="text-xs font-normal text-ink-500">
                        {t.owner}
                      </p>
                    </div>
                  </div>
                  <Badge>{t.status}</Badge>
                </Link>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="A connected workspace">
            <CheckCircle2 className="mb-3 text-primary" size={26} />
            <p className="text-sm font-medium">
              Small team. Shared responsibilities.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              Support, payment checks and service delivery appear together based
              on your assigned roles. Each role keeps its own tenant scope.
            </p>
          </Card>
          <Card title="Renewals to review">
            {subscriptions.map((x) => (
              <Link
                key={x.id}
                to={`/saas/subscriptions?tenant=${x.tenantId}`}
                className="mb-4 block last:mb-0"
              >
                <div className="flex justify-between text-xs">
                  <strong>
                    {s.tenants.find((t) => t.id === x.tenantId)?.name}
                  </strong>
                  <Badge>{x.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {x.planName} · {x.renewal}
                </p>
              </Link>
            ))}
            {!subscriptions.length && (
              <Empty text="No subscription access in this role." />
            )}
          </Card>
          <div className="px-2 text-xs leading-relaxed text-ink-500">
            This is an interactive UI demo. Payments, invitations and messages
            do not connect to external services.
          </div>
        </div>
      </div>
    </>
  );
}
