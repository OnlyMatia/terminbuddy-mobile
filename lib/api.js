import { supabase } from './supabase';

export async function getUserProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, profile: null };

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (error) return { success: false, error: error.message, profile: null };
  return { success: true, profile: data };
}

export async function createTermin(form) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Niste prijavljeni.' };

  const totalFilled = (form.current_players || 0) + 1;

  const { data, error } = await supabase
    .from('termins')
    .insert({
      creator_id: user.id,
      sport: form.sport,
      title: form.title,
      description: form.description || null,
      city: form.city,
      playground: form.playground,
      event_date: form.date,
      event_time: form.time,
      skill_level: form.skill_level,
      max_players: form.max_players,
      active_players: totalFilled,
      registered_players: [],
      price: form.price || 0,
      currency: form.currency || 'BAM',
      is_auto_approve: form.auto_accept,
    })
    .select()
    .single();

  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function updateProfileCurrency(currency) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase.from('profiles').update({ currency }).eq('id', user.id);
  return { success: !error, error: error?.message };
}

export async function updateEmailNotifications(enabled) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase.from('profiles').update({ email_notifications: enabled }).eq('id', user.id);
  return { success: !error, error: error?.message };
}

export async function deleteUserProfile() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { success: false };

  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) return { success: false };
  return { success: true };
}

export async function completeOnboarding(payload) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niste prijavljeni.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: payload.full_name,
      username: payload.username,
      avatar_url: payload.avatar_url,
      country: payload.country,
      location: payload.city,
      date_of_birth: payload.date_of_birth,
      player_level: payload.player_level,
      sports: payload.favorite_sports || [],
      is_onboarded: true,
    })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function editProfile(payload) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niste prijavljeni.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: payload.full_name,
      avatar_url: payload.avatar_url,
      country: payload.country,
      location: payload.city,
      player_level: payload.player_level,
      sports: payload.favorite_sports || [],
    })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateAvatar(asset, userId) {
  const fileExt = asset.uri.split('.').pop();
  const filePath = `${userId}/avatar.${fileExt}`;

  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from('avatars').upload(filePath, arrayBuffer, {
    contentType: asset.mimeType || 'image/jpeg',
    upsert: true,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return `${data.publicUrl}?t=${Date.now()}`;
}
