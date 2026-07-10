export function calcPasswordStrength(value) {
  let strength = 0;
  if (value.length >= 6) strength++;
  if (value.length >= 10) strength++;
  if (/[A-Z]/.test(value) && /[0-9]/.test(value)) strength++;
  if (/[^A-Za-z0-9]/.test(value)) strength++;
  return strength;
}

export const STRENGTH_LABELS = ['', 'Slaba', 'Srednja', 'Jaka', 'Odlična'];
export const STRENGTH_COLORS = ['', '#ff4a5c', '#ffd14d', '#08ff25', '#08ff25'];

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

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
