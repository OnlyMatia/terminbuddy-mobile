import { days, fullMonth, months } from '../constants/data';

const EUR_TO_KM = 1.95583;

export const getFormattedDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getDate()}. ${months[d.getMonth()]}.`;
};

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${days[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]}`;
};

export function formatJoined(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${fullMonth[d.getMonth()]} ${d.getFullYear()}`;
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

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()}. ${fullMonth[d.getMonth()]}`;
}

export function convertCurrency(amount, fromCurrency, toCurrency) {
  if (!amount || fromCurrency === toCurrency) return amount;
  if (fromCurrency === 'EUR' && toCurrency === 'KM')
    return +(amount * EUR_TO_KM).toFixed(2);
  if (fromCurrency === 'KM' && toCurrency === 'EUR')
    return +(amount / EUR_TO_KM).toFixed(2);
  return amount;
}

export function formatPrice(amount, currency) {
  if (!amount || amount <= 0) return 'Besplatno';
  const clean =
    amount % 1 === 0
      ? amount.toString()
      : amount.toFixed(2).replace(/\.?0+$/, '');
  return `${clean} ${currency || 'KM'}`;
}