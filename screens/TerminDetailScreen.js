import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackIcon, ChevronRightIcon, ShareIcon } from '../components/Icons';
import RateUserModal from '../components/RateUserModal';
import RequestList from '../components/RequestList';
import TeamsAndResult from '../components/TeamsAndResult';
import TerminActions from '../components/TerminActions';
import { Toast } from '../components/Toast';
import { SPORT_COLORS, TEAM_SPORTS, days } from '../data/data';
import { colors } from '../theme/colors';
import { convertCurrency, formatDate, formatPrice } from '../utils/utils';

function getDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return `Danas · ${days[d.getDay()]}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Sutra · ${days[d.getDay()]}`;
  return days[d.getDay()];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase();
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.slice(0, 5) + 'h';
}

export default function TerminDetailScreen({ termin, currentUser, chatPreview = [], viewerCurrency = 'EUR', onRefresh }) {
  const router = useRouter();
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [ratingPlayer, setRatingPlayer] = useState(null);
  const [optimisticRated, setOptimisticRated] = useState(() => new Set());
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => setToast({ message, id: Date.now() }), []);

  const sportKey = termin.sport?.toLowerCase();
  const sportColor = SPORT_COLORS[sportKey] || colors.logoGreen;
  const isOwner = currentUser?.id === termin.creator_id;
  const isRegistered = termin.registered_players?.includes(currentUser?.id);
  const hasPendingRequest = termin.currentUserRequestStatus === 'pending';
  const registeredProfiles = termin.registered_profiles || [];
  const appPlayers = termin.registered_players?.length || 0;
  const totalPlayers = appPlayers + (termin.active_players || 0);
  const isFull = totalPlayers >= termin.max_players;
  const slotsLeft = Math.max(0, termin.max_players - totalPlayers);
  const pendingRequests = termin.termin_requests?.filter((r) => r.status === 'pending') || [];

  const isExpired = (() => {
    if (!termin.event_date) return false;
    const [y, m, d] = termin.event_date.split('-').map(Number);
    if (termin.event_time) {
      const [h, min] = termin.event_time.split(':').map(Number);
      return new Date(y, m - 1, d, h, min) < new Date();
    }
    return new Date(y, m - 1, d, 23, 59, 59) < new Date();
  })();

  const ratingsGiven = termin.ratings_given || {};
  const serverRated = ratingsGiven[currentUser?.id] || [];

  const creatorProfile = termin.profiles;
  const price = termin.price || 0;
  const terminCurrency = termin.currency || 'EUR';
  const rawPerPlayer = termin.max_players > 0 && price > 0 ? price / termin.max_players : 0;
  const convertedPrice = convertCurrency(price, terminCurrency, viewerCurrency);
  const convertedPerPlayer = convertCurrency(rawPerPlayer, terminCurrency, viewerCurrency);
  const skillLevel = termin.skill_level || 'Mješovita';
  const hasAccess = isOwner || isRegistered;
  const visiblePlayers = showAllPlayers ? registeredProfiles : registeredProfiles.slice(0, 3);
  const isTeamSport = TEAM_SPORTS.includes(sportKey);
  const showTeamsSection = hasAccess && registeredProfiles.length > 0 && isTeamSport;

  const canRate = (playerId) => {
    if (!isExpired) return false;
    if (!isRegistered && !isOwner) return false;
    if (playerId === currentUser?.id) return false;
    if (serverRated.includes(playerId)) return false;
    if (optimisticRated.has(playerId)) return false;
    return true;
  };

  const handleRated = useCallback((playerId) => {
    setOptimisticRated((prev) => new Set(prev).add(playerId));
  }, []);

  const handleRateError = useCallback(
    (playerId, message) => {
      setOptimisticRated((prev) => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
      showToast(message);
    },
    [showToast],
  );

  const handleShare = async () => {
    const shareText =
      `🏅 ${termin.sport || 'Termin'} - ${termin.title || termin.playground}\n` +
      `📅 ${formatDate(termin.event_date)} u ${formatTime(termin.event_time)}\n` +
      `📍 ${termin.playground ? termin.playground + ', ' : ''}${termin.city}\n` +
      `👥 Slobodna mjesta: ${slotsLeft} / ${termin.max_players}\n\n` +
      `Pridruži se ekipi na TerminBuddyju!`;
    try {
      await Share.share({ message: shareText });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon size={18} />
          </TouchableOpacity>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgesRow}>
                <View style={[styles.sportBadge, { backgroundColor: `${sportColor}1A` }]}>
                  <Text style={[styles.sportBadgeText, { color: sportColor }]}>{termin.sport}</Text>
                </View>
                <View style={styles.grayBadge}>
                  <Text style={styles.grayBadgeText}>{skillLevel} razina</Text>
                </View>
                {isExpired && (
                  <View style={styles.expiredBadge}>
                    <Text style={styles.expiredBadgeText}>Završeno</Text>
                  </View>
                )}
              </View>
              <Text style={styles.terminTitle}>{termin.title || termin.playground}</Text>
              {!!termin.description && <Text style={styles.terminDesc}>{termin.description}</Text>}
            </View>
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <ShareIcon size={14} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoGrid}>
            <View style={[styles.infoCell, styles.infoCellBorderR]}>
              <Text style={styles.infoLabel}>Datum</Text>
              <Text style={styles.infoValue}>{formatDate(termin.event_date)}</Text>
              <Text style={[styles.infoSub, { color: colors.logoGreen }]}>{getDateLabel(termin.event_date)}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Vrijeme</Text>
              <Text style={styles.infoValue}>{formatTime(termin.event_time)}</Text>
            </View>
            <View style={[styles.infoCell, styles.infoCellBorderR]}>
              <Text style={styles.infoLabel}>Lokacija</Text>
              <Text style={styles.infoValue}>{termin.playground || termin.city}</Text>
              {!!termin.playground && <Text style={styles.infoSub}>{termin.city}</Text>}
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Igrači</Text>
              <Text style={styles.infoValue}>
                {totalPlayers} / {termin.max_players}
              </Text>
              <Text style={[styles.infoSub, { color: slotsLeft > 0 ? sportColor : '#ff4a5c' }]}>{slotsLeft > 0 ? `${slotsLeft} slobodnih` : 'Popunjeno'}</Text>
            </View>
          </View>

          <View style={styles.progressBars}>
            {Array.from({ length: Math.min(termin.max_players, 30) }, (_, i) => (
              <View key={i} style={[styles.progressBar, { backgroundColor: i < totalPlayers ? colors.logoGreen : colors.bg2 }]} />
            ))}
          </View>
        </View>

        {!isExpired && isOwner && pendingRequests.length > 0 && (
          <View style={styles.sectionCard}>
            <RequestList requests={pendingRequests} terminId={termin.id} onUpdated={onRefresh} />
          </View>
        )}

        {showTeamsSection && (
          <View style={{ marginBottom: 16 }}>
            <TeamsAndResult termin={termin} currentUser={currentUser} isOwner={isOwner} isExpired={isExpired} registeredProfiles={registeredProfiles} />
          </View>
        )}

        <View style={styles.sectionCardNoPad}>
          <View style={styles.playersHeader}>
            <Text style={styles.sectionTitle}>Igrači</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {totalPlayers} od {termin.max_players}
              </Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 4 }}>
            {visiblePlayers.map((player) => {
              const showRate = canRate(player.id);
              return (
                <TouchableOpacity key={player.id} onPress={() => router.push(`/user/${player.username}`)} style={styles.playerRow} activeOpacity={0.8}>
                  <View style={styles.avatarCircle}>{player.avatar_url ? <Image source={{ uri: player.avatar_url }} style={styles.avatarImg} /> : <Text style={styles.avatarInitials}>{getInitials(player.username)}</Text>}</View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.playerUsername} numberOfLines={1}>
                      {player.username}
                    </Text>
                    <Text style={styles.playerHandle}>@{player.username}</Text>
                  </View>
                  {showRate ? (
                    <TouchableOpacity onPress={() => setRatingPlayer(player)} style={styles.rateBtn}>
                      <Text style={styles.rateBtnText}>Ocjeni</Text>
                    </TouchableOpacity>
                  ) : (
                    <ChevronRightIcon size={18} />
                  )}
                </TouchableOpacity>
              );
            })}

            {(isOwner || (termin.active_players || 0) > 0) && (
              <View style={styles.externalRow}>
                <View style={styles.externalAvatar}>
                  <Text style={styles.externalAvatarText}>+{termin.active_players || 0}</Text>
                </View>
                <Text style={styles.externalLabel}>Vanjski igrači</Text>
              </View>
            )}
          </View>

          {registeredProfiles.length > 3 && (
            <TouchableOpacity onPress={() => setShowAllPlayers(!showAllPlayers)} style={{ paddingVertical: 12, alignItems: 'center' }}>
              <Text style={styles.showMoreText}>{showAllPlayers ? 'Prikaži manje' : `Prikaži sve (${registeredProfiles.length})`}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => router.push(`/chat/${termin.id}`)} style={styles.sectionCardNoPad} activeOpacity={hasAccess ? 0.85 : 1} disabled={!hasAccess}>
          <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 }}>
            <Text style={styles.sectionTitle}>Chat ekipe</Text>
          </View>
          {hasAccess ? (
            chatPreview.length > 0 ? (
              <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 10 }}>
                {chatPreview.map((msg) => (
                  <View key={msg.id} style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={styles.chatAvatar}>{msg.profiles?.avatar_url ? <Image source={{ uri: msg.profiles.avatar_url }} style={styles.avatarImg} /> : <Text style={styles.chatAvatarText}>{getInitials(msg.profiles?.username)}</Text>}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.chatSender}>{msg.profiles?.username || 'Korisnik'}</Text>
                      <Text style={styles.chatText} numberOfLines={1}>
                        {msg.content}
                      </Text>
                    </View>
                  </View>
                ))}
                <Text style={styles.openChatText}>Otvori razgovor</Text>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>💬</Text>
                <Text style={styles.emptyChatText}>Nema poruka. Budi prvi!</Text>
              </View>
            )
          ) : (
            <View style={{ paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' }}>
              <Text style={styles.lockedChatText}>Pridruži se termin za pristup chatu</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitleSmall}>Organizator</Text>
          <TouchableOpacity onPress={() => router.push(`/user/${creatorProfile?.username}`)} style={styles.creatorRow} activeOpacity={0.8}>
            <View style={styles.avatarCircle}>{creatorProfile?.avatar_url ? <Image source={{ uri: creatorProfile.avatar_url }} style={styles.avatarImg} /> : <Text style={styles.avatarInitials}>{getInitials(creatorProfile?.username)}</Text>}</View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.creatorName}>{creatorProfile?.username || 'Korisnik'}</Text>
              <Text style={styles.playerHandle}>{creatorProfile?.username ? `@${creatorProfile.username}` : ''}</Text>
            </View>
            <ChevronRightIcon size={18} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {!isExpired && (
        <View style={styles.bottomBar}>
          <View style={{ marginRight: 12 }}>
            <Text style={styles.bottomPrice}>{price > 0 ? formatPrice(convertedPerPlayer, viewerCurrency) : 'Besplatno'}</Text>
            <Text style={styles.bottomSlots}>{slotsLeft > 0 ? `${slotsLeft} mjesta` : 'Popunjeno'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <TerminActions isOwner={isOwner} isRegistered={isRegistered} hasPendingRequest={hasPendingRequest} terminId={termin.id} isAutoApprove={termin.is_auto_approve} isFull={isFull} isExpired={isExpired} />
          </View>
        </View>
      )}

      <RateUserModal visible={!!ratingPlayer} onClose={() => setRatingPlayer(null)} player={ratingPlayer} terminId={termin.id} onRated={handleRated} onError={handleRateError} />

      {toast && (
        <View style={styles.toastWrap}>
          <Toast toast={toast} onDismiss={() => setToast(null)} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    backgroundColor: colors.bg3,
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 18,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  sportBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sportBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  grayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.bg2,
  },
  grayBadgeText: {
    color: colors.textSec,
    fontSize: 11,
    fontWeight: '500',
  },
  expiredBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  expiredBadgeText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '600',
  },
  terminTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  terminDesc: {
    color: colors.textSec,
    fontSize: 14,
    lineHeight: 20,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.bg2,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  infoCell: {
    width: '50%',
    padding: 12,
  },
  infoCellBorderR: {
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  infoLabel: {
    color: colors.textFaint,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoSub: {
    color: colors.textSec,
    fontSize: 11,
  },
  progressBars: {
    flexDirection: 'row',
    gap: 2,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  sectionCard: {
    backgroundColor: colors.bg3,
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 18,
    marginBottom: 16,
  },
  sectionCardNoPad: {
    backgroundColor: colors.bg3,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: {
    color: colors.textSec,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitleSmall: {
    color: colors.textSec,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  countBadge: {
    backgroundColor: colors.bg2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countBadgeText: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '500',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.bg2,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  playerUsername: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  playerHandle: {
    color: colors.textSec,
    fontSize: 11,
  },
  rateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.greenSoft,
  },
  rateBtnText: {
    color: colors.logoGreen,
    fontSize: 11,
    fontWeight: '600',
  },
  externalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.bg2,
  },
  externalAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalAvatarText: {
    color: colors.textSec,
    fontSize: 11,
    fontWeight: '700',
  },
  externalLabel: {
    color: colors.textSec,
    fontSize: 13,
  },
  showMoreText: {
    color: colors.logoGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chatAvatarText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  chatSender: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  chatText: {
    color: colors.textSec,
    fontSize: 13,
  },
  openChatText: {
    color: colors.logoGreen,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyChatText: {
    color: colors.textSec,
    fontSize: 13,
  },
  lockedChatText: {
    color: colors.textSec,
    fontSize: 13,
    textAlign: 'center',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creatorName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
    backgroundColor: colors.bg3,
  },
  bottomPrice: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSlots: {
    color: colors.textSec,
    fontSize: 10,
  },
  toastWrap: {
    position: 'absolute',
    bottom: 90,
    left: 16,
  },
});
