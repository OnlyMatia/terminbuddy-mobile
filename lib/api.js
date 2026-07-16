import { skillNumberToLevel } from '../utils/utils';
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
      registered_players: [user.id],
      price: form.price || 0,
      currency: form.currency || 'BAM',
      is_auto_approve: form.auto_accept,
    })
    .select()
    .single();

  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function getProfileByUsername(username) {
  const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single();

  if (error) return { success: false, error: error.message, profile: null };
  return { success: true, profile: data };
}

export async function getUserCreatedTermins() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, data: [] };

  const { data, error } = await supabase.from('termins').select('*, profiles:creator_id(username, avatar_url)').eq('creator_id', user.id).order('event_date', { ascending: false });

  if (error) return { success: false, data: [] };
  return { success: true, data: data || [] };
}

export async function getUserJoinedTermins() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, data: [] };

  const { data, error } = await supabase.from('termins').select('*, profiles:creator_id(username, avatar_url)').contains('registered_players', [user.id]).neq('creator_id', user.id).order('event_date', { ascending: false });

  if (error) return { success: false, data: [] };
  return { success: true, data: data || [] };
}

export async function getUserChatRooms() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, data: [], userId: null };

  const [createdRes, joinedRes] = await Promise.all([
    supabase.from('termins').select('id, title, sport, playground, city, event_date, event_time, creator_id, registered_players').eq('creator_id', user.id),
    supabase.from('termins').select('id, title, sport, playground, city, event_date, event_time, creator_id, registered_players').contains('registered_players', [user.id]).neq('creator_id', user.id),
  ]);

  const allTermins = [...(createdRes.data || []), ...(joinedRes.data || [])];
  if (allTermins.length === 0) return { success: true, data: [], userId: user.id };

  const terminIds = allTermins.map((t) => t.id);

  const [messagesRes, readsRes] = await Promise.all([
    supabase.from('messages').select('*, profiles:sender_id(username, avatar_url)').in('termin_id', terminIds).order('created_at', { ascending: false }),
    supabase.from('chat_reads').select('termin_id, last_read_at').eq('user_id', user.id),
  ]);

  const messages = messagesRes.data || [];
  const reads = readsRes.data || [];
  const readMap = {};
  reads.forEach((r) => {
    readMap[r.termin_id] = r.last_read_at;
  });

  const rooms = allTermins.map((termin) => {
    const terminMessages = messages.filter((m) => m.termin_id === termin.id);
    const lastMessage = terminMessages[0] || null;
    const lastRead = readMap[termin.id];
    const unreadCount = terminMessages.filter((m) => m.sender_id !== user.id && (!lastRead || new Date(m.created_at) > new Date(lastRead))).length;

    return { ...termin, lastMessage, unreadCount };
  });

  rooms.sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.created_at) : new Date(0);
    const bTime = b.lastMessage ? new Date(b.lastMessage.created_at) : new Date(0);
    return bTime - aTime;
  });

  return { success: true, data: rooms, userId: user.id };
}

export async function getChatMessages(terminId, limit = 100) {
  const { data, error } = await supabase.from('messages').select('*, profiles:sender_id(username, avatar_url)').eq('termin_id', terminId).order('created_at', { ascending: true }).limit(limit);

  if (error) return { success: false, data: [] };
  return { success: true, data: data || [] };
}

export async function sendChatMessage(terminId, content) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Niste prijavljeni.' };

  const { data, error } = await supabase.from('messages').insert({ termin_id: terminId, sender_id: user.id, content }).select('*, profiles:sender_id(username, avatar_url)').single();

  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function markChatRead(terminId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase.from('chat_reads').upsert({ user_id: user.id, termin_id: terminId, last_read_at: new Date().toISOString() }, { onConflict: 'user_id,termin_id' });
  return { success: !error };
}

export async function getTerminsPaginated({ sport, cities, sortBy, offset = 0, limit = 40, dateFrom, dateTo }) {
  let query = supabase.from('termins').select('*, profiles:creator_id(username, avatar_url)', { count: 'exact' });

  if (sport && sport !== 'Svi sportovi') {
    query = query.ilike('sport', sport);
  }
  if (cities && cities.length > 0) {
    query = query.or(cities.map((c) => `city.ilike.${c}`).join(','));
  }
  if (dateFrom) {
    query = query.gte('event_date', dateFrom).lte('event_date', dateTo || dateFrom);
  }

  const ascending = sortBy !== 'Najstariji';
  query = query.order('event_date', { ascending }).order('event_time', { ascending });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return { success: false, data: [], hasMore: false };

  return {
    success: true,
    data: data || [],
    hasMore: count ? offset + limit < count : false,
  };
}

export async function searchTermins(searchQuery, limit = 40, offset = 0, { cities, sport, dateFrom, dateTo } = {}) {
  let query = supabase.from('termins').select('*, profiles:creator_id(username, avatar_url)', { count: 'exact' }).or(`title.ilike.%${searchQuery}%,sport.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,playground.ilike.%${searchQuery}%`);

  if (sport && sport !== 'Svi sportovi') query = query.ilike('sport', sport);
  if (cities && cities.length > 0) query = query.or(cities.map((c) => `city.ilike.${c}`).join(','));
  if (dateFrom) query = query.gte('event_date', dateFrom).lte('event_date', dateTo || dateFrom);

  query = query
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return { success: false, data: [], hasMore: false };

  return {
    success: true,
    data: data || [],
    hasMore: count ? offset + limit < count : false,
  };
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

  const sports = (payload.favorite_sports || []).map((s) => ({
    sport: s.sport,
    wins: s.wins ?? 0,
    level: skillNumberToLevel(s.skill),
    termins_played: s.termins_played ?? 0,
  }));

  const updatePayload = {
    full_name: payload.full_name,
    username: payload.username,
    avatar_url: payload.avatar_url,
    location: payload.city,
    date_of_birth: payload.date_of_birth,
    player_level: payload.player_level || null,
    sports,
    is_onboarded: true,
  };

  if (payload.country) {
    updatePayload.country = payload.country;
    updatePayload.currency = payload.country === 'Hrvatska' ? 'EUR' : 'KM';
  }

  const { error } = await supabase.from('profiles').update(updatePayload).eq('id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function checkUsernameAvailable(username, currentUserId = null) {
  const trimmed = (username || '').trim();
  if (!trimmed) return { available: false, message: 'Korisničko ime je obavezno.' };
  if (trimmed.length < 3) return { available: false, message: 'Najmanje 3 znaka.' };
  if (trimmed.length > 20) return { available: false, message: 'Maksimalno 20 znakova.' };
  if (!/^[a-zA-Z0-9_.]+$/.test(trimmed)) {
    return { available: false, message: 'Dozvoljeni su samo slova, brojevi, _ i .' };
  }

  const { data } = await supabase.from('profiles').select('id').ilike('username', trimmed).limit(1);

  if (!data || data.length === 0) return { available: true };
  if (currentUserId && data[0].id === currentUserId) return { available: true };
  return { available: false, message: 'Korisničko ime je već zauzeto.' };
}

export async function editProfile(payload) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Niste prijavljeni.' };

  if (payload.username !== undefined) {
    const check = await checkUsernameAvailable(payload.username, user.id);
    if (!check.available) return { success: false, error: check.message };
  }

  const sports = (payload.favorite_sports || []).map((s) => ({
    sport: s.sport,
    wins: s.wins ?? 0,
    level: skillNumberToLevel(s.skill),
    termins_played: s.termins_played ?? 0,
  }));

  const updatePayload = {
    sports,
    player_level: payload.player_level || null,
  };

  if (payload.username !== undefined) updatePayload.username = payload.username;
  if (payload.full_name) updatePayload.full_name = payload.full_name;
  if (payload.avatar_url) updatePayload.avatar_url = payload.avatar_url;
  if (payload.city) updatePayload.location = payload.city;
  if (payload.country) {
    updatePayload.country = payload.country;
    updatePayload.currency = payload.country === 'Hrvatska' ? 'EUR' : 'KM';
  }

  const { error } = await supabase.from('profiles').update(updatePayload).eq('id', user.id);

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Korisničko ime je već zauzeto.' };
    return { success: false, error: error.message };
  }
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

export async function getTerminDetails(terminId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.from('termins').select('*, profiles:creator_id(id, username, avatar_url)').eq('id', terminId).single();

  if (error) return { success: false, error: error.message };

  let registeredProfiles = [];
  if (Array.isArray(data.registered_players) && data.registered_players.length > 0) {
    const { data: profs } = await supabase.from('profiles').select('id, username, avatar_url').in('id', data.registered_players);
    registeredProfiles = profs || [];
  }

  let currentUserRequestStatus = null;
  let termin_requests = [];
  if (user) {
    const { data: myRequest } = await supabase.from('termin_requests').select('status').eq('termin_id', terminId).eq('user_id', user.id).maybeSingle();
    currentUserRequestStatus = myRequest?.status || null;

    if (data.creator_id === user.id) {
      const { data: allRequests } = await supabase.from('termin_requests').select('*, profiles:user_id(username, avatar_url)').eq('termin_id', terminId).order('created_at', { ascending: true });
      termin_requests = allRequests || [];
    }
  }

  return {
    success: true,
    data: { ...data, registered_profiles: registeredProfiles, currentUserRequestStatus, termin_requests },
  };
}

export async function getTerminChatPreview(terminId) {
  const { data, error } = await supabase.from('messages').select('*, profiles:sender_id(username, avatar_url)').eq('termin_id', terminId).order('created_at', { ascending: false }).limit(3);

  if (error) return { success: false, data: [] };
  return { success: true, data: (data || []).reverse() };
}

async function createNotification({ userId, type, terminId, fromUserId, message }) {
  if (!userId || userId === fromUserId) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  try {
    await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId, type, terminId, message }),
    });
  } catch (err) {
    console.error('Notification error:', err);
  }
}

export async function getUnreadNotificationsCount() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);

  return count || 0;
}

export async function getUnreadNotificationTerminIds() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase.from('notifications').select('termin_id').eq('user_id', user.id).eq('is_read', false);

  return [...new Set((data || []).map((n) => n.termin_id).filter(Boolean))];
}

export async function markNotificationsRead() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);

  return { success: !error };
}

export async function sendRequestToJoin(terminId, autoApprove) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Niste prijavljeni.' };

  const { data: termin } = await supabase.from('termins').select('creator_id, title, playground, registered_players').eq('id', terminId).single();

  const { data: myProfile } = await supabase.from('profiles').select('username').eq('id', user.id).single();

  if (autoApprove) {
    const next = [...(termin?.registered_players || []), user.id];
    const { error } = await supabase.from('termins').update({ registered_players: next }).eq('id', terminId);
    if (error) return { success: false, message: error.message };

    await createNotification({
      userId: termin?.creator_id,
      type: 'auto_joined',
      terminId,
      fromUserId: user.id,
      message: `Korisnik @${myProfile?.username || 'Nepoznat'} se pridružio terminu.`,
    });
    return { success: true };
  }

  const { error } = await supabase.from('termin_requests').insert({
    termin_id: terminId,
    user_id: user.id,
    status: 'pending',
  });
  if (error) return { success: false, message: error.message };

  await createNotification({
    userId: termin?.creator_id,
    type: 'request_received',
    terminId,
    fromUserId: user.id,
    message: `Korisnik @${myProfile?.username || 'Nepoznat'} je poslao zahtjev za pridruživanje. Prihvati prije početka termina.`,
  });
  return { success: true };
}

export async function cancelRequestToJoin(terminId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase.from('termin_requests').delete().eq('termin_id', terminId).eq('user_id', user.id);
  return { success: !error };
}

export async function leaveJoinedTermin(terminId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { data: termin } = await supabase.from('termins').select('creator_id, title, playground, registered_players').eq('id', terminId).single();

  const next = (termin?.registered_players || []).filter((id) => id !== user.id);
  const { error } = await supabase.from('termins').update({ registered_players: next }).eq('id', terminId);

  if (!error) {
    const { data: myProfile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    await createNotification({
      userId: termin?.creator_id,
      type: 'leave',
      terminId,
      fromUserId: user.id,
      message: `Korisnik @${myProfile?.username || 'Nepoznat'} je napustio termin.`,
    });
  }

  return { success: !error };
}

export async function deleteTermin(terminId) {
  const { error } = await supabase.from('termins').delete().eq('id', terminId);
  return { success: !error };
}

export async function approveJoinRequest(requestId, terminId, userId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: termin } = await supabase.from('termins').select('registered_players, title, playground').eq('id', terminId).single();
  const next = [...(termin?.registered_players || []), userId];

  const { error: updateError } = await supabase.from('termins').update({ registered_players: next }).eq('id', terminId);
  if (updateError) return { success: false, message: updateError.message };

  const { error } = await supabase.from('termin_requests').update({ status: 'approved' }).eq('id', requestId);

  if (!error && user) {
    const { data: myProfile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    await createNotification({
      userId,
      type: 'request_approved',
      terminId,
      fromUserId: user.id,
      message: `Korisnik @${myProfile?.username || 'Organizator'} je prihvatio tvoj zahtjev za pridruživanje. Vidimo se na terenu!`,
    });
  }

  return { success: !error };
}

export async function rejectJoinRequest(requestId) {
  const { error } = await supabase.from('termin_requests').update({ status: 'rejected' }).eq('id', requestId);
  return { success: !error };
}

export async function updateTerminActivePlayers(terminId, activePlayers) {
  const { error } = await supabase.from('termins').update({ active_players: activePlayers }).eq('id', terminId);
  return { success: !error };
}

export async function assignPlayerToTeam(terminId, userId, team) {
  const { data: termin } = await supabase.from('termins').select('teams, registered_players, result_entered_at, max_players').eq('id', terminId).single();

  if (!termin) return { success: false, message: 'Termin ne postoji.' };
  if (termin.result_entered_at) return { success: false, message: 'Rezultat je već unesen.' };
  if (!termin.registered_players?.includes(userId)) {
    return { success: false, message: 'Korisnik nije prijavljen na termin.' };
  }

  const teams = termin.teams || { a: [], b: [] };
  const maxPerTeam = Math.ceil(termin.max_players / 2);

  const nextTeams = {
    a: (teams.a || []).filter((id) => id !== userId),
    b: (teams.b || []).filter((id) => id !== userId),
  };

  if (team === 'a') {
    if (nextTeams.a.length >= maxPerTeam) {
      return { success: false, message: `Maksimalno ${maxPerTeam} igrača po ekipi.` };
    }
    nextTeams.a.push(userId);
  } else if (team === 'b') {
    if (nextTeams.b.length >= maxPerTeam) {
      return { success: false, message: `Maksimalno ${maxPerTeam} igrača po ekipi.` };
    }
    nextTeams.b.push(userId);
  }

  const { error } = await supabase.from('termins').update({ teams: nextTeams }).eq('id', terminId);
  return { success: !error, message: error?.message };
}

async function callTerminApi(path, body) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { success: false, message: 'Niste prijavljeni.' };

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
    return await response.json();
  } catch (err) {
    return { success: false, message: 'Greška u komunikaciji sa serverom.' };
  }
}

export async function submitTerminResult(terminId, scoreA, scoreB) {
  return callTerminApi('/api/termin-result', { terminId, scoreA, scoreB });
}

export async function rateUser(terminId, targetUserId, rating) {
  return callTerminApi('/api/rate-user', { terminId, ratedUserId: targetUserId, rating });
}

export async function processTerminExpireStats(terminId) {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/termin-expire-stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terminId }),
    });
    return await response.json();
  } catch (err) {
    return { success: false };
  }
}
