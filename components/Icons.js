import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme/colors';

export function GoogleIcon({ size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
  );
}

export function EyeIcon({ size = 20, color = colors.textSec }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function EyeOffIcon({ size = 20, color = colors.textSec }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a20.3 20.3 0 015.06-6.06M9.9 4.24A10.4 10.4 0 0112 4c7 0 11 8 11 8a20.3 20.3 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24" />
      <Path d="M1 1l22 22" />
    </Svg>
  );
}

export function MailIcon({ size = 15, color = colors.textFaint }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <Path d="M22 6l-10 7L2 6" />
    </Svg>
  );
}

export function BLogo({ size = 28, color = colors.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill={color}>
      <Path d="M30 44 L45 15 H65 C78 15 85 22 85 30 C85 38 78 44 65 44 H30 Z" />
      <Path d="M30 78 L45 49 H65 C78 49 85 56 85 64 C85 72 78 78 65 78 H30 Z" />
    </Svg>
  );
}

export function UserIcon({ size = 20, color = colors.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
      <Path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    </Svg>
  );
}

export function ShareIcon({ size = 16, color = colors.textSec }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Circle cx="18" cy="5" r="3" />
      <Circle cx="6" cy="12" r="3" />
      <Circle cx="18" cy="19" r="3" />
      <Path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" />
    </Svg>
  );
}

export function SettingsIcon({ size = 16, color = colors.textSec }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </Svg>
  );
}

export function LogoutIcon({ size = 16, color = '#f87171' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <Path d="M16 17l5-5-5-5" />
      <Path d="M21 12H9" />
    </Svg>
  );
}

export function MapPinIcon({ size = 12, color = colors.textSec }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M12 22s-8-7-8-13a8 8 0 0116 0c0 6-8 13-8 13z" />
      <Circle cx="12" cy="9" r="3" />
    </Svg>
  );
}

export function CloseIcon({ size = 16, color = colors.textSec }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

export function BackIcon({ size = 18, color = colors.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}

export function EditIcon({ size = 12, color = colors.textFaint }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  );
}

export function HomeIcon({ size = 22, color = colors.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12l-2 0l9 -9l9 9l-2 0" />
      <Path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
      <Path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
    </Svg>
  );
}

export function PlusIcon({ size = 20, color = colors.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8.56 3.69a9 9 0 0 0 -2.92 1.95" />
      <Path d="M3.69 8.56a9 9 0 0 0 -.69 3.44" />
      <Path d="M3.69 15.44a9 9 0 0 0 1.95 2.92" />
      <Path d="M8.56 20.31a9 9 0 0 0 3.44 .69" />
      <Path d="M15.44 20.31a9 9 0 0 0 2.92 -1.95" />
      <Path d="M20.31 15.44a9 9 0 0 0 .69 -3.44" />
      <Path d="M20.31 8.56a9 9 0 0 0 -1.95 -2.92" />
      <Path d="M15.44 3.69a9 9 0 0 0 -3.44 -.69" />
      <Path d="M9 12h6" />
      <Path d="M12 9v6" />
    </Svg>
  );
}

export function CalendarIcon({ size = 22, color = colors.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 10h18" />
      <Path d="M16 2v4M8 2v4" />
      <Path d="M5 4h14a1 1 0 011 1v15a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
    </Svg>
  );
}

export function CategoryIcon({ size = 22, color = colors.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 4h6v6h-6l0 -6" />
      <Path d="M14 4h6v6h-6l0 -6" />
      <Path d="M4 14h6v6h-6l0 -6" />
      <Path d="M14 17a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
    </Svg>
  );
}

export function FilterIcon({ size = 18, color = colors.textSec }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M4 6h16M7 12h10M10 18h4" />
    </Svg>
  );
}

export function First10AwardIcon({ size = 24, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Circle cx="12" cy="8" r="6" />
      <Path d="M9 14.5L7 22l5-3 5 3-2-7.5" />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = colors.textSec }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
      <Path d="M21 21l-6 -6" />
    </Svg>
  );
}

export function ArrowLeftIcon({ size = 18, color = colors.textSec }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );
}

export function CheckIcon({ size = 10, color = '#000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3}>
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export function TrashIcon({ size = 16, color = '#ef4444' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
      <Path d="M10 11v6M14 11v6" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 18, color = colors.textSec }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

export function MessageCircleIcon({ size = 22, color = colors.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1" />
    </Svg>
  );
}

export function SendIcon({ size = 18, color = '#000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 14l11 -11" />
      <Path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
    </Svg>
  );
}
