import { useMemo } from 'react';
import type { ReportsCore } from './useReportsData';
import { buildRecommendations, businessHealth } from '../utils/reports/advisor';
import { buyPlan, cashForecast, workingCapital } from '../utils/reports/planning';

export type PremiumSettings = {
  /** Money available to spend on stock this week */
  budget: number;
  /** Minimum cash the owner wants to keep */
  buffer: number;
  /** Scenario: customers pay this many days later than usual */
  lateDays: number;
  includePurchases: boolean;
};

export const defaultPremiumSettings: PremiumSettings = { budget: 150000, buffer: 50000, lateDays: 0, includePurchases: true };

export function usePremiumInsights(core: ReportsCore, settings: PremiumSettings) {
  return useMemo(() => {
    const plan = buyPlan(core.stats30, settings.budget);
    const forecast = cashForecast(core.ds, core.stats30, plan.spend, {
      days: 30,
      buffer: settings.buffer,
      includePurchases: settings.includePurchases,
      lateDays: settings.lateDays,
    });
    const wc = workingCapital(core.ds, core.stats30);
    const recommendations = buildRecommendations({
      ds: core.ds,
      stats: core.stats30,
      customers: core.customers,
      open: core.open,
      tied: core.tied,
      forecast,
      buffer: settings.buffer,
      last30: core.last30,
      prev30: core.prev30,
    });
    const health = businessHealth({ last30: core.last30, forecast, buffer: settings.buffer, stats: core.stats30, tied: core.tied, open: core.open });
    return { plan, forecast, wc, recommendations, health };
  }, [core, settings.budget, settings.buffer, settings.lateDays, settings.includePurchases]);
}

export type PremiumInsights = ReturnType<typeof usePremiumInsights>;
