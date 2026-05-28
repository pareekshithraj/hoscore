type AuditStatus = 'configured' | 'missing' | 'fallback';
type AuditSeverity = 'required' | 'recommended';

type AuditCheck = {
  key: string;
  label: string;
  status: AuditStatus;
  severity: AuditSeverity;
  note: string;
};

const hasValue = (key: string) => Boolean(process.env[key]?.trim());

const requiredChecks: Array<{ key: string; label: string; note: string }> = [
  { key: 'DATABASE_URL', label: 'Neon pooled database URL', note: 'Required for Prisma application queries.' },
  { key: 'DIRECT_URL', label: 'Neon direct database URL', note: 'Required for reliable Prisma migrations.' },
  { key: 'JWT_SECRET', label: 'JWT signing secret', note: 'Required for secure user sessions.' },
  { key: 'CLIENT_URL', label: 'Client app URL', note: 'Required for CORS and cross-app redirects.' },
  { key: 'PUBLIC_APP_URL', label: 'Public app URL', note: 'Required for canonical links, sitemap URLs, and SEO previews.' },
  { key: 'R2_ENDPOINT', label: 'Cloudflare R2 endpoint', note: 'Required for file uploads and storage telemetry.' },
  { key: 'R2_ACCESS_KEY_ID', label: 'Cloudflare R2 access key', note: 'Required for R2 object access.' },
  { key: 'R2_SECRET_ACCESS_KEY', label: 'Cloudflare R2 secret key', note: 'Required for R2 object access.' },
  { key: 'R2_BUCKET_NAME', label: 'Cloudflare R2 bucket', note: 'Required for storing hospital photos and documents.' },
  { key: 'R2_PUBLIC_URL', label: 'Cloudflare R2 public URL', note: 'Required for serving uploaded images publicly.' },
];

const recommendedChecks: Array<{ key: string; label: string; note: string }> = [
  { key: 'RESEND_API_KEY', label: 'Email provider API key', note: 'Recommended for appointment and staff notifications.' },
  { key: 'FROM_EMAIL', label: 'Outbound email sender', note: 'Recommended for trusted email delivery.' },
  { key: 'RAZORPAY_KEY_ID', label: 'Razorpay key ID', note: 'Recommended before enabling live billing.' },
  { key: 'RAZORPAY_KEY_SECRET', label: 'Razorpay key secret', note: 'Recommended before enabling live billing.' },
];

export const getDeploymentAudit = () => {
  const checks: AuditCheck[] = [
    ...requiredChecks.map((check) => {
      const missing = !hasValue(check.key);
      const fallback = check.key === 'JWT_SECRET' && (!hasValue(check.key) || process.env.JWT_SECRET === 'dev-secret-change-in-production');
      return {
        ...check,
        severity: 'required' as AuditSeverity,
        status: fallback ? 'fallback' as AuditStatus : missing ? 'missing' as AuditStatus : 'configured' as AuditStatus,
      };
    }),
    ...recommendedChecks.map((check) => ({
      ...check,
      severity: 'recommended' as AuditSeverity,
      status: hasValue(check.key) ? 'configured' as AuditStatus : 'missing' as AuditStatus,
    })),
  ];

  return {
    generatedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    summary: {
      configured: checks.filter((check) => check.status === 'configured').length,
      missingRequired: checks.filter((check) => check.severity === 'required' && check.status !== 'configured').length,
      missingRecommended: checks.filter((check) => check.severity === 'recommended' && check.status !== 'configured').length,
    },
    checks,
  };
};
