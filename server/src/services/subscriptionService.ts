import { prisma } from '../index.js';
import { PLANS } from './razorpay.js';

const TRIAL_DAYS = 30;

export async function countActiveUsers(hospitalId: string): Promise<number> {
  return prisma.membership.count({
    where: { hospitalId, status: 'ACTIVE' },
  });
}

export async function getLatestSubscription(hospitalId: string) {
  return prisma.subscription.findFirst({
    where: { hospitalId },
    orderBy: { createdAt: 'desc' },
  });
}

export function isTrialActive(sub: { status: string; trialEndsAt: Date | null }) {
  if (sub.status !== 'TRIAL') return false;
  if (!sub.trialEndsAt) return true;
  return sub.trialEndsAt > new Date();
}

export function isSubscriptionUsable(sub: {
  status: string;
  endDate: Date;
  trialEndsAt: Date | null;
  billedSeats: number;
}) {
  if (sub.status === 'ACTIVE' && sub.endDate > new Date()) return true;
  if (isTrialActive(sub)) return true;
  return false;
}

export async function assertCanAddUser(hospitalId: string) {
  const sub = await getLatestSubscription(hospitalId);
  if (!sub) {
    throw new Error('No subscription found for this hospital');
  }

  const activeUsers = await countActiveUsers(hospitalId);
  const planConfig = PLANS[sub.plan as keyof typeof PLANS];

  if (isTrialActive(sub)) {
    const cap = planConfig?.maxUsers ?? sub.maxUsers;
    if (activeUsers >= cap) {
      throw new Error(`Trial limit reached (${cap} users). Subscribe to add more team members.`);
    }
    return { sub, activeUsers, cap };
  }

  if (sub.status === 'ACTIVE' && sub.endDate > new Date()) {
    const seatCap = Math.max(sub.billedSeats, sub.maxUsers);
    if (activeUsers >= seatCap) {
      throw new Error(
        `All ${sub.billedSeats} paid seats are in use. Go to Subscription & Billing to purchase more seats.`,
      );
    }
    return { sub, activeUsers, cap: seatCap };
  }

  throw new Error('Your subscription has expired. Go to Subscription & Billing to renew and add team members.');
}

export async function getBillingSnapshot(hospitalId: string) {
  const sub = await getLatestSubscription(hospitalId);
  if (!sub) return null;

  const activeUsers = await countActiveUsers(hospitalId);
  const planConfig = PLANS[sub.plan as keyof typeof PLANS] ?? PLANS.STARTER;
  const trialActive = isTrialActive(sub);
  const paidActive = sub.status === 'ACTIVE' && sub.endDate > new Date();
  const seatsDue = trialActive || !paidActive ? activeUsers : Math.max(activeUsers, sub.billedSeats);
  const annualAmount = planConfig.pricePerUser * seatsDue;
  const additionalSeats = paidActive ? Math.max(0, activeUsers - sub.billedSeats) : 0;
  const upgradeAmount = additionalSeats * planConfig.pricePerUser;

  return {
    subscription: sub,
    planConfig,
    activeUsers,
    seatsDue,
    additionalSeats,
    annualAmount,
    upgradeAmount,
    trialActive,
    paidActive,
    usable: isSubscriptionUsable(sub),
    needsPayment: !paidActive && !trialActive,
    autopayEnabled: sub.autopayEnabled,
  };
}

export function trialEndDate(from = new Date()) {
  const end = new Date(from);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end;
}

export function activatedEndDate(from = new Date()) {
  const end = new Date(from);
  end.setFullYear(end.getFullYear() + 1);
  return end;
}

export async function activatePaidSubscription(
  hospitalId: string,
  opts: {
    plan: string;
    userCount: number;
    autopay?: boolean;
    razorpaySubscriptionId?: string | null;
    razorpayPlanId?: string | null;
  },
) {
  const planConfig = PLANS[opts.plan as keyof typeof PLANS] ?? PLANS.STARTER;
  const endDate = activatedEndDate();

  await prisma.subscription.updateMany({
    where: { hospitalId },
    data: {
      plan: opts.plan,
      status: 'ACTIVE',
      pricePerUser: planConfig.pricePerUser,
      maxUsers: planConfig.maxUsers,
      billedSeats: opts.userCount,
      endDate,
      trialEndsAt: null,
      autopayEnabled: opts.autopay ?? false,
      razorpaySubscriptionId: opts.razorpaySubscriptionId ?? null,
      razorpayPlanId: opts.razorpayPlanId ?? null,
    },
  });

  await prisma.hospital.update({
    where: { id: hospitalId },
    data: { isPartnered: true, isActive: true },
  });
}
