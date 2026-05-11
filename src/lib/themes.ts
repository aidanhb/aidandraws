export type ThemeId =
  | 'wizard'
  | 'barbarian'
  | 'bard'
  | 'cleric'
  | 'druid'
  | 'fighter'
  | 'paladin'
  | 'ranger'
  | 'rogue'
  | 'sorcerer';

export interface Theme {
  id: ThemeId;
  label: string;
}

export const THEMES: Theme[] = [
  { id: 'wizard',    label: 'Wizard'    },
  { id: 'barbarian', label: 'Barbarian' },
  { id: 'bard',      label: 'Bard'      },
  { id: 'cleric',    label: 'Cleric'    },
  { id: 'druid',     label: 'Druid'     },
  { id: 'fighter',   label: 'Fighter'   },
  { id: 'paladin',   label: 'Paladin'   },
  { id: 'ranger',    label: 'Ranger'    },
  { id: 'rogue',     label: 'Rogue'     },
  { id: 'sorcerer',  label: 'Sorcerer'  },
];

export const DEFAULT_THEME: ThemeId = 'wizard';
export const STORAGE_KEY = 'aidandraws-theme';
