export const colors = {
  background: '#0a0c09',
  bg2: '#10130f',
  bg3: '#161a14',
  backgroundActive: '#2c2c2e',
  borderColor: '#2a2d28',
  text: '#eef1ec',
  textSec: '#8a9087',
  textFaint: '#75786e',
  navbarText: '#c0c0c0',
  textInvert: '#1d1d1f',
  line: 'rgba(238,241,236,0.07)',
  line2: 'rgba(238,241,236,0.14)',
  logoGreen: '#08ff25',
  greenGlow: 'rgba(8,255,37,0.35)',
  greenSoft: 'rgba(8,255,37,0.1)',
  danger: '#ff4a5c',
  warn: '#ffd14d',
  glass: 'rgba(10,12,9,0.85)',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  pill: 999,
};

// Standardna skala veličina teksta (iOS HIG / Material Design konvencije).
// Koristi ove vrijednosti u novim komponentama umjesto nasumičnih brojeva.
export const typography = {
  hero: 32, // veliki naslovi (Home "Aktivni termini", Profil ime)
  title: 24, // naslovi ekrana / kartica ("Moji termini")
  heading: 18, // sekcijski naslovi unutar ekrana
  body: 15, // primarni tekst, naslovi kartica
  bodySecondary: 14, // sekundarni tekst, opisi
  meta: 13, // meta podaci (datum, lokacija, username)
  caption: 12, // najmanji dopušteni tekst (labele, bedževi) — nikad ispod ovoga
};
