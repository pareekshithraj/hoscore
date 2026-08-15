import { prisma } from '../index.js';

/**
 * Optional FCM (legacy HTTP). Set FCM_SERVER_KEY to notify devices that
 * registered a token. Without it, queue-call still goes over websocket/SMS/email.
 */
export async function registerDeviceToken(userId: string, token: string, platform = 'android') {
  const trimmed = String(token || '').trim();
  if (!trimmed || trimmed.length < 8) return null;
  return prisma.deviceToken.upsert({
    where: { userId_token: { userId, token: trimmed } },
    create: { userId, token: trimmed, platform: platform.slice(0, 32) },
    update: { platform: platform.slice(0, 32) },
  });
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
) {
  const key = process.env.FCM_SERVER_KEY?.trim();
  if (!key) return 0;
  const tokens = await prisma.deviceToken.findMany({ where: { userId }, select: { token: true } });
  if (!tokens.length) return 0;
  let sent = 0;
  for (const row of tokens) {
    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: row.token,
          priority: 'high',
          notification: { title, body, sound: 'default' },
          data,
        }),
      });
      if (res.ok) sent += 1;
      else if (res.status === 400 || res.status === 404) {
        await prisma.deviceToken.deleteMany({ where: { userId, token: row.token } }).catch(() => {});
      }
    } catch (err) {
      console.warn('FCM send failed:', err);
    }
  }
  return sent;
}
