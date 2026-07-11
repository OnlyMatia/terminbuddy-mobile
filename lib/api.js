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

export async function getProfileByUsername(username) {
  const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single();

  if (error) return { success: false, error: error.message, profile: null };
  return { success: true, profile: data };
}

export async function getTerminsPaginated({ sport, cities, sortBy, offset = 0, limit = 40, dateFrom, dateTo }) {
  let query = supabase.from('termins').select('*, profiles:creator_id(username, avatar_url)', { count: 'exact' });

  if (sport && sport !== 'Svi sportovi') {
    query = query.ilike('sport', sport);
  }
  if (cities && cities.length > 0) {
    query = query.in('city', cities);
  }
  if (dateFrom) {
    query = query.gte('event_date', dateFrom).lte('event_date', dateTo || dateFrom);
  }

  query = query.order('event_date', { ascending: sortBy !== 'Najstariji' ? false : true });
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
  if (cities && cities.length > 0) query = query.in('city', cities);
  if (dateFrom) query = query.gte('event_date', dateFrom).lte('event_date', dateTo || dateFrom);

  query = query.order('event_date', { ascending: false }).range(offset, offset + limit - 1);

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

export async function sendRequestToJoin(terminId, autoApprove) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Niste prijavljeni.' };

  if (autoApprove) {
    const { data: termin } = await supabase.from('termins').select('registered_players').eq('id', terminId).single();
    const next = [...(termin?.registered_players || []), user.id];
    const { error } = await supabase.from('termins').update({ registered_players: next }).eq('id', terminId);
    if (error) return { success: false, message: error.message };
    return { success: true };
  }

  const { error } = await supabase.from('termin_requests').insert({
    termin_id: terminId,
    user_id: user.id,
    status: 'pending',
  });
  if (error) return { success: false, message: error.message };
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

  const { data: termin } = await supabase.from('termins').select('registered_players').eq('id', terminId).single();
  const next = (termin?.registered_players || []).filter((id) => id !== user.id);
  const { error } = await supabase.from('termins').update({ registered_players: next }).eq('id', terminId);
  return { success: !error };
}

export async function deleteTermin(terminId) {
  const { error } = await supabase.from('termins').delete().eq('id', terminId);
  return { success: !error };
}

export async function approveJoinRequest(requestId, terminId, userId) {
  const { data: termin } = await supabase.from('termins').select('registered_players').eq('id', terminId).single();
  const next = [...(termin?.registered_players || []), userId];

  const { error: updateError } = await supabase.from('termins').update({ registered_players: next }).eq('id', terminId);
  if (updateError) return { success: false, message: updateError.message };

  const { error } = await supabase.from('termin_requests').update({ status: 'approved' }).eq('id', requestId);
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
  const { data: termin } = await supabase.from('termins').select('teams').eq('id', terminId).single();
  const teams = termin?.teams || { a: [], b: [] };

  const nextTeams = {
    a: (teams.a || []).filter((id) => id !== userId),
    b: (teams.b || []).filter((id) => id !== userId),
  };
  if (team === 'a') nextTeams.a.push(userId);
  if (team === 'b') nextTeams.b.push(userId);

  const { error } = await supabase.from('termins').update({ teams: nextTeams }).eq('id', terminId);
  return { success: !error, message: error?.message };
}

export async function submitTerminResult(terminId, scoreA, scoreB) {
  const { error } = await supabase.from('termins').update({ score_a: scoreA, score_b: scoreB, result_entered_at: new Date().toISOString() }).eq('id', terminId);
  return { success: !error, message: error?.message };
}

export async function rateUser(terminId, targetUserId, rating) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Niste prijavljeni.' };

  const { data: termin } = await supabase.from('termins').select('ratings_given').eq('id', terminId).single();
  const ratingsGiven = termin?.ratings_given || {};
  const myRatings = ratingsGiven[user.id] || [];
  if (myRatings.includes(targetUserId)) return { success: false, message: 'Već ste ocijenili ovog igrača.' };

  const nextRatingsGiven = { ...ratingsGiven, [user.id]: [...myRatings, targetUserId] };
  const { error: terminError } = await supabase.from('termins').update({ ratings_given: nextRatingsGiven }).eq('id', terminId);
  if (terminError) return { success: false, message: terminError.message };

  const { data: targetProfile } = await supabase.from('profiles').select('profile_grade, ratings_count').eq('id', targetUserId).single();

  const prevCount = targetProfile?.ratings_count || 0;
  const prevGrade = targetProfile?.profile_grade || 0;
  const nextCount = prevCount + 1;
  const nextGrade = (prevGrade * prevCount + rating) / nextCount;

  const { error: profileError } = await supabase.from('profiles').update({ profile_grade: nextGrade, ratings_count: nextCount }).eq('id', targetUserId);

  return { success: !profileError, message: profileError?.message };
}
