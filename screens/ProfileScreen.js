import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Badge from '../components/Badge';
import { BackIcon, First10AwardIcon, LogoutIcon, MapPinIcon, SettingsIcon, ShareIcon, UserIcon } from '../components/Icons';
import MatchRow from '../components/MatchRow';
import SettingsModal from '../components/SettingsModal';
import SportCard from '../components/SportCard';
import { StatsRow } from '../components/StatsRow';
import { LEVEL_LABELS, SPORT_ICONS } from '../data/data';
import { colors } from '../theme/colors';
import { calcAgeFromDob, formatJoined, levelToSkillNumber } from '../utils/utils';

export default function ProfileScreen({ user, isOwner = true, onLogout, onUpdateCurrency, onUpdateEmailNotifications, onDeleteAccount }) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const settings = user?.settings || {};
  const location = user?.location || settings.city || null;
  const bio = settings.bio || '';
  const joinedAt = user?.profile_created_at || user?.updated_at;
  const sports = user?.sports || [];
  const gameHistory = user?.game_history || [];
  const badges = user?.badges || [];
  const playedGames = user?.played_games || 0;
  const profileGrade = Number(user?.profile_grade) || 0;
  const ratingsCount = Number(user?.ratings_count) || 0;
  const playerLevel = user?.player_level;

  const age = calcAgeFromDob(user?.date_of_birth) || (Number(settings.age) > 0 ? Number(settings.age) : null);
  const totalWins = gameHistory.filter((h) => h.result === 'win').length;

  const sportsWithStats = sports.map((s) => {
    const sportLower = (s.sport || '').toLowerCase();
    const matches = gameHistory.filter((h) => (h.sport || '').toLowerCase() === sportLower);
    return {
      ...s,
      wins: matches.filter((h) => h.result === 'win').length,
      losses: matches.filter((h) => h.result === 'loss').length,
      termins_played: Math.max(s.termins_played || 0, matches.length),
    };
  });

  const earnedBadges = [];
  if (playedGames >= 10) {
    earnedBadges.push({
      id: 'first10',
      name: 'Odigrano 10 termina',
      desc: 'Odigrao si prvih 10 termina',
      Icon: First10AwardIcon,
      bgColor: '#dc2626',
    });
  }
  const allBadges = [...earnedBadges, ...badges];
  const gradeDisplay = ratingsCount > 0 && profileGrade > 0 ? profileGrade.toFixed(1) : '—';

  const handleShare = async () => {
    try {
      await Share.share({ message: `TerminBuddy profil - @${user?.username || ''}` });
    } catch {}
  };

  const handleLogout = async () => {
    await onLogout?.();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon size={18} />
          </TouchableOpacity>

          {isOwner && (
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
                <ShareIcon size={16} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSettingsOpen(true)} style={styles.actionBtn}>
                <SettingsIcon size={16} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.actionBtn}>
                <LogoutIcon size={16} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.headerCard}>
          <View style={styles.avatarWrap}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
            ) : (
              <LinearGradient colors={['#08ff25', '#056615']} style={styles.avatarFallback}>
                <UserIcon size={36} color="#000" />
              </LinearGradient>
            )}
          </View>

          <Text style={styles.name}>{user?.full_name || 'Korisnik'}</Text>
          {user?.username && <Text style={styles.username}>@{user.username}</Text>}

          <View style={styles.chipsRow}>
            {playerLevel && (
              <View style={styles.chipGreen}>
                <Text style={styles.chipGreenText}>{LEVEL_LABELS[playerLevel] || playerLevel}</Text>
              </View>
            )}
            {location && (
              <View style={styles.chip}>
                <MapPinIcon size={11} />
                <Text style={styles.chipText}>{location}</Text>
              </View>
            )}
            {joinedAt && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>Član od {formatJoined(joinedAt)}</Text>
              </View>
            )}
          </View>

          {bio ? <Text style={styles.bio}>{bio}</Text> : null}

          <View style={{ marginTop: 18, width: '100%' }}>
            <StatsRow
              stats={[
                { value: playedGames, title: 'Odigrano' },
                { value: totalWins, title: 'Pobjeda' },
                { value: gradeDisplay, title: 'Ocjena' },
              ]}
            />
          </View>
        </View>

        {sportsWithStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Najdraži sportovi</Text>
            <View style={{ gap: 10 }}>
              {sportsWithStats.map((s) => (
                <SportCard
                  key={s.sport}
                  sport={{
                    icon: SPORT_ICONS[s.sport] || '⚽',
                    name: s.sport,
                    sub: `${s.termins_played || 0} termina · ${s.wins || 0} pobjeda`,
                    wins: s.wins || 0,
                    losses: s.losses || 0,
                    skill: levelToSkillNumber(s.level),
                  }}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Povijest termina</Text>
            {gameHistory.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{gameHistory.length}</Text>
              </View>
            )}
          </View>
          <View style={styles.card}>
            {gameHistory.length > 0 ? (
              gameHistory.slice(0, 10).map((m, i, arr) => {
                const score1 = Array.isArray(m.score) ? m.score[0] : 0;
                const score2 = Array.isArray(m.score) ? m.score[1] : 0;
                const resultLetter = m.result === 'win' ? 'W' : m.result === 'loss' ? 'L' : 'D';
                return (
                  <MatchRow
                    key={i}
                    match={{
                      title: m.match_name || m.sport,
                      result: resultLetter,
                      meta: `${m.sport}${m.date_played ? ' · ' + m.date_played : ''}${m.location ? ' · ' + m.location : ''}`,
                      score1,
                      score2,
                    }}
                    isLast={i === arr.length - 1}
                  />
                );
              })
            ) : (
              <Text style={styles.emptyText}>Još nema odigranih utakmica.</Text>
            )}
          </View>
        </View>

        {allBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nagrade i postignuća</Text>
            <View style={{ gap: 8 }}>
              {allBadges.map((b) => (
                <Badge
                  key={b.id || b.badge_name}
                  badge={{
                    icon: b.image || '🏆',
                    name: b.name || b.badge_name,
                    desc: b.desc,
                    Icon: b.Icon,
                    bgColor: b.bgColor,
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {isOwner && (
          <SettingsModal
            visible={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            user={user}
            onEditProfile={() => {
              setSettingsOpen(false);
              router.push('/edit-profile');
            }}
            onUpdateCurrency={onUpdateCurrency}
            onUpdateEmailNotifications={onUpdateEmailNotifications}
            onDeleteAccount={onDeleteAccount}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    backgroundColor: colors.bg3,
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    marginBottom: 14,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  username: {
    color: colors.textSec,
    fontSize: 14,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.bg2,
  },
  chipText: {
    color: colors.textSec,
    fontSize: 11,
  },
  chipGreen: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.greenSoft,
  },
  chipGreenText: {
    color: colors.logoGreen,
    fontSize: 11,
    fontWeight: '600',
  },
  bio: {
    color: colors.textSec,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: colors.textSec,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  countBadge: {
    backgroundColor: colors.bg2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.bg3,
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyText: {
    color: colors.textSec,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
});
