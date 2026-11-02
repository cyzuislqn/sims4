export const LIFE_FIRSTS = [
  { key: 'first_love', label: 'Первая любовь', icon: '♡' },
  { key: 'first_kiss', label: 'Первый поцелуй', icon: '✧' },
  { key: 'first_intimacy', label: 'Первый секс', icon: '☾' },
];

export const readLifeFirst = (character, key) => {
  const value = character?.life_firsts?.[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
};

export const hasLifeFirst = (entry) => Boolean(entry.character_id || entry.when?.trim() || entry.description?.trim());
