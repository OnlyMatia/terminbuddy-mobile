export function formatJoined(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('hr-HR', { month: 'short', year: 'numeric' });
}

export function levelToSkillNumber(level) {
  switch (level) {
    case 'beginner':
      return 1;
    case 'amateur':
      return 2;
    case 'intermediate':
      return 3;
    case 'advanced':
      return 4;
    case 'professional':
      return 5;
    default:
      return 3;
  }
}

export function skillNumberToLevel(skill) {
  switch (skill) {
    case 1:
      return 'beginner';
    case 2:
      return 'amateur';
    case 3:
      return 'intermediate';
    case 4:
      return 'advanced';
    case 5:
      return 'professional';
    default:
      return 'intermediate';
  }
}

export function calcAgeFromDob(dobStr) {
  if (typeof dobStr !== 'string') return null;
  const parts = dobStr.split('-').map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [y, m, d] = parts;
  const today = new Date();
  let age = today.getFullYear() - y;
  const mm = today.getMonth() + 1;
  if (mm < m || (mm === m && today.getDate() < d)) age--;
  return age > 0 && age < 120 ? age : null;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('hr-HR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatPrice(amount, currency = 'BAM') {
  const symbol = currency === 'EUR' ? '€' : 'KM';
  const n = Number(amount) || 0;
  const formatted = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${formatted} ${symbol}`;
}

const EUR_TO_BAM = 1.95583;

export function convertCurrency(amount, from, to) {
  const n = Number(amount) || 0;
  if (!n || from === to) return n;
  if (from === 'EUR' && to !== 'EUR') return n * EUR_TO_BAM;
  if (from !== 'EUR' && to === 'EUR') return n / EUR_TO_BAM;
  return n;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
}
