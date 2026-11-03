import { UserPlan } from '../stores/useSettingsStore';

export interface PlanFeatureLimits {
  maxSavedFormulas: number; // Free: 7, Pro: Infinity, Team: Infinity
  hasCloudSync: boolean;
  hasPdfReports: boolean;
  hasAdvancedPowderEngine: boolean;
  hasSpecificationDashboard: boolean;
  hasFullAiGeneration: boolean;
  hasVersionHistory: boolean;
  hasTeamCollaboration: boolean;
  maxTeamMembers: number;
}

export const PLAN_LIMITS: Record<UserPlan, PlanFeatureLimits> = {
  free: {
    maxSavedFormulas: 7,
    hasCloudSync: false,
    hasPdfReports: false,
    hasAdvancedPowderEngine: false,
    hasSpecificationDashboard: false,
    hasFullAiGeneration: false,
    hasVersionHistory: false,
    hasTeamCollaboration: false,
    maxTeamMembers: 1,
  },
  pro_monthly: {
    maxSavedFormulas: Infinity,
    hasCloudSync: true,
    hasPdfReports: true,
    hasAdvancedPowderEngine: true,
    hasSpecificationDashboard: true,
    hasFullAiGeneration: true,
    hasVersionHistory: true,
    hasTeamCollaboration: false,
    maxTeamMembers: 1,
  },
  pro_yearly: {
    maxSavedFormulas: Infinity,
    hasCloudSync: true,
    hasPdfReports: true,
    hasAdvancedPowderEngine: true,
    hasSpecificationDashboard: true,
    hasFullAiGeneration: true,
    hasVersionHistory: true,
    hasTeamCollaboration: false,
    maxTeamMembers: 1,
  },
  team: {
    maxSavedFormulas: Infinity,
    hasCloudSync: true,
    hasPdfReports: true,
    hasAdvancedPowderEngine: true,
    hasSpecificationDashboard: true,
    hasFullAiGeneration: true,
    hasVersionHistory: true,
    hasTeamCollaboration: true,
    maxTeamMembers: 5,
  },
};

export function canSaveFormula(currentCount: number, plan: UserPlan): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return currentCount < limits.maxSavedFormulas;
}

export function isFeatureAllowed(
  feature: keyof Omit<PlanFeatureLimits, 'maxSavedFormulas' | 'maxTeamMembers'>,
  plan: UserPlan
): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return Boolean(limits[feature]);
}

export function getPlanBadgeDetails(plan: UserPlan): { label: string; bgClass: string; textClass: string } {
  switch (plan) {
    case 'pro_monthly':
      return { label: 'PRO MONTHLY', bgClass: 'bg-emerald-500/20 border-emerald-500/40', textClass: 'text-emerald-400' };
    case 'pro_yearly':
      return { label: 'PRO YEARLY', bgClass: 'bg-amber-500/20 border-amber-500/40', textClass: 'text-amber-300' };
    case 'team':
      return { label: 'TEAM / FACTORY', bgClass: 'bg-purple-500/20 border-purple-500/40', textClass: 'text-purple-300' };
    case 'free':
    default:
      return { label: 'FREE PLAN', bgClass: 'bg-slate-700/50 border-slate-600', textClass: 'text-slate-300' };
  }
}
