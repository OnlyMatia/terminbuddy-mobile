import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { assignPlayerToTeam, submitTerminResult } from '../lib/api';
import { colors } from '../theme/colors';
import { Toast } from './Toast';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase();
}

function TeamCard({ label, color, players, isOwner, currentUser, hasResult, canEdit, score, assigning, onRemove }) {
  return (
    <View style={[styles.teamCard, { borderColor: `${color}33` }]}>
      <View style={styles.teamHeader}>
        <Text style={[styles.teamLabel, { color }]}>Ekipa {label}</Text>
        {hasResult && <Text style={styles.teamScore}>{score ?? 0}</Text>}
      </View>
      {players.length === 0 ? (
        <Text style={styles.emptyText}>Prazno</Text>
      ) : (
        <View style={{ gap: 6 }}>
          {players.map((player) => {
            const canRemove = canEdit && (isOwner || player.id === currentUser?.id);
            return (
              <View key={player.id} style={styles.playerRow}>
                <View style={styles.miniAvatar}>{player.avatar_url ? <Image source={{ uri: player.avatar_url }} style={styles.miniAvatarImg} /> : <Text style={styles.miniAvatarText}>{getInitials(player.username)}</Text>}</View>
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.username}
                </Text>
                {canRemove && (
                  <TouchableOpacity onPress={() => onRemove(player.id)} disabled={assigning === player.id} hitSlop={6}>
                    <Text style={styles.removeX}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function TeamsAndResult({ termin, currentUser, isOwner, isExpired, registeredProfiles, onRefresh }) {
  const teams = termin.teams || { a: [], b: [] };
  const hasResult = !!termin.result_entered_at;

  const canEditTeams = (() => {
    if (hasResult) return false;
    if (!termin.event_date) return true;
    const eventDateTime = new Date(`${termin.event_date}T${termin.event_time || '00:00'}`);
    const cutoff = new Date(eventDateTime.getTime() + 6 * 60 * 60 * 1000);
    return new Date() <= cutoff;
  })();

  const [editingResult, setEditingResult] = useState(false);
  const [scoreA, setScoreA] = useState(termin.score_a != null ? String(termin.score_a) : '');
  const [scoreB, setScoreB] = useState(termin.score_b != null ? String(termin.score_b) : '');
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => setToast({ message: msg, id: Date.now() });

  const totalAppPlayers = registeredProfiles.length;
  const externalPlayers = termin.active_players || 0;
  const totalPlayers = totalAppPlayers + externalPlayers;
  const isFull = totalPlayers >= termin.max_players;
  const isSolo = totalAppPlayers === 1;
  const maxPerTeam = Math.ceil(termin.max_players / 2);
  const canEnterResult = isFull && (isSolo || ((teams.a?.length || 0) > 0 && (teams.b?.length || 0) > 0));

  const teamAPlayers = registeredProfiles.filter((p) => teams.a?.includes(p.id));
  const teamBPlayers = registeredProfiles.filter((p) => teams.b?.includes(p.id));
  const allUnassigned = registeredProfiles.filter((p) => !teams.a?.includes(p.id) && !teams.b?.includes(p.id));
  const unassigned = isOwner ? allUnassigned : allUnassigned.filter((p) => p.id === currentUser?.id);

  const handleAssign = async (userId, team) => {
    if (assigning) return;
    if (!canEditTeams) {
      showToast(hasResult ? 'Rezultat je već unesen.' : 'Ekipe se mogu mijenjati najkasnije 6 sati nakon početka termina.');
      return;
    }
    const isHost = isOwner;
    const isSelf = userId === currentUser?.id;
    if (!isHost && !isSelf) {
      showToast('Možeš pomicati samo sebe.');
      return;
    }
    setAssigning(userId);
    const res = await assignPlayerToTeam(termin.id, userId, team);
    if (!res.success) showToast(res.message || 'Greška.');
    else onRefresh?.();
    setAssigning(null);
  };

  const handleRemove = async (userId) => {
    if (assigning) return;
    if (!canEditTeams) {
      showToast(hasResult ? 'Rezultat je već unesen.' : 'Ekipe se mogu mijenjati najkasnije 6 sati nakon početka termina.');
      return;
    }
    setAssigning(userId);
    const res = await assignPlayerToTeam(termin.id, userId, null);
    if (!res.success) showToast(res.message || 'Greška.');
    else onRefresh?.();
    setAssigning(null);
  };

  const handleSubmitResult = async () => {
    const a = parseInt(scoreA, 10);
    const b = parseInt(scoreB, 10);
    if (Number.isNaN(a) || Number.isNaN(b) || a < 0 || b < 0) {
      showToast('Unesi važeći rezultat.');
      return;
    }
    setSaving(true);
    const res = await submitTerminResult(termin.id, a, b);
    if (res.success) {
      setEditingResult(false);
      onRefresh?.();
    } else {
      showToast(res.message || 'Greška.');
    }
    setSaving(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Ekipe i rezultat</Text>
        {hasResult && (
          <View style={styles.doneBadge}>
            <Text style={styles.doneBadgeText}>Završeno</Text>
          </View>
        )}
      </View>

      {!isSolo && (
        <>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TeamCard label="A" color="#08ff25" players={teamAPlayers} isOwner={isOwner} currentUser={currentUser} hasResult={hasResult} canEdit={canEditTeams} score={termin.score_a} assigning={assigning} onRemove={handleRemove} />
            <TeamCard label="B" color="#4a9eff" players={teamBPlayers} isOwner={isOwner} currentUser={currentUser} hasResult={hasResult} canEdit={canEditTeams} score={termin.score_b} assigning={assigning} onRemove={handleRemove} />
          </View>

          {canEditTeams && unassigned.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.unassignedLabel}>{isOwner ? `Neraspoređeni (${allUnassigned.length})` : 'Odaberi ekipu'}</Text>
              <View style={{ gap: 6 }}>
                {unassigned.map((player) => {
                  const canAssign = isOwner || player.id === currentUser?.id;
                  return (
                    <View key={player.id} style={styles.unassignedRow}>
                      <View style={styles.miniAvatar}>{player.avatar_url ? <Image source={{ uri: player.avatar_url }} style={styles.miniAvatarImg} /> : <Text style={styles.miniAvatarText}>{getInitials(player.username)}</Text>}</View>
                      <Text style={[styles.playerName, { flex: 1 }]} numberOfLines={1}>
                        {player.username}
                      </Text>
                      {canAssign && (
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => handleAssign(player.id, 'a')}
                            disabled={assigning === player.id || teamAPlayers.length >= maxPerTeam}
                            style={[styles.assignBtnA, (assigning === player.id || teamAPlayers.length >= maxPerTeam) && { opacity: 0.3 }]}
                          >
                            <Text style={styles.assignBtnAText}>A</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleAssign(player.id, 'b')}
                            disabled={assigning === player.id || teamBPlayers.length >= maxPerTeam}
                            style={[styles.assignBtnB, (assigning === player.id || teamBPlayers.length >= maxPerTeam) && { opacity: 0.3 }]}
                          >
                            <Text style={styles.assignBtnBText}>B</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </>
      )}

      {isSolo && (
        <View style={styles.soloBox}>
          <Text style={styles.soloText}>
            Samo si ti prijavljen preko aplikacije. Ostali igrači su vanjski.
            {isExpired && isFull ? ' Možeš unijeti samo rezultat termina.' : ''}
          </Text>
        </View>
      )}

      {isExpired && !isFull && !hasResult && (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>
            Termin nije bio popunjen ({totalPlayers}/{termin.max_players}). Rezultat se ne može unijeti.
          </Text>
        </View>
      )}

      {isOwner && isExpired && canEnterResult && (!hasResult || editingResult) && (
        <View style={styles.resultSection}>
          <Text style={styles.unassignedLabel}>{hasResult ? 'Uredi rezultat' : 'Unesi rezultat'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TextInput keyboardType="numeric" value={scoreA} onChangeText={setScoreA} placeholder="A" placeholderTextColor={colors.textFaint} style={styles.scoreInput} />
            <Text style={{ color: colors.textFaint, fontSize: 18, fontWeight: '700' }}>:</Text>
            <TextInput keyboardType="numeric" value={scoreB} onChangeText={setScoreB} placeholder="B" placeholderTextColor={colors.textFaint} style={styles.scoreInput} />
          </View>
          <TouchableOpacity onPress={handleSubmitResult} disabled={saving} style={[styles.saveResultBtn, saving && { opacity: 0.5 }]}>
            {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.saveResultBtnText}>{hasResult ? 'Ažuriraj' : 'Spremi rezultat'}</Text>}
          </TouchableOpacity>
          {editingResult && (
            <TouchableOpacity
              onPress={() => {
                setEditingResult(false);
                setScoreA(termin.score_a != null ? String(termin.score_a) : '');
                setScoreB(termin.score_b != null ? String(termin.score_b) : '');
              }}
              style={{ paddingVertical: 8, alignItems: 'center' }}
            >
              <Text style={{ color: colors.textSec, fontSize: 12 }}>Odustani</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isOwner && hasResult && !editingResult && (
        <TouchableOpacity onPress={() => setEditingResult(true)} style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.logoGreen, fontSize: 12, fontWeight: '600' }}>Uredi rezultat</Text>
        </TouchableOpacity>
      )}

      {canEditTeams && !isSolo && <Text style={styles.hintText}>{isOwner ? 'Rasporedi igrače u ekipe' : 'Klikni A ili B za odabir ekipe'}</Text>}

      {!hasResult && isExpired && isFull && !canEnterResult && <Text style={styles.hintText}>Obje ekipe moraju imati igrače za unos rezultata.</Text>}

      {!hasResult && isExpired && canEnterResult && !isOwner && <Text style={styles.hintText}>Čeka se unos rezultata</Text>}

      {toast && (
        <View style={{ position: 'absolute', bottom: -60, left: 0 }}>
          <Toast toast={toast} onDismiss={() => setToast(null)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg3,
    borderRadius: 20,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    color: colors.textSec,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  doneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.greenSoft,
  },
  doneBadgeText: {
    color: colors.logoGreen,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  teamCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.bg2,
    borderWidth: 1,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teamScore: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniAvatarImg: {
    width: '100%',
    height: '100%',
  },
  miniAvatarText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  playerName: {
    color: colors.text,
    fontSize: 12,
    flex: 1,
  },
  removeX: {
    color: colors.textFaint,
    fontSize: 16,
  },
  unassignedLabel: {
    color: colors.textSec,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  unassignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.bg2,
  },
  assignBtnA: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.greenSoft,
  },
  assignBtnAText: {
    color: colors.logoGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  assignBtnB: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(74,158,255,0.1)',
  },
  assignBtnBText: {
    color: '#4a9eff',
    fontSize: 11,
    fontWeight: '700',
  },
  soloBox: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.bg2,
    marginBottom: 12,
  },
  soloText: {
    color: colors.textSec,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  warnBox: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,74,92,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,74,92,0.2)',
  },
  warnText: {
    color: '#ff4a5c',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  resultSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  scoreInput: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  saveResultBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.logoGreen,
    alignItems: 'center',
  },
  saveResultBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  hintText: {
    color: colors.textSec,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
});
