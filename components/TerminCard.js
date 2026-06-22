import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { SPORT_COLORS, SPORT_ICONS } from '../constants/data';
import { capitalize, convertCurrency, formatPrice } from '../lib/utils';

function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Danas';
  if (d.toDateString() === tomorrow.toDateString()) return 'Sutra';
  const days = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];
  return days[d.getDay()];
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return (
    ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() ||
    name.slice(0, 2).toUpperCase()
  );
}

export default function TerminCard({
  id,
  sport = '',
  city = '',
  playground = '',
  title = '',
  event_time = '',
  event_date = '',
  max_players = 10,
  active_players = 0,
  registered_players = [],
  creatorName = 'Korisnik',
  creatorAvatar = null,
  skill_level = 'Mješovita',
  price = 0,
  currency = 'EUR',
  isHosted = false,
  termin_requests = [],
  past = false,
  viewerCurrency = 'EUR',
}) {
  const router = useRouter();

  const sportName = capitalize(sport);
  const sportColor = SPORT_COLORS[sportName] || theme.logoGreen;
  const sportIcon = SPORT_ICONS[sportName] || '⚽';

  const totalPlayers = (active_players || 0) + (registered_players?.length || 0);
  const fillPercent =
    max_players > 0 ? Math.min((totalPlayers / max_players) * 100, 100) : 0;
  const isFull = totalPlayers >= max_players;

  const rawPerPlayer = max_players > 0 && price > 0 ? price / max_players : 0;
  const convertedPerPlayer = convertCurrency(rawPerPlayer, currency, viewerCurrency);
  const priceDisplay = formatPrice(convertedPerPlayer, viewerCurrency);

  const displayTitle = title || playground || `${sportName} ${city}`;
  const pendingCount =
    termin_requests?.filter((r) => r.status === 'pending').length || 0;

  return (
    <Pressable
      onPress={() => router.push(`/termin/${id}`)}
      style={({ pressed }) => [
        styles.card,
        past && styles.past,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.sportTag}>
            <Text style={styles.sportIcon}>{sportIcon}</Text>
            <Text style={[styles.sportName, { color: sportColor }]}>
              {sport.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {formatDate(event_date)} · {formatTime(event_time)}h
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {displayTitle}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={theme.textSec} />
          <Text style={styles.locationText} numberOfLines={1}>
            {playground ? `${playground}, ${city}` : city}
          </Text>
        </View>

        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Razina</Text>
            <Text style={styles.pillValue}>{skill_level || 'Mješovita'}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Cijena</Text>
            <Text style={styles.pillValue}>{priceDisplay}</Text>
          </View>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>
              {past ? 'Završeno' : isFull ? 'Popunjeno' : 'Igrači'}
            </Text>
            <Text style={styles.progressCount}>
              {totalPlayers}/{max_players}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${fillPercent}%`,
                  backgroundColor: isFull ? theme.danger : theme.logoGreen,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        {isHosted ? (
          <View style={styles.hostTag}>
            <View style={styles.hostDot} />
            <Text style={styles.hostText}>Organizator</Text>
          </View>
        ) : (
          <View style={styles.creatorRow}>
            <View style={[styles.avatar, { backgroundColor: sportColor }]}>
              {creatorAvatar ? (
                <Image source={{ uri: creatorAvatar }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(creatorName)}</Text>
              )}
            </View>
            <Text style={styles.creatorName}>{creatorName}</Text>
          </View>
        )}

        {isHosted && pendingCount > 0 ? (
          <View style={styles.reqBadge}>
            <View style={styles.reqDot} />
            <Text style={styles.reqText}>{pendingCount} zahtjeva</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.bg3,
    borderRadius: 16,
    overflow: 'hidden',
  },
  past: { opacity: 0.6 },
  pressed: { transform: [{ scale: 0.98 }] },
  body: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  sportTag: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sportIcon: { fontSize: 18 },
  sportName: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  dateText: { fontSize: 12, fontWeight: '500', color: theme.textSec },
  title: {
    fontSize: 21,
    fontWeight: '600',
    color: theme.text,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: { fontSize: 12, color: theme.textSec, flex: 1 },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: {
    backgroundColor: theme.bg2,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 2,
  },
  pillLabel: { fontSize: 11, color: theme.textFaint },
  pillValue: { fontSize: 12, fontWeight: '500', color: theme.text },
  progressWrap: { gap: 6 },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: { fontSize: 11, color: theme.textSec },
  progressCount: { fontSize: 11, fontWeight: '600', color: theme.text },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.bg2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.line,
  },
  hostTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hostDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.logoGreen,
  },
  hostText: { fontSize: 11, fontWeight: '600', color: theme.logoGreen },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 9, fontWeight: '700', color: '#000' },
  creatorName: { fontSize: 12, fontWeight: '500', color: theme.textSec },
  reqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(249,115,22,0.1)',
  },
  reqDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fb923c' },
  reqText: { fontSize: 11, fontWeight: '500', color: '#fb923c' },
});