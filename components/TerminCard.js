import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SPORT_COLORS, days } from '../data/data';
import { colors } from '../theme/colors';
import { convertCurrency, formatPrice } from '../utils/utils';
import { ChevronRightIcon, MapPinIcon } from './Icons';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase();
}

function getDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return `Danas`;
  if (d.toDateString() === tomorrow.toDateString()) return `Sutra`;
  return days[d.getDay()];
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.slice(0, 5) + 'h';
}

export default function TerminCard({ termin, viewerCurrency = 'EUR', past = false }) {
  const router = useRouter();
  const sportKey = termin.sport?.toLowerCase();
  const sportColor = SPORT_COLORS[sportKey] || colors.logoGreen;

  const appPlayers = termin.registered_players?.length || 0;
  const totalPlayers = appPlayers + (termin.active_players || 0);

  const price = termin.price || 0;
  const terminCurrency = termin.currency || 'EUR';
  const perPlayer = termin.max_players > 0 && price > 0 ? price / termin.max_players : 0;
  const convertedPerPlayer = convertCurrency(perPlayer, terminCurrency, viewerCurrency);

  const creatorName = termin.profiles?.username;
  const creatorAvatar = termin.profiles?.avatar_url;

  const locationText = termin.playground ? `${termin.playground}, ${termin.city}` : termin.city;

  return (
    <TouchableOpacity onPress={() => router.push(`/termin/${termin.id}`)} style={[styles.card, past && { opacity: 0.5 }]} activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View style={[styles.sportBadge, { backgroundColor: `${sportColor}1A` }]}>
          <View style={[styles.sportDot, { backgroundColor: sportColor }]} />
          <Text style={[styles.sportBadgeText, { color: sportColor }]}>{termin.sport}</Text>
        </View>
        {past ? (
          <View style={styles.pastBadge}>
            <Text style={styles.pastBadgeText}>Završeno</Text>
          </View>
        ) : (
          <Text style={styles.dateLabel}>
            {getDateLabel(termin.event_date)} · {formatTime(termin.event_time)}
          </Text>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {termin.title || termin.playground}
      </Text>

      {!!locationText && (
        <View style={styles.locationRow}>
          <MapPinIcon size={12} />
          <Text style={styles.location} numberOfLines={1}>
            {locationText}
          </Text>
        </View>
      )}

      <View style={styles.infoRow}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Razina</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {termin.skill_level || 'Mješovita'}
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Cijena</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {price > 0 ? formatPrice(convertedPerPlayer, viewerCurrency) : 'Besplatno'}
          </Text>
        </View>
      </View>

      <View style={styles.playersSection}>
        <View style={styles.playersLabelRow}>
          <Text style={styles.playersLabel}>Igrači</Text>
          <Text style={[styles.playersCount, { color: sportColor }]}>
            {totalPlayers}/{termin.max_players}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, (totalPlayers / termin.max_players) * 100)}%`,
                backgroundColor: sportColor,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.creatorRow}>
          <View style={styles.avatarCircle}>{creatorAvatar ? <Image source={{ uri: creatorAvatar }} style={styles.avatarImg} /> : <Text style={styles.avatarInitials}>{getInitials(creatorName)}</Text>}</View>
          <Text style={styles.creatorName} numberOfLines={1}>
            {creatorName || 'Korisnik'}
          </Text>
        </View>
        <ChevronRightIcon size={16} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg3,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  sportDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  sportBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pastBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  pastBadgeText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '600',
  },
  dateLabel: {
    color: colors.textSec,
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  location: {
    color: colors.textSec,
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  infoBox: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.bg2,
  },
  infoLabel: {
    color: colors.textFaint,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  playersSection: {
    marginBottom: 14,
  },
  playersLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  playersLabel: {
    color: colors.textSec,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playersCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.bg2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    fontSize: 10,
    fontWeight: '700',
  },
  creatorName: {
    color: colors.textSec,
    fontSize: 12,
    flexShrink: 1,
  },
});
