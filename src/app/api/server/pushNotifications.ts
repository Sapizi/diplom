import webpush, { type PushSubscription } from 'web-push';
import { createServiceSupabase } from './supabaseService';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:hello@example.com';

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

function isPushConfigured() {
  return Boolean(vapidPublicKey && vapidPrivateKey);
}

function configureWebPush() {
  if (!isPushConfigured()) {
    return false;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey!, vapidPrivateKey!);
  return true;
}

export function getPublicVapidKey() {
  return vapidPublicKey ?? '';
}

export async function sendOrderReadyPush(userId: string, payload: PushPayload) {
  if (!configureWebPush()) {
    return { sent: 0, skipped: true };
  }

  const supabase = createServiceSupabase();
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error || !subscriptions?.length) {
    if (error) {
      console.error('Push subscriptions load error:', error);
    }

    return { sent: 0, skipped: true };
  }

  const results = await Promise.all(
    subscriptions.map(async (subscriptionRow) => {
      const subscription: PushSubscription = {
        endpoint: String(subscriptionRow.endpoint),
        keys: {
          p256dh: String(subscriptionRow.p256dh),
          auth: String(subscriptionRow.auth),
        },
      };

      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));

        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', subscriptionRow.id);

        return true;
      } catch (sendError: any) {
        const statusCode = Number(sendError?.statusCode ?? 0);
        console.error('Push send error:', sendError);

        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', subscriptionRow.id);
        }

        return false;
      }
    })
  );

  return {
    sent: results.filter(Boolean).length,
    skipped: false,
  };
}
