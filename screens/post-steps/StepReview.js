import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RadioDot from '../../components/RadioDot';
import ReviewCell from '../../components/ReviewCell';
import StepHeading from '../../components/StepHeading';
import { colors } from '../../theme/colors';
import { formatDisplayDate, formatPrice } from '../../utils/utils';

export default function StepReview({ form, set, perPlayer, goTo, error }) {
  return (
    <>
      <StepHeading title="Skoro gotovo." desc="Odluči kako se igrači mogu pridružiti i pregledaj termin prije objavljivanja." />

      <Text style={styles.sectionLabel}>Način pridruživanja</Text>
      <View style={{ gap: 8, marginBottom: 24 }}>
        {[
          { val: false, name: 'Ručno odobravanje', desc: 'Svaki zahtjev treba tvoje odobrenje.' },
          { val: true, name: 'Otvoreno za sve', desc: 'Prvi koji se prijavi — igra. Bez odobravanja.' },
        ].map((opt) => {
          const selected = form.auto_accept === opt.val;
          return (
            <TouchableOpacity key={String(opt.val)} onPress={() => set('auto_accept', opt.val)} style={[styles.joinCard, selected && styles.joinCardSelected]} activeOpacity={0.85}>
              <View style={{ flex: 1 }}>
                <Text style={styles.joinTitle}>{opt.name}</Text>
                <Text style={styles.joinDesc}>{opt.desc}</Text>
              </View>
              <RadioDot selected={selected} />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Pregled termina</Text>
      <View style={styles.reviewCard}>
        <View style={styles.topStripe} />
        <View style={styles.reviewHeader}>
          <View style={styles.badgesRow}>
            <View style={styles.sportBadge}>
              <View style={styles.dot} />
              <Text style={styles.sportBadgeText}>{form.sport || '—'}</Text>
            </View>
            <View style={styles.grayBadge}>
              <Text style={styles.grayBadgeText}>{form.skill_level}</Text>
            </View>
            <View style={styles.grayBadge}>
              <Text style={styles.grayBadgeText}>{form.max_players} igrača</Text>
            </View>
          </View>
          <Text style={styles.reviewTitle}>{form.playground || 'Naziv termina'}</Text>
          {!!form.description && <Text style={styles.reviewDesc}>{form.description}</Text>}
        </View>

        <View style={styles.cellsGrid}>
          <ReviewCell label="Datum" value={form.date ? formatDisplayDate(form.date) : '—'} onEdit={() => goTo(3)} />
          <ReviewCell label="Vrijeme" value={form.time || '—'} onEdit={() => goTo(3)} />
          <ReviewCell label="Lokacija" value={form.city || form.playground || '—'} onEdit={() => goTo(4)} />
          <ReviewCell label="Igrači · cijena" value={`${form.max_players} · ${form.price > 0 ? formatPrice(perPlayer, form.currency || 'BAM') : 'Besplatno'}`} onEdit={() => goTo(6)} />
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.textSec,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    fontWeight: '500',
  },
  joinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  joinCardSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.logoGreen,
  },
  joinTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  joinDesc: {
    color: colors.textSec,
    fontSize: 12.5,
  },
  reviewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
    marginBottom: 16,
  },
  topStripe: {
    height: 3,
    backgroundColor: colors.logoGreen,
  },
  reviewHeader: {
    padding: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,122,28,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,122,28,0.3)',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ff7a1c',
  },
  sportBadgeText: {
    color: '#ff7a1c',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  grayBadgeText: {
    color: colors.textSec,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewTitle: {
    color: colors.text,
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  reviewDesc: {
    color: colors.textSec,
    fontSize: 14,
    lineHeight: 20,
  },
  cellsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,74,92,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,74,92,0.3)',
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4a5c',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
