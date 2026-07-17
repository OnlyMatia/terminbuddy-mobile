import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const FALLBACK_TITLES = {
  auto_joined: 'Novi igrač se pridružio terminu',
  request_received: 'Novi zahtjev za termin',
  request_approved: 'Prihvaćen si na termin',
  leave: 'Igrač je napustio termin',
};

function buildBody(type, username) {
  const name = username || 'Nepoznat';
  switch (type) {
    case 'request_received':
      return `Korisnik @${name} je poslao zahtjev za pridruživanje. Prihvati prije početka termina.`;
    case 'auto_joined':
      return `Korisnik @${name} se pridružio terminu.`;
    case 'leave':
      return `Korisnik @${name} je napustio termin.`;
    case 'request_approved':
      return `Korisnik @${name} je prihvatio tvoj zahtjev za pridruživanje. Vidimo se na terenu!`;
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const notification = payload.record;

    if (!notification?.user_id) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const { data: profile } = await supabase.from('profiles').select('push_token').eq('id', notification.user_id).single();

    if (!profile?.push_token) {
      return new Response(JSON.stringify({ skipped: 'no_push_token' }), { status: 200 });
    }

    let title = FALLBACK_TITLES[notification.type] || 'TerminBuddy';

    if (notification.termin_id) {
      const { data: termin } = await supabase.from('termins').select('title, playground, sport').eq('id', notification.termin_id).single();

      if (termin?.title) title = termin.title;
      else if (termin?.playground) title = termin.playground;
      else if (termin?.sport) title = termin.sport;
    }

    let senderUsername = null;
    if (notification.from_user_id) {
      const { data: sender } = await supabase.from('profiles').select('username').eq('id', notification.from_user_id).single();
      senderUsername = sender?.username || null;
    }

    const body = buildBody(notification.type, senderUsername) || notification.message || 'Imaš novu obavijest.';

    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: profile.push_token,
        title,
        body,
        sound: 'default',
        priority: 'high',
        data: { terminId: notification.termin_id },
      }),
    });

    const result = await pushResponse.json();
    return new Response(JSON.stringify({ success: true, result }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
