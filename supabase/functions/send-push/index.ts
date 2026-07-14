import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const TITLES = {
  join: 'Netko se pridružio terminu',
  request: 'Novi zahtjev za termin',
  leave: 'Netko je napustio termin',
};

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

    const title = TITLES[notification.type] || 'TerminBuddy';

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
        body: notification.message,
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
