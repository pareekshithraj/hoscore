import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { initWebSocket } from './services/websocket.js';
import routes from './routes/index.js';
import { handlePaymentWebhook } from './controllers/paymentController.js';
import { validateEnv } from './utils/validateEnv.js';

dotenv.config();
validateEnv();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// CORS — supports configured CLIENT_URL and local dev origin
const allowedOrigins = [
  process.env.CLIENT_URL || 'https://hoscore.in',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Razorpay webhook — MUST receive the raw body so the HMAC signature can be
// verified against the exact bytes. Registered before express.json().
app.post(
  '/api/payments/webhook',
  express.raw({ type: '*/*', limit: '1mb' }),
  (req, res, next) => {
    (req as any).rawBody = req.body; // Buffer from express.raw
    next();
  },
  handlePaymentWebhook
);

// Body parsing with size limits
app.use(express.json({ limit: '2mb' }));

// Rate limiting to prevent auth endpoint abuse
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150, // More generous limit for general session validation/context switching
  message: { error: 'Too many auth request checks, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Strict limit for password/register attempts
  message: { error: 'Too many login attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Prevent SMS/Email OTP spamming
  message: { error: 'Too many OTP requests. Please wait 10 minutes before requesting a new code.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Block brute-force verification guesses
  message: { error: 'Too many failed verification attempts. Please wait 5 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);
app.use('/api/auth/send-otp', otpSendLimiter);
app.use('/api/auth/verify-otp', otpVerifyLimiter);
app.use('/api/auth', authLimiter);

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' });
});

function publicBaseUrl(req: Request) {
  return (process.env.PUBLIC_APP_URL || process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

function urlPart(value?: string | null) {
  return encodeURIComponent(String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizePhotos(photos: unknown) {
  if (!Array.isArray(photos)) return [];
  return photos
    .map((photo: any) => typeof photo === 'string' ? { url: photo, caption: '' } : photo)
    .filter((photo: any): photo is { url: string; caption?: string } => Boolean(photo?.url));
}

app.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = publicBaseUrl(req);
  res.type('text/plain').send(`User-agent: *\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nUser-agent: Bingbot\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nHost: ${baseUrl}\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

app.get('/llms.txt', async (req: Request, res: Response) => {
  const baseUrl = publicBaseUrl(req);
  const hospitals = await prisma.hospital.findMany({
    where: { isActive: true },
    select: { name: true, slug: true, id: true, city: true, state: true, country: true, description: true, rating: true },
    orderBy: [{ rating: 'desc' }, { updatedAt: 'desc' }],
    take: 50,
  });
  const lines = [
    '# HOSCORE',
    '',
    'HOSCORE is a public hospital discovery and healthcare operations platform. Public hospital profile pages are intended to be indexed and summarized by search engines and AI answer engines.',
    '',
    '## Public Pages',
    `- Hospital search: ${baseUrl}/hospitals`,
    `- Sitemap: ${baseUrl}/sitemap.xml`,
    '',
    '## Verified Hospital Profiles',
    ...hospitals.map((hospital) => {
      const location = [hospital.city, hospital.state, hospital.country].filter(Boolean).join(', ');
      return `- ${hospital.name}${location ? ` (${location})` : ''}: ${baseUrl}/hospitals/${hospital.slug || hospital.id}${hospital.description ? ` - ${hospital.description}` : ''}`;
    }),
    '',
    '## Indexing Guidance',
    'Hospital profile pages include structured Hospital schema, canonical URLs, public photos, doctor/specialty summaries, ratings, and location pages.',
  ];
  res.type('text/plain').send(`${lines.join('\n')}\n`);
});

app.get('/sitemap.xml', async (req: Request, res: Response) => {
  const baseUrl = publicBaseUrl(req);
  const hospitals = await prisma.hospital.findMany({
    where: { isActive: true },
    select: { slug: true, id: true, name: true, logo: true, photos: true, country: true, state: true, city: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });
  const urls: Array<{ loc: string; lastmod: string; priority: string; images?: Array<{ loc: string; caption?: string }> }> = [
    { loc: `${baseUrl}/`, lastmod: new Date().toISOString(), priority: '0.9' },
    { loc: `${baseUrl}/hospitals`, lastmod: new Date().toISOString(), priority: '0.95' },
  ];
  const locationUrls = new Map<string, string>();
  for (const hospital of hospitals) {
    const lastmod = hospital.updatedAt.toISOString();
    const images = [
      ...(hospital.logo ? [{ url: hospital.logo, caption: `${hospital.name} logo` }] : []),
      ...normalizePhotos(hospital.photos).slice(0, 10),
    ].map((photo) => ({ loc: photo.url, caption: photo.caption || `${hospital.name} hospital profile photo` }));
    urls.push({ loc: `${baseUrl}/hospitals/${hospital.slug || hospital.id}`, lastmod, priority: '0.9', images });
    if (hospital.country && hospital.state && hospital.city) {
      locationUrls.set(`${baseUrl}/hospitals/${urlPart(hospital.country)}/${urlPart(hospital.state)}/${urlPart(hospital.city)}`, lastmod);
    }
  }
  for (const [loc, lastmod] of locationUrls.entries()) {
    urls.push({ loc, lastmod, priority: '0.85' });
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.map((item) => {
    const imageTags = (item.images || []).map((image) => `    <image:image><image:loc>${xmlEscape(image.loc)}</image:loc>${image.caption ? `<image:caption>${xmlEscape(image.caption)}</image:caption>` : ''}</image:image>`).join('\n');
    return `  <url><loc>${xmlEscape(item.loc)}</loc><lastmod>${item.lastmod}</lastmod><changefreq>daily</changefreq><priority>${item.priority}</priority>${imageTags ? `\n${imageTags}` : ''}</url>`;
  }).join('\n')}\n</urlset>`;
  res.type('application/xml').send(body);
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// HTTP + WebSocket server
const server = createServer(app);
initWebSocket(server);

async function ensurePatientSixDigitIds() {
  try {
    const patients = await prisma.patient.findMany({ where: { sixDigitId: null } });
    if (patients.length > 0) {
      console.log(`🔑 Assigning 6-digit IDs to ${patients.length} patients lacking them...`);
      for (const p of patients) {
        let uniqueId = '';
        let isUnique = false;
        while (!isUnique) {
          uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
          const existing = await prisma.patient.findUnique({ where: { sixDigitId: uniqueId } });
          if (!existing) isUnique = true;
        }
        await prisma.patient.update({ where: { id: p.id }, data: { sixDigitId: uniqueId } });
      }
      console.log(`✅ Completed generating unique 6-digit IDs.`);
    }
  } catch (err) {
    console.error('❌ Error ensuring patient 6-digit IDs:', err);
  }
}

server.listen(port, () => {
  console.log(`🏥 HOSCORE API running on port ${port} (${process.env.NODE_ENV || 'development'})`);
  console.log(`🔌 WebSocket available at ws://localhost:${port}/ws`);
  ensurePatientSixDigitIds();
});

export { app, prisma };
