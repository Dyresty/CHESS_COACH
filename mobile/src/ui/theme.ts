import { useColorScheme } from 'react-native'

const light = {
  paper: '#F2ECE1',
  sheet: '#FAF6EE',
  ink: '#1F1A15',
  inkSoft: '#6A6054',
  rule: '#DCD1BF',
  walnutLight: '#E8D6B5',
  walnutDark: '#A97C50',
  lastMove: 'rgba(214, 170, 60, 0.5)',
  selected: 'rgba(47, 106, 76, 0.45)',
  blunder: '#A8392A',
  mistake: '#A86B12',
  good: '#2F6A4C',
  onGood: '#F6F1E7',
  blunderWash: '#F1DCD5',
  goodWash: '#DCE8DE',
  mistakeWash: '#F2E4C8',
}

export type Palette = typeof light

const dark: Palette = {
  paper: '#171411',
  sheet: '#211D18',
  ink: '#EEE6D8',
  inkSoft: '#A99E8F',
  rule: '#3A332B',
  walnutLight: '#C9B08A',
  walnutDark: '#7D5A38',
  lastMove: 'rgba(214, 170, 60, 0.55)',
  selected: 'rgba(127, 194, 155, 0.5)',
  blunder: '#E07A68',
  mistake: '#DDA24A',
  good: '#7FC29B',
  onGood: '#10130F',
  blunderWash: '#3A221D',
  goodWash: '#1D2E24',
  mistakeWash: '#352A17',
}

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light
}

export const font = {
  display: 'Fraunces_600SemiBold',
  text: 'IBMPlexSans_400Regular',
  medium: 'IBMPlexSans_500Medium',
  bold: 'IBMPlexSans_600SemiBold',
}

export const space = { xs: 4, s: 8, m: 12, l: 20, xl: 32 }
export const radius = 6
