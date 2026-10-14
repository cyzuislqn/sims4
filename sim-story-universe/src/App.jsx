import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, Camera, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Cloud,
  Download, Pencil, Feather, FileDown, FileUp, Filter, Heart, Home, ImagePlus,
  KeyRound, Link2, LogIn, LogOut, Menu, Move, Network, Plus, Clock, Quote, Search,
  Settings2, ShieldCheck, Star, Trash2, Upload, UserRound, Users, WandSparkles, X,
  ZoomIn, ZoomOut, Cat, Flower2, ArrowUpRight, Lightbulb, BookHeart, Save, Grip,
  RefreshCw, LockKeyhole, CheckCircle2, Eye, EyeOff, ListFilter, HeartHandshake,
  CalendarDays, Sparkles,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './supabase.js';

const TABLES = ['characters', 'stories', 'relationships', 'family_tree', 'ideas', 'tags'];
const NAV = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'characters', label: 'Персонажи', icon: Users },
  { id: 'stories', label: 'Истории', icon: BookOpen },
  { id: 'tree', label: 'Древо семьи', icon: Network },
  { id: 'relationships', label: 'Отношения', icon: HeartHandshake },
  { id: 'ideas', label: 'Идеи', icon: Lightbulb },
  { id: 'search', label: 'Поиск и теги', icon: Search },
];
const QUOTES = [
  'Каждая семья — это отдельная вселенная. Даже если у кого-то опять сгорела кухня.',
  'У хорошей истории всегда есть второй план, тайна и хотя бы одна неловкая семейная встреча.',
  'Пусть каждый сим найдёт своё место — даже если это диван бывшего.',
  'Жизнь сима коротка, а семейные секреты — на несколько поколений вперёд.',
  'Дом — это не стены. Это те, кого ты снова и снова выбираешь своей семьёй.',
  'Иногда сюжет пишет себя сам. Особенно после случайного клика не туда.',
  'В каждом поколении есть мечта, которую кто-то обязательно попытается исполнить.',
  'Сначала сим говорит «просто друзья», а потом ты уже строишь свадебную арку.',
  'Самые важные истории часто начинаются с маленького «а что, если…».',
];
const RELATION_TYPES = ['мама', 'папа', 'жена', 'муж', 'ребёнок', 'брат/сестра', 'друг', 'бывший', 'тайная связь', 'партнёр', 'родственник'];
const REL_COLORS = {
  мама: '#d78ca9', папа: '#8c9fc8', жена: '#e88ba9', муж: '#8baac4', ребёнок: '#a3b58f',
  'брат/сестра': '#b4a0d1', друг: '#80b7aa', бывший: '#b59b93', 'тайная связь': '#be7f9c',
  партнёр: '#d9a35d', родственник: '#a3a1b9',
};
const REL_DASH = { 'тайная связь': '8 7', бывший: '3 7', друг: '10 5', 'брат/сестра': '4 4' };
const blankCharacter = () => ({
  name: '', age: '', appearance: '', personality: '', traits: [], career: '', hobbies: '',
  fears: '', dreams: '', biography: '', secrets: '', tags: [], portrait_url: '', is_favorite: false,
});
const blankStory = () => ({
  title: '', subtitle: '', mood: 'Нежность', quote: '', tags: [], published: true,
  blocks: [{ type: 'paragraph', text: '' }], content: '',
});
const blankIdea = () => ({ title: '', content: '', category: 'Сцена', status: 'В планах', tags: [] });
const blankRelationship = () => ({ from_character: '', to_character: '', type: 'друг', description: '', status: 'Активна', tags: [] });
const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }));
const now = () => new Date().toISOString();
const safeArray = (x) => Array.isArray(x) ? x : [];
const splitTags = (value) => [...new Set(String(value || '').split(/[,\n]/).map(s => s.trim().replace(/^#/, '')).filter(Boolean))];
const titleCase = (s = '') => s ? s.charAt(0).toLocaleUpperCase('ru-RU') + s.slice(1) : '';
function withTagAssignments(source) {
  const result = { ...source, tags: [...safeArray(source.tags)] };
  const groups = [
    ['characters', 'character'], ['stories', 'story'], ['relationships', 'relationship'], ['ideas', 'idea'],
  ];
  for (const [table, entityType] of groups) {
    for (const entity of safeArray(result[table])) {
      for (const name of safeArray(entity.tags)) {
        const exists = result.tags.some(t => t.entity_type === entityType && t.entity_id === entity.id && String(t.name).toLocaleLowerCase('ru') === String(name).toLocaleLowerCase('ru'));
        if (!exists) result.tags.push({ id: uid(), name, color: '#d58eaa', entity_type: entityType, entity_id: entity.id, created_at: now() });
      }
    }
  }
  return result;
}

function demoData() {
  const c1 = { id: '10000000-0000-4000-8000-000000000001', name: 'Мира Вейл', age: 'Молодая взрослая', appearance: 'Мягкие черты лица, каштановые волосы и внимательный взгляд.', personality: 'Спокойная снаружи, упрямая внутри. Всегда замечает больше, чем говорит.', traits: ['Романтичная', 'Творческая', 'Перфекционистка'], career: 'Писательница', hobbies: 'Фотография, садоводство, старые фильмы', fears: 'Потерять близких и однажды не узнать себя.', dreams: 'Построить дом, в котором каждому найдётся место.', biography: 'Мира выросла в небольшом доме на окраине города. Она собирает истории, словно другие собирают открытки, и верит, что даже самая тихая жизнь достойна отдельной главы.', secrets: 'Хранит письмо, которое не решилась отправить.', tags: ['первое поколение', 'главная героиня'], portrait_url: '', is_favorite: true, created_at: now() };
  const c2 = { id: '10000000-0000-4000-8000-000000000002', name: 'Леон Вейл', age: 'Молодой взрослый', appearance: 'Тёмные кудри, широкая улыбка и чуть растрёпанный вид.', personality: 'Обаяние — его суперсила, а разговоры о чувствах — слабое место.', traits: ['Весёлый', 'Самоуверенный', 'Верный'], career: 'Бариста', hobbies: 'Музыка, кулинария, ночные прогулки', fears: 'Стать похожим на отца.', dreams: 'Открыть маленькое кафе у воды.', biography: 'Леон умеет рассмешить комнату, но редко рассказывает, что творится у него внутри. Он уверен, что всё можно исправить одним честным разговором — если хватит смелости его начать.', secrets: 'Иногда перечитывает сообщения Миры, которые делает вид, что забыл.', tags: ['семья Вейл', 'романтика'], portrait_url: '', is_favorite: true, created_at: now() };
  const c3 = { id: '10000000-0000-4000-8000-000000000003', name: 'Алиса Вейл', age: 'Подросток', appearance: 'Короткое каре, веснушки и яркие заколки.', personality: 'Любопытная, наблюдательная и слишком взрослая для своего возраста.', traits: ['Любознательная', 'Смелая', 'Немного драматичная'], career: 'Школьница', hobbies: 'Рисование, дневники, городские легенды', fears: 'Что взрослые так и не расскажут ей правду.', dreams: 'Уехать учиться искусству и снять собственный фильм.', biography: 'Алиса замечает семейные недомолвки быстрее, чем взрослые успевают их замаскировать. Её блокнот — единственное место, где всем разрешено говорить правду.', secrets: 'У неё есть список вопросов, на которые она однажды потребует ответы.', tags: ['второе поколение', 'подростки'], portrait_url: '', is_favorite: false, created_at: now() };
  const s1 = { id: '20000000-0000-4000-8000-000000000001', title: 'Дом, в котором горит свет', subtitle: 'Глава 01 · Начало новой главы', mood: 'Ностальгия', quote: 'Некоторые двери открываются только тогда, когда перестаёшь стучать.', tags: ['семья', 'новое начало'], published: true, content: 'Вечером дом Вейлов пах яблочным пирогом и дождём. Мира открыла окно, чтобы впустить свежий воздух, и впервые за долгое время подумала, что перемены не обязательно должны быть страшными.\n\nЛеон вернулся поздно, с бумажным пакетом булочек и новостью, которую репетировал по дороге домой. Алиса сделала вид, что читает, хотя давно следила за каждым движением взрослых.', blocks: [{ type: 'paragraph', text: 'Вечером дом Вейлов пах яблочным пирогом и дождём. Мира открыла окно, чтобы впустить свежий воздух, и впервые за долгое время подумала, что перемены не обязательно должны быть страшными.' }, { type: 'quote', text: 'Некоторые двери открываются только тогда, когда перестаёшь стучать.' }, { type: 'paragraph', text: 'Леон вернулся поздно, с бумажным пакетом булочек и новостью, которую репетировал по дороге домой. Алиса сделала вид, что читает, хотя давно следила за каждым движением взрослых.' }], created_at: now() };
  const s2 = { id: '20000000-0000-4000-8000-000000000002', title: 'Письмо на подоконнике', subtitle: 'Запись из личного дневника', mood: 'Тайна', quote: 'Не каждое молчание означает отсутствие ответа.', tags: ['секреты', 'Мира'], published: true, content: 'Письмо лежало там уже три дня. Мира каждый раз проходила мимо, убеждая себя, что бумага просто случайно оказалась на подоконнике.\n\nНо на конверте было её имя — почерком, который она узнала бы даже спустя двадцать лет.', blocks: [{ type: 'paragraph', text: 'Письмо лежало там уже три дня. Мира каждый раз проходила мимо, убеждая себя, что бумага просто случайно оказалась на подоконнике.' }, { type: 'quote', text: 'Не каждое молчание означает отсутствие ответа.' }, { type: 'paragraph', text: 'Но на конверте было её имя — почерком, который она узнала бы даже спустя двадцать лет.' }], created_at: now() };
  return {
    characters: [c1, c2, c3], stories: [s1, s2],
    relationships: [
      { id: '30000000-0000-4000-8000-000000000001', from_character: c1.id, to_character: c2.id, type: 'жена', tags: ['семья', 'романтика'], description: 'Вместе строят дом и учатся говорить о сложном.', status: 'Активна', created_at: now() },
      { id: '30000000-0000-4000-8000-000000000002', from_character: c1.id, to_character: c3.id, type: 'мама', tags: ['семья', 'воспитание'], description: 'Мира хочет дать дочери свободу и одновременно уберечь её от ошибок.', status: 'Активна', created_at: now() },
      { id: '30000000-0000-4000-8000-000000000003', from_character: c2.id, to_character: c3.id, type: 'папа', tags: ['семья', 'воспитание'], description: 'Леон придумывает для Алисы маленькие семейные традиции.', status: 'Активна', created_at: now() },
    ],
    family_tree: [
      { id: '40000000-0000-4000-8000-000000000001', character_id: c1.id, x: 180, y: 150, created_at: now() },
      { id: '40000000-0000-4000-8000-000000000002', character_id: c2.id, x: 560, y: 150, created_at: now() },
      { id: '40000000-0000-4000-8000-000000000003', character_id: c3.id, x: 370, y: 430, created_at: now() },
    ],
    ideas: [
      { id: '50000000-0000-4000-8000-000000000001', title: 'Разговор после полуночи', content: 'Алиса случайно слышит конец разговора родителей и решает, что речь идёт о ней.', category: 'Конфликт', status: 'В планах', tags: ['семейная тайна', 'Алиса'], created_at: now() },
      { id: '50000000-0000-4000-8000-000000000002', title: 'Сцена у старого причала', content: 'Два персонажа встречаются там, где познакомились много лет назад. Один приносит письмо.', category: 'Сцена', status: 'Черновик', tags: ['романтика', 'письмо'], created_at: now() },
    ],
    tags: [],
  };
}

function IconButton({ children, onClick, title, className = '', variant = 'ghost', disabled = false, type = 'button' }) {
  return <button type={type} title={title} aria-label={title} disabled={disabled} className={`icon-button ${variant} ${className}`} onClick={onClick}>{children}</button>;
}
function Button({ children, onClick, icon: Icon, variant = 'primary', type = 'button', disabled = false, className = '' }) {
  return <button type={type} disabled={disabled} className={`btn btn-${variant} ${className}`} onClick={onClick}>{Icon && <Icon size={16} strokeWidth={1.8} />}{children}</button>;
}
function TagPill({ children, tone = 'pink', onClick }) {
  if (!children) return null;
  return <span onClick={onClick} className={`tag-pill tag-${tone}`}>#{children}</span>;
}
function Avatar({ character, size = 'md', className = '' }) {
  return <div className={`avatar avatar-${size} ${className}`}>
    {character?.portrait_url ? <img src={character.portrait_url} alt={character?.name || 'Портрет персонажа'} /> : <span>{(character?.name || '✿').split(' ').map(s => s[0]).slice(0, 2).join('').toLocaleUpperCase('ru-RU') || '✿'}</span>}
    <i aria-hidden="true">✦</i>
  </div>;
}
function EmptyState({ icon: Icon = Sparkles, title, text, action, actionLabel }) {
  return <div className="empty-state"><span className="empty-ornament">✦</span><div className="empty-icon"><Icon size={24} /></div><h3>{title}</h3><p>{text}</p>{action && <Button icon={Plus} onClick={action}>{actionLabel || 'Добавить'}</Button>}</div>;
}
function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
    <section className={`modal-panel ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-head"><div><p className="eyebrow">✦ SIM STORY UNIVERSE</p><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><IconButton title="Закрыть" onClick={onClose}><X size={19} /></IconButton></div>
      <div className="modal-body">{children}</div>
    </section>
  </div>;
}
function FormField({ label, value, onChange, placeholder, multiline = false, rows = 3, required = false, type = 'text', hint, className = '' }) {
  return <label className={`form-field ${className}`}><span>{label}{required && <b> *</b>}</span>{multiline ? <textarea rows={rows} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''} /> : <input type={type} required={required} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''} />}{hint && <small>{hint}</small>}</label>;
}
function SelectField({ label, value, onChange, options, required = false }) {
  return <label className="form-field"><span>{label}{required && <b> *</b>}</span><select value={value ?? ''} required={required} onChange={e => onChange(e.target.value)}>{options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>;
}
function TagsField({ label = 'Теги', value = [], onChange, placeholder = 'династия, драма, романтика' }) {
  return <FormField label={label} value={Array.isArray(value) ? value.join(', ') : value} onChange={v => onChange(splitTags(v))} placeholder={placeholder} hint="Разделяй теги запятыми — они помогут в поиске." />;
}

export default function App() {
  const [data, setData] = useState(() => {
    if (isSupabaseConfigured) return Object.fromEntries(TABLES.map(t => [t, []]));
    try {
      const cached = localStorage.getItem('ssu-demo-data-v1');
      return cached ? { ...demoData(), ...JSON.parse(cached) } : demoData();
    } catch { return demoData(); }
  });
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [quote, setQuote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [storyOpen, setStoryOpen] = useState(null);
  const [viewCharacter, setViewCharacter] = useState(null);
  const [supabaseError, setSupabaseError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(!isSupabaseConfigured);

  const notify = useCallback((message, kind = 'success') => {
    setToast({ message, kind });
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(null), 3600);
  }, []);

  const loadAll = useCallback(async () => {
    if (!supabase) {
      setHasLoaded(true);
      return;
    }
    setBusy(true);
    const results = await Promise.all(TABLES.map(async table => {
      const { data: rows, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      return { table, rows, error };
    }));
    const failed = results.find(r => r.error);
    if (failed) {
      setSupabaseError(`${failed.table}: ${failed.error.message}`);
      notify(`Не удалось загрузить данные: ${failed.error.message}`, 'error');
    } else {
      setData(Object.fromEntries(results.map(r => [r.table, r.rows || []])));
      setSupabaseError('');
    }
    setHasLoaded(true);
    setBusy(false);
  }, [notify]);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => { setUser(session?.user || null); if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') loadAll(); });
      loadAll();
      return () => listener.subscription.unsubscribe();
    }
    setHasLoaded(true);
  }, [loadAll]);

  useEffect(() => {
    const onShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setActiveSection('search');
        window.setTimeout(() => document.getElementById('global-search-input')?.focus(), 0);
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  useEffect(() => {
    if (!supabase) {
      try { localStorage.setItem('ssu-demo-data-v1', JSON.stringify(data)); }
      catch { notify('Локальное хранилище заполнено. Экспортируй резервную копию и уменьши размер фото.', 'error'); }
    }
  }, [data, notify]);

  const canEdit = !isSupabaseConfigured || Boolean(user);
  const characters = safeArray(data.characters);
  const stories = safeArray(data.stories);
  const relationships = safeArray(data.relationships);
  const treeRows = safeArray(data.family_tree);
  const ideas = safeArray(data.ideas);
  const dbTags = safeArray(data.tags);

  const saveRecord = useCallback(async (table, input, { quiet = false } = {}) => {
    const record = { ...input, id: input.id || uid(), created_at: input.created_at || now(), updated_at: now() };
    if (supabase) {
      const { data: saved, error } = await supabase.from(table).upsert(record).select().single();
      if (error) throw error;
      setData(prev => ({ ...prev, [table]: [saved, ...prev[table].filter(row => row.id !== saved.id)] }));
      if (Array.isArray(record.tags) && ['characters', 'stories', 'relationships', 'ideas'].includes(table)) {
        const typeMap = { characters: 'character', stories: 'story', relationships: 'relationship', ideas: 'idea' };
        const entityType = typeMap[table];
        const { error: delError } = await supabase.from('tags').delete().eq('entity_type', entityType).eq('entity_id', record.id);
        if (delError) throw delError;
        if (record.tags.length) {
          const { error: tagError } = await supabase.from('tags').insert(record.tags.map(name => ({ name, entity_type: entityType, entity_id: record.id })));
          if (tagError) throw tagError;
        }
      }
      if (!quiet) notify(input.id ? 'Изменения сохранены ✨' : 'Добавлено во вселенную ✨');
      return saved;
    }
    setData(prev => ({ ...prev, [table]: [record, prev[table].filter(row => row.id !== record.id)] }));
    if (!quiet) notify(input.id ? 'Изменения сохранены в этом браузере ✨' : 'Добавлено во вселенную ✨');
    return record;
  }, [notify]);

  const deleteRecord = useCallback(async (table, id, { quiet = false } = {}) => {
    if (supabase) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      if (table === 'characters') {
        await supabase.from('family_tree').delete().eq('character_id', id);
      }
      if (table === 'characters' || table === 'stories' || table === 'relationships' || table === 'ideas') {
        const typeMap = { characters: 'character', stories: 'story', relationships: 'relationship', ideas: 'idea' };
        await supabase.from('tags').delete().eq('entity_type', typeMap[table]).eq('entity_id', id);
      }
    }
    setData(prev => {
      const next = { ...prev, [table]: prev[table].filter(row => row.id !== id) };
      if (['characters', 'stories', 'relationships', 'ideas'].includes(table)) {
        next.tags = prev.tags.filter(r => r.entity_id !== id);
      }
      if (table === 'characters') {
        const removedRelationshipIds = prev.relationships.filter(r => r.from_character === id || r.to_character === id).map(r => r.id);
        next.relationships = prev.relationships.filter(r => r.from_character !== id && r.to_character !== id);
        next.family_tree = prev.family_tree.filter(r => r.character_id !== id);
        next.tags = next.tags.filter(r => !removedRelationshipIds.includes(r.entity_id));
      }
      return next;
    });
    if (!quiet) notify(table === 'characters' ? 'Персонаж и его связи удалены из архива.' : table === 'stories' ? 'Глава удалена из архива.' : table === 'relationships' ? 'Связь удалена.' : table === 'ideas' ? 'Идея удалена из блокнота.' : 'Запись удалена.');
  }, [notify]);

  const uploadImage = useCallback(async (file, folder = 'images') => {
    if (!file) return '';
    if (!file.type.startsWith('image/')) throw new Error('Можно загружать только изображения.');
    if (file.size > 15 * 1024 * 1024) throw new Error('Файл больше 15 МБ. Выбери изображение поменьше.');
    if (supabase) {
      if (!user) throw new Error('Для загрузки фото войди в свой аккаунт.');
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-90) || 'photo.jpg';
      const path = `${folder}/${uid()}-${safeName}`;
      const { error } = await supabase.storage.from('photos').upload(path, file, { upsert: false, contentType: file.type, cacheControl: '3600' });
      if (error) throw error;
      const { data: publicData } = supabase.storage.from('photos').getPublicUrl(path);
      return publicData.publicUrl;
    }
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Не удалось прочитать изображение.'));
      reader.readAsDataURL(file);
    });
  }, [user]);

  const deleteStoredImage = useCallback(async (url) => {
    if (!url) return;
    if (supabase && url.includes('/storage/v1/object/public/photos/')) {
      const path = decodeURIComponent(url.split('/storage/v1/object/public/photos/')[1].split('?')[0]);
      if (path) {
        const { error } = await supabase.storage.from('photos').remove([path]);
        if (error) throw error;
      }
    }
  }, []);

  const saveCharacter = async (form) => {
    const previous = characters.find(c => c.id === form.id);
    const saved = await saveRecord('characters', form);
    if (!previous) {
      const pos = { id: uid(), character_id: saved.id, x: 120 + (characters.length % 3) * 300, y: 120 + Math.floor(characters.length / 3) * 210, created_at: now(), updated_at: now() };
      if (supabase) {
        const { data: tree, error } = await supabase.from('family_tree').upsert(pos).select().single();
        if (error) notify(`Персонаж сохранён, но позиция на древе не создана: ${error.message}`, 'error');
        else setData(prev => ({ ...prev, family_tree: [tree, ...prev.family_tree] }));
      } else setData(prev => ({ ...prev, family_tree: [...prev.family_tree, pos] }));
    }
    setModal(null); setEditing(null);
  };

  const saveRelationship = async (form) => {
    if (!form.from_character || !form.to_character || form.from_character === form.to_character) {
      notify('Выбери двух разных персонажей для связи.', 'error'); return;
    }
    await saveRecord('relationships', form);
    setModal(null); setEditing(null);
  };

  const saveTreePosition = async (characterId, x, y) => {
    const row = treeRows.find(r => r.character_id === characterId);
    const payload = { ...(row || {}), id: row?.id || uid(), character_id: characterId, x: Math.round(x), y: Math.round(y), updated_at: now() };
    if (supabase) {
      const { data: saved, error } = await supabase.from('family_tree').upsert(payload, { onConflict: 'character_id' }).select().single();
      if (error) { notify(`Не удалось сохранить позицию: ${error.message}`, 'error'); return; }
      setData(prev => ({ ...prev, family_tree: [saved, ...prev.family_tree.filter(r => r.character_id !== characterId)] }));
    } else setData(prev => ({ ...prev, family_tree: [payload, ...prev.family_tree.filter(r => r.character_id !== characterId)] }));
  };

  const changeSection = (id) => { setActiveSection(id); setMobileMenu(false); setSelectedTag(''); if (id !== 'stories') setStoryOpen(null); if (id !== 'characters') setViewCharacter(null); };
  const requireEdit = (cb) => { if (!canEdit) { setModal({ type: 'login' }); return; } cb?.(); };

  const allTags = useMemo(() => {
    const tags = new Set();
    [...characters, ...stories, ...relationships, ...ideas].forEach(row => safeArray(row.tags).forEach(t => tags.add(t)));
    dbTags.forEach(t => t.name && tags.add(t.name));
    return [...tags].sort((a, b) => a.localeCompare(b, 'ru'));
  }, [characters, stories, relationships, ideas, dbTags]);

  const filteredSearch = useMemo(() => {
    const q = globalSearch.trim().toLocaleLowerCase('ru-RU');
    if (!q && !selectedTag) return { characters: [], stories: [], relationships: [], ideas: [] };
    const includes = (value) => String(value || '').toLocaleLowerCase('ru-RU').includes(q);
    const tagMatch = (row) => !selectedTag || safeArray(row.tags).includes(selectedTag);
    return {
      characters: characters.filter(c => tagMatch(c) && (!q || [c.name,c.age,c.appearance,c.personality,c.career,c.hobbies,c.fears,c.dreams,c.biography,c.secrets,...safeArray(c.traits),...safeArray(c.tags)].some(includes))),
      stories: stories.filter(s => tagMatch(s) && (!q || [s.title,s.subtitle,s.content,s.quote,s.mood,...safeArray(s.tags),...safeArray(s.blocks).map(b => b.text || b.caption)].some(includes))),
      relationships: relationships.filter(r => {
        const from = characters.find(c => c.id === r.from_character)?.name || '';
        const to = characters.find(c => c.id === r.to_character)?.name || '';
        return (!q || [from,to,r.type,r.description,r.status].some(includes)) && (!selectedTag || (safeArray(r.tags).includes(selectedTag)));
      }),
      ideas: ideas.filter(i => tagMatch(i) && (!q || [i.title,i.content,i.category,i.status,...safeArray(i.tags)].some(includes))),
    };
  }, [globalSearch, selectedTag, characters, stories, relationships, ideas]);

  const startCreate = (type) => requireEdit(() => { setEditing(null); setModal({ type }); });
  const startEdit = (type, record) => requireEdit(() => { setEditing(record); setModal({ type }); });

  const exportBackup = async () => {
    try {
      setBusy(true);
      const bundle = { app: 'Sim Story Universe', version: 1, exported_at: now(), data: withTagAssignments(structuredClone(data)) };
      if (!supabase) setData(prev => ({ ...prev, tags: bundle.data.tags }));
      // Embed remotely stored public images in the backup when possible, so the JSON can also restore photos.
      const asDataUrl = async (url) => {
        if (!url || !url.startsWith('http')) return url;
        try {
          const res = await fetch(url); if (!res.ok) return url;
          const blob = await res.blob();
          return await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => resolve(url); reader.readAsDataURL(blob); });
        } catch { return url; }
      };
      for (const row of bundle.data.characters || []) if (row.portrait_url) row.portrait_url = await asDataUrl(row.portrait_url);
      for (const row of bundle.data.stories || []) {
        row.blocks = await Promise.all(safeArray(row.blocks).map(async block => block.type === 'image' && block.url ? { ...block, url: await asDataUrl(block.url) } : block));
      }
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8' });
      const href = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = href; a.download = `sim-story-universe-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(href);
      notify('Резервная копия подготовлена 💗');
    } catch (e) { notify(`Не удалось создать копию: ${e.message}`, 'error'); }
    finally { setBusy(false); }
  };

  const importBackup = async (file) => {
    if (!file) return;
    if (!canEdit) { setModal({ type: 'login' }); return; }
    try {
      setBusy(true);
      const json = JSON.parse(await file.text());
      const imported = json.data || json;
      if (!imported || !Array.isArray(imported.characters) || !Array.isArray(imported.stories)) throw new Error('Это не похоже на резервную копию Sim Story Universe.');
      const restoreUrl = async (url, folder) => {
        if (!url || !url.startsWith('data:')) return url || '';
        if (!supabase) return url;
        const response = await fetch(url); const blob = await response.blob();
        const type = blob.type || 'image/jpeg'; const ext = type.split('/')[1]?.replace('jpeg','jpg') || 'jpg';
        const fileObj = new File([blob], `restored-${uid()}.${ext}`, { type });
        return await uploadImage(fileObj, folder);
      };
      const prepared = withTagAssignments(structuredClone(imported));
      for (const c of prepared.characters || []) c.portrait_url = await restoreUrl(c.portrait_url, 'characters');
      for (const story of prepared.stories || []) story.blocks = await Promise.all(safeArray(story.blocks).map(async b => b.type === 'image' ? { ...b, url: await restoreUrl(b.url, 'stories') } : b));
      if (supabase) {
        // Upsert parent entities first, then links and positions.
        for (const c of prepared.characters || []) { const { error } = await supabase.from('characters').upsert(c); if (error) throw error; }
        for (const s of prepared.stories || []) { const { error } = await supabase.from('stories').upsert(s); if (error) throw error; }
        for (const i of prepared.ideas || []) { const { error } = await supabase.from('ideas').upsert(i); if (error) throw error; }
        for (const r of prepared.relationships || []) { const { error } = await supabase.from('relationships').upsert(r); if (error) throw error; }
        for (const p of prepared.family_tree || []) { const { error } = await supabase.from('family_tree').upsert(p, { onConflict: 'character_id' }); if (error) throw error; }
        for (const t of prepared.tags || []) { const { error } = await supabase.from('tags').upsert(t); if (error) throw error; }
      }
      setData(prev => Object.fromEntries(TABLES.map(table => [table, prepared[table] ? [...prepared[table], ...prev[table].filter(old => !prepared[table].some(row => row.id === old.id))] : prev[table]])));
      if (supabase) await loadAll();
      notify('Импорт завершён. Данные из копии добавлены во вселенную ✨');
    } catch (e) { notify(`Импорт не выполнен: ${e.message}`, 'error'); }
    finally { setBusy(false); }
  };

  const signOut = async () => { if (supabase) { const { error } = await supabase.auth.signOut(); if (error) notify(error.message, 'error'); else { setUser(null); notify('Ты вышла из редакторского аккаунта.'); } } };

  return <div className="app-shell">
    <div className="floating-decor decor-heart">♡</div><div className="floating-decor decor-star">✧</div><div className="floating-decor decor-cloud"><Cloud size={52} strokeWidth={1} /></div>
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="brand-lockup" onClick={() => changeSection('home')} role="button" tabIndex={0}>
        <div className="brand-mark"><Sparkles size={22} /><span>♡</span></div>
        <div className="brand-name">sim story <strong>universe</strong><small>YOUR LEGACY, YOUR MAGIC</small></div>
        <IconButton title="Закрыть меню" className="sidebar-close" onClick={() => setMobileMenu(false)}><X size={18} /></IconButton>
      </div>
      <div className="sidebar-season"><div className="season-label"><span className="season-dot" /> ТВОЯ ВСЕЛЕННАЯ</div><p>Сезон <b>01</b> · Поколение <b>01</b></p><div className="season-progress"><span /></div><small>История только начинается</small></div>
      <nav className="main-nav" aria-label="Основная навигация">
        <div className="nav-caption">АРХИВ</div>
        {NAV.map(item => <button key={item.id} className={`nav-item ${activeSection === item.id ? 'active' : ''}`} onClick={() => changeSection(item.id)}><item.icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{item.id === 'characters' && <small>{characters.length || '—'}</small>}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-mini-quote"><Quote size={15} /><p>У каждого сердца — своя история. У каждой истории — свой дом.</p><span>✧ note to self</span></div>
        <div className="sidebar-user"><div className="user-avatar"><Cat size={20} /></div><div><strong>{user ? (user.email?.split('@')[0] || 'Хранительница') : 'Хранительница историй'}</strong><small>{canEdit ? 'Доступ к редактору' : 'Гостевой просмотр'}</small></div><button title="Войти" className="tiny-login" onClick={() => user ? signOut() : setModal({ type: 'login' })}>{user ? <LogOut size={16} /> : <KeyRound size={16} />}</button></div>
      </div>
    </aside>
    {mobileMenu && <button className="mobile-scrim" onClick={() => setMobileMenu(false)} aria-label="Закрыть меню" />}
    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left"><IconButton title="Открыть меню" className="menu-toggle" onClick={() => setMobileMenu(true)}><Menu size={20} /></IconButton><div className="breadcrumb"><span>Моя вселенная</span><ChevronRight size={14} /><strong>{NAV.find(n => n.id === activeSection)?.label || 'Главная'}</strong></div></div>
        <div className="topbar-actions"><label className="top-search"><Search size={17} /><input value={globalSearch} onChange={e => { setGlobalSearch(e.target.value); if (e.target.value && activeSection !== 'search') setActiveSection('search'); }} placeholder="Найти сим, главу, секрет…" /><kbd>⌘ K</kbd></label><span className={`connection-badge ${isSupabaseConfigured ? (supabaseError ? 'offline' : 'online') : 'demo'}`}><i />{isSupabaseConfigured ? (supabaseError ? 'проверить связь' : 'облако') : 'демо'}</span><button className="top-login" onClick={() => user ? signOut() : (isSupabaseConfigured ? setModal({ type: 'login' }) : notify('Подключи Supabase по инструкции, чтобы открыть облачный редактор.', 'info'))}>{user ? <><LogOut size={15} /><span>Выйти</span></> : <><KeyRound size={15} /><span>{canEdit ? 'Редактор' : 'Войти'}</span></>}</button></div>
      </header>
      {!isSupabaseConfigured && <div className="demo-banner"><Sparkles size={16} /><span><b>Демо-режим.</b> Сейчас изменения сохраняются только в этом браузере. Чтобы синхронизировать всё между телефоном и компьютером, подключи Supabase по инструкции в README.</span><button onClick={() => setModal({ type: 'setup' })}>Как подключить <ArrowUpRight size={14} /></button></div>}
      {isSupabaseConfigured && !user && <div className="readonly-banner"><ShieldCheck size={16} /><span>Ты смотришь публичный архив. Для создания и редактирования записей войди в свой аккаунт.</span><button onClick={() => setModal({ type: 'login' })}>Войти <ArrowUpRight size={14} /></button></div>}
      {supabaseError && <div className="error-banner"><CircleHelp size={16} /><span>Не удалось прочитать таблицы: {supabaseError}. Проверь, что SQL из папки <code>supabase</code> выполнен в проекте.</span><button onClick={loadAll}><RefreshCw size={14} /> Повторить</button></div>}
      {!hasLoaded ? <div className="loading-state"><div className="loader-heart">♡</div><p>Открываем архив твоей вселенной…</p></div> : <>
        {activeSection === 'home' && <HomePage data={data} characters={characters} stories={stories} ideas={ideas} quote={quote} setQuote={() => setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])} setSection={changeSection} openStory={setStoryOpen} openCharacter={setViewCharacter} createCharacter={() => startCreate('character')} createStory={() => startCreate('story')} />}
        {activeSection === 'characters' && <CharactersPage characters={characters} relationships={relationships} onCreate={() => startCreate('character')} onEdit={c => startEdit('character', c)} onOpen={setViewCharacter} onDelete={c => requireEdit(() => setModal({ type: 'confirmDelete', table: 'characters', record: c, title: c.name }))} canEdit={canEdit} />}
        {activeSection === 'stories' && <StoriesPage stories={stories} onCreate={() => startCreate('story')} onEdit={s => startEdit('story', s)} onOpen={setStoryOpen} onDelete={s => requireEdit(() => setModal({ type: 'confirmDelete', table: 'stories', record: s, title: s.title }))} canEdit={canEdit} />}
        {activeSection === 'tree' && <FamilyTreePage characters={characters} relationships={relationships} treeRows={treeRows} onCreateRelation={() => startCreate('relationship')} onMove={saveTreePosition} onEditRelation={r => startEdit('relationship', r)} onDeleteRelation={r => requireEdit(() => setModal({ type: 'confirmDelete', table: 'relationships', record: r, title: 'эту связь' }))} openCharacter={setViewCharacter} canEdit={canEdit} notify={notify} />}
        {activeSection === 'relationships' && <RelationshipsPage relationships={relationships} characters={characters} onCreate={() => startCreate('relationship')} onEdit={r => startEdit('relationship', r)} onDelete={r => requireEdit(() => setModal({ type: 'confirmDelete', table: 'relationships', record: r, title: 'эту связь' }))} canEdit={canEdit} />}
        {activeSection === 'ideas' && <IdeasPage ideas={ideas} onCreate={() => startCreate('idea')} onEdit={i => startEdit('idea', i)} onDelete={i => requireEdit(() => setModal({ type: 'confirmDelete', table: 'ideas', record: i, title: i.title }))} canEdit={canEdit} />}
        {activeSection === 'search' && <SearchPage query={globalSearch} setQuery={setGlobalSearch} tags={allTags} selectedTag={selectedTag} setSelectedTag={setSelectedTag} results={filteredSearch} onOpenCharacter={setViewCharacter} onOpenStory={setStoryOpen} onOpenRelationship={r => startEdit('relationship', r)} characters={characters} onCreateCharacter={() => startCreate('character')} />}
      </>}
      <footer className="site-footer"><span>✿ crafted with a little pink magic</span><span>SIM STORY UNIVERSE <b>·</b> 2026</span><button onClick={() => setModal({ type: 'backup' })}><Settings2 size={14} /> Данные и копии</button></footer>
    </main>

    {modal?.type === 'character' && <CharacterModal record={editing} onClose={() => { setModal(null); setEditing(null); }} onSave={saveCharacter} uploadImage={uploadImage} deleteStoredImage={deleteStoredImage} onDelete={() => setModal({ type: 'confirmDelete', table: 'characters', record: editing, title: editing?.name })} notify={notify} />}
    {modal?.type === 'story' && <StoryModal record={editing} onClose={() => { setModal(null); setEditing(null); }} onSave={async f => { await saveRecord('stories', f); setModal(null); setEditing(null); }} uploadImage={uploadImage} deleteStoredImage={deleteStoredImage} notify={notify} />}
    {modal?.type === 'idea' && <IdeaModal record={editing} onClose={() => { setModal(null); setEditing(null); }} onSave={async f => { await saveRecord('ideas', f); setModal(null); setEditing(null); }} />}
    {modal?.type === 'relationship' && <RelationshipModal record={editing} characters={characters} onClose={() => { setModal(null); setEditing(null); }} onSave={saveRelationship} />}
    {modal?.type === 'login' && <LoginModal onClose={() => setModal(null)} notify={notify} />}
    {modal?.type === 'setup' && <Modal title="Подключаем облако" subtitle="Пара шагов — и архив будет доступен с любого устройства." onClose={() => setModal(null)}><div className="setup-steps"><p><span>01</span><b>Создай проект Supabase</b><small>Открой supabase.com, создай проект и дождись готовности базы.</small></p><p><span>02</span><b>Заполни переменные окружения</b><small>Скопируй .env.example в .env.local и вставь Project URL и anon/publishable key.</small></p><p><span>03</span><b>Выполни SQL и опубликуй сайт</b><small>Вставь supabase/schema.sql в SQL Editor, создай аккаунт владельца и добавь переменные в Netlify/Vercel.</small></p></div><p className="form-note">Полная пошаговая инструкция находится в README.md внутри проекта.</p><Button onClick={() => setModal(null)}>Понятно, поехали <Heart size={15} /></Button></Modal>}
    {modal?.type === 'backup' && <BackupModal canEdit={canEdit} busy={busy} onClose={() => setModal(null)} onExport={exportBackup} onImport={importBackup} />}
    {modal?.type === 'confirmDelete' && <Modal title="Удалить запись?" subtitle="Это действие нельзя отменить автоматически." onClose={() => setModal(null)}><div className="confirm-delete"><div className="confirm-icon"><Trash2 size={22} /></div><p>Ты точно хочешь удалить <b>{modal.title}</b>?</p><small>{modal.table === 'characters' ? 'Связи этого персонажа и его позиция на древе тоже будут удалены.' : 'Запись будет удалена из архива.'}</small><div className="modal-actions"><Button variant="soft" onClick={() => setModal(null)}>Оставить</Button><Button variant="danger" icon={Trash2} onClick={async () => { try { await deleteRecord(modal.table, modal.record.id); setModal(null); } catch (e) { notify(e.message, 'error'); } }}>Удалить навсегда</Button></div></div></Modal>}
    {viewCharacter && <CharacterDetail character={characters.find(c => c.id === viewCharacter.id) || viewCharacter} relationships={relationships} characters={characters} canEdit={canEdit} onEdit={c => { setViewCharacter(null); startEdit('character', c); }} onClose={() => setViewCharacter(null)} onSelect={setViewCharacter} />}
    {storyOpen && <StoryReader story={stories.find(s => s.id === storyOpen.id) || storyOpen} canEdit={canEdit} onEdit={s => { setStoryOpen(null); startEdit('story', s); }} onClose={() => setStoryOpen(null)} />}
    {toast && <div className={`toast toast-${toast.kind}`}><span>{toast.kind === 'error' ? <CircleHelp size={17} /> : <CheckCircle2 size={17} />}</span>{toast.message}<button onClick={() => setToast(null)}><X size={15} /></button></div>}
  </div>;
}

function PageHeader({ kicker, title, description, action, actionLabel, actionIcon: ActionIcon = Plus, icon: Icon = Sparkles, children }) {
  return <div className="page-header"><div className="page-header-copy"><div className="eyebrow"><Icon size={14} /> {kicker}</div><h1>{title} <span>✧</span></h1>{description && <p>{description}</p>}{children}</div>{action && <Button icon={ActionIcon} onClick={action}>{actionLabel || 'Добавить'}</Button>}</div>;
}
function SectionTitle({ children, aside }) { return <div className="section-title"><h2>{children}</h2>{aside}</div>; }

function HomePage({ data, characters, stories, ideas, quote, setQuote, setSection, openStory, openCharacter, createCharacter, createStory }) {
  const favorites = characters.filter(c => c.is_favorite).slice(0, 3);
  const recentStories = [...stories].sort((a,b) => new Date(b.created_at || 0)-new Date(a.created_at || 0)).slice(0, 3);
  const latestIdeas = [...ideas].sort((a,b) => new Date(b.created_at || 0)-new Date(a.created_at || 0)).slice(0, 2);
  return <div className="page-content home-page">
    <section className="hero-card">
      <div className="hero-background-shapes"><span className="hero-orb orb-one"/><span className="hero-orb orb-two"/><span className="hero-line line-one"/><span className="hero-line line-two"/></div>
      <div className="hero-copy"><div className="hero-overline"><span>✦</span> YOUR PERSONAL SIMS CHRONICLE <span>✦</span></div><h1>Каждая жизнь —<br /><em>целая вселенная.</em></h1><p>Собирай судьбы, береги воспоминания и пиши историю, которая будет жить поколениями.</p><div className="hero-buttons"><Button icon={BookOpen} onClick={() => setSection('stories')}>Читать истории</Button><Button variant="white" icon={Plus} onClick={createCharacter}>Создать персонажа</Button></div><div className="hero-footnote"><span>✿</span> маленькие решения — большие сюжеты</div></div>
      <div className="hero-art" aria-hidden="true"><div className="hero-window"><div className="window-sky"><span className="sun-dot"/><span className="cloudlet cloudlet-a"/><span className="cloudlet cloudlet-b"/><div className="window-hill hill-back"/><div className="window-hill hill-front"/></div><div className="window-cross-v"/><div className="window-cross-h"/><div className="flower-pot"><span>✿</span><div /></div></div><div className="floating-note note-one"><Heart size={16} fill="currentColor"/><span>your story<br />matters</span></div><div className="floating-note note-two"><Sparkles size={16}/><span>memories<br />live here</span></div><div className="hero-cat">ฅ^•ﻌ•^ฅ</div></div>
      <div className="hero-side-stamp"><span>SSU</span><small>EST. WITH LOVE</small></div>
    </section>
    <div className="stats-row">
      <div className="stat-card"><span className="stat-icon stat-pink"><Users size={19}/></span><div><strong>{characters.length.toString().padStart(2,'0')}</strong><small>персонажа</small></div><span className="stat-spark">✧</span></div>
      <div className="stat-card"><span className="stat-icon stat-lilac"><BookOpen size={19}/></span><div><strong>{stories.length.toString().padStart(2,'0')}</strong><small>глав в архиве</small></div><span className="stat-spark">✧</span></div>
      <div className="stat-card"><span className="stat-icon stat-peach"><Heart size={19}/></span><div><strong>{safeArray(data.relationships).length.toString().padStart(2,'0')}</strong><small>связей между ними</small></div><span className="stat-spark">✧</span></div>
      <div className="stat-card"><span className="stat-icon stat-mint"><Lightbulb size={19}/></span><div><strong>{ideas.length.toString().padStart(2,'0')}</strong><small>идей на потом</small></div><span className="stat-spark">✧</span></div>
    </div>
    <div className="home-two-col">
      <section className="home-section recent-section"><SectionTitle aside={<button className="text-link" onClick={() => setSection('stories')}>Все главы <ArrowUpRight size={14}/></button>}>Последние главы <span className="title-flower">✿</span></SectionTitle>
        {recentStories.length ? <div className="recent-stories">{recentStories.map((story, i) => <article key={story.id} className={`recent-story recent-story-${i+1}`} onClick={() => openStory(story)}><div className="story-thumbnail"><span className="thumb-sun"/><span className="thumb-hill"/><span className="thumb-flower">✿</span><span className="thumb-num">{String(stories.indexOf(story)+1).padStart(2,'0')}</span></div><div className="recent-story-copy"><div className="mini-meta"><span>{story.mood || 'Глава'}</span><i>·</i><span>{story.subtitle || 'История династии'}</span></div><h3>{story.title}</h3><p>{story.content || safeArray(story.blocks).find(b => b.type === 'paragraph')?.text || 'Новая глава ждёт своего часа…'}</p><button>Открыть главу <ChevronRight size={14}/></button></div></article>)}</div> : <div className="inline-empty"><BookOpen size={18}/><span>Первая глава ещё впереди.</span><button onClick={createStory}>Написать её <Plus size={14}/></button></div>}
      </section>
      <section className="home-section favorites-section"><SectionTitle aside={<button className="text-link" onClick={() => setSection('characters')}>Весь архив <ArrowUpRight size={14}/></button>}>Избранные симы <span className="title-flower">♡</span></SectionTitle>
        {favorites.length ? <div className="favorites-grid">{favorites.map(c => <button className="favorite-card" key={c.id} onClick={() => openCharacter(c)}><div className="favorite-avatar-wrap"><Avatar character={c} size="lg"/><span className="favorite-star"><Star size={12} fill="currentColor"/></span></div><strong>{c.name}</strong><small>{c.age || 'История продолжается'}</small><span className="favorite-caption">открыть досье <ArrowUpRight size={12}/></span></button>)}</div> : <div className="mini-empty"><div className="mini-empty-icon"><Star size={20}/></div><b>Кто станет любимчиком?</b><p>Отметь сердечком важных персонажей — они появятся здесь.</p><Button variant="soft" icon={Plus} onClick={() => setSection('characters')}>Выбрать сима</Button></div>}
        <div className="quote-card"><div className="quote-card-top"><Quote size={17}/><span>МЫСЛЬ ДНЯ</span><button onClick={setQuote} title="Другая цитата"><RefreshCw size={14}/></button></div><blockquote>«{quote}»</blockquote><div className="quote-card-bottom"><span>♡</span><span>random little wisdom</span><span>✦ ✦ ✦</span></div></div>
      </section>
    </div>
    <section className="inspiration-strip"><div className="inspiration-icon"><WandSparkles size={23}/></div><div><span className="eyebrow">A LITTLE SPARK OF INSPIRATION</span><h3>У истории нет дедлайна — только следующий поворот.</h3><p>Запиши идею, пока она не убежала. Даже самая странная мысль может стать любимой сценой.</p></div><Button variant="soft" icon={Plus} onClick={() => setSection('ideas')}>В блокнот</Button><span className="strip-doodle">♡ ✧ ♡</span></section>
    <div className="home-bottom-line"><span>✦</span> создано для историй, к которым хочется возвращаться <span>✦</span></div>
  </div>;
}

function CharactersPage({ characters, relationships, onCreate, onEdit, onOpen, onDelete, canEdit }) {
  const [search, setSearch] = useState(''); const [sort, setSort] = useState('Имя'); const [favoritesOnly, setFavoritesOnly] = useState(false);
  const filtered = useMemo(() => characters.filter(c => (!favoritesOnly || c.is_favorite) && [c.name,c.age,c.career,c.personality,...safeArray(c.tags),...safeArray(c.traits)].join(' ').toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru')))
.sort((a, b) => sort === 'Имя'
  ? String(a.name || '').localeCompare(String(b.name || ''), 'ru')
  : new Date(b.created_at || 0) - new Date(a.created_at || 0))
, [characters, search, sort, favoritesOnly]);
  return <div className="page-content"><PageHeader kicker="THE CAST OF YOUR WORLD" title="Персонажи" description="У каждого — свой характер, свои секреты и своя глава в большой истории." icon={Users} action={canEdit ? onCreate : null} actionLabel="Новый персонаж" />
    <div className="list-toolbar"><label className="toolbar-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Имя, профессия, черта характера…"/><span>{filtered.length}</span></label><button className={`filter-chip ${favoritesOnly ? 'is-on' : ''}`} onClick={() => setFavoritesOnly(!favoritesOnly)}><Heart size={15} fill={favoritesOnly ? 'currentColor' : 'none'}/> Избранное</button><label className="sort-select"><ListFilter size={15}/><select value={sort} onChange={e => setSort(e.target.value)}><option>Имя</option><option>Сначала новые</option></select><ChevronDown size={14}/></label></div>
    {filtered.length ? <div className="character-grid">{filtered.map((c, index) => <CharacterCard key={c.id} character={c} relationships={relationships} index={index} onOpen={() => onOpen(c)} onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} canEdit={canEdit} />)}</div> : <EmptyState icon={UserRound} title={search || favoritesOnly ? 'Никого не нашли' : 'Здесь начнётся династия'} text={search || favoritesOnly ? 'Попробуй изменить поиск или снять фильтр.' : 'Добавь первого персонажа: его имя, мечты, странности и историю.'} action={canEdit ? onCreate : undefined} actionLabel="Создать первого сима" />}
  </div>;
}
function CharacterCard({ character: c, relationships, index, onOpen, onEdit, onDelete, canEdit }) {
  const relationCount = relationships.filter(r => r.from_character === c.id || r.to_character === c.id).length;
  return <article className={`character-card character-card-${index % 4}`}><button className="character-card-main" onClick={onOpen}><div className="character-portrait"><Avatar character={c} size="xl"/><div className="portrait-label">SIM FILE · {String(index+1).padStart(2,'0')}</div><div className="portrait-flowers">✿ ✧</div></div><div className="character-card-info"><div className="character-name-row"><h3>{c.name || 'Без имени'}</h3>{c.is_favorite && <Heart size={15} fill="currentColor" className="liked-heart"/>}</div><p className="character-age">{c.age || 'Возраст не указан'}{c.career ? ` · ${c.career}` : ''}</p>{c.personality && <p className="character-summary">{c.personality}</p>}<div className="trait-row">{safeArray(c.traits).slice(0,3).map(t => <span key={t}>{t}</span>)}</div><div className="character-card-footer"><span><Link2 size={14}/>{relationCount} связей</span><span>открыть досье <ChevronRight size={13}/></span></div></div></button>
    {canEdit && <div className="card-actions"><IconButton title="Редактировать" onClick={onEdit}><Pencil size={15}/></IconButton><IconButton title="Удалить" onClick={onDelete}><Trash2 size={15}/></IconButton></div>}
  </article>;
}

function StoriesPage({ stories, onCreate, onEdit, onOpen, onDelete, canEdit }) {
  const [search, setSearch] = useState(''); const [mood, setMood] = useState('Все настроения');
  const moods = ['Все настроения', ...new Set(stories.map(s => s.mood).filter(Boolean))];
  const filtered = stories.filter(s => (mood === 'Все настроения' || s.mood === mood) && [s.title,s.subtitle,s.content,s.quote,...safeArray(s.tags)].join(' ').toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru'))).sort((a,b) => new Date(b.created_at || 0)-new Date(a.created_at || 0));
  return <div className="page-content"><PageHeader kicker="CHAPTERS & LITTLE MEMORIES" title="Истории" description="Главы, сцены, письма и моменты, которые делают династию живой." icon={BookOpen} action={canEdit ? onCreate : null} actionLabel="Новая глава" />
    <div className="story-intro-note"><span>✧</span><p><b>Формат маленького журнала.</b> Добавляй абзацы, подзаголовки, цитаты и фотографии между ними — пусть каждая глава выглядит как отдельная история.</p><span>♡</span></div>
    <div className="list-toolbar"><label className="toolbar-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по заголовкам и тексту…"/><span>{filtered.length}</span></label><label className="sort-select"><Flower2 size={15}/><select value={mood} onChange={e => setMood(e.target.value)}>{moods.map(m => <option key={m}>{m}</option>)}</select><ChevronDown size={14}/></label></div>
    {filtered.length ? <div className="story-grid">{filtered.map((s, i) => <StoryCard key={s.id} story={s} index={i} onOpen={() => onOpen(s)} onEdit={() => onEdit(s)} onDelete={() => onDelete(s)} canEdit={canEdit} />)}</div> : <EmptyState icon={BookHeart} title={search ? 'Главы не найдены' : 'Первая глава ждёт тебя'} text={search ? 'Попробуй поискать по другому слову.' : 'Начни с небольшой сцены, важного разговора или воспоминания персонажа.'} action={canEdit ? onCreate : undefined} actionLabel="Написать главу" />}
  </div>;
}
function StoryCard({ story, index, onOpen, onEdit, onDelete, canEdit }) {
  const heroImage = safeArray(story.blocks).find(b => b.type === 'image' && b.url)?.url;
  const preview = (story.content || safeArray(story.blocks).filter(b => b.type === 'paragraph').map(b => b.text).join(' ')).trim();
  return <article className={`story-card story-card-${index % 4}`}><button className={`story-card-visual ${heroImage ? 'has-photo' : ''}`} onClick={onOpen} style={heroImage ? { backgroundImage: `linear-gradient(180deg, rgba(65,42,53,.02),rgba(65,42,53,.25)), url("${heroImage}")` } : {}}><div className="story-visual-top"><span>CHAPTER {String(index+1).padStart(2,'0')}</span><span>✧</span></div>{!heroImage && <div className="story-doodle-landscape"><span className="doodle-moon"/><span className="doodle-mountain mountain-a"/><span className="doodle-mountain mountain-b"/><span className="doodle-flower">✿</span><span className="doodle-stars">✦　·　✧</span></div>}<span className="story-card-ribbon">{story.mood || 'Глава'}</span></button><div className="story-card-body"><div className="story-card-meta"><span><CalendarDays size={13}/>{story.created_at ? new Date(story.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Без даты'}</span><span>✿ {safeArray(story.tags).length} тегов</span></div><button className="story-title-button" onClick={onOpen}><h3>{story.title}</h3>{story.subtitle && <small>{story.subtitle}</small>}</button><p>{preview || 'История пока хранит свои слова при себе…'}</p>{story.quote && <blockquote>“{story.quote}”</blockquote>}<div className="story-card-bottom"><button onClick={onOpen}>Читать главу <ArrowUpRight size={14}/></button><div>{safeArray(story.tags).slice(0,2).map(t => <TagPill key={t}>{t}</TagPill>)}</div></div></div>{canEdit && <div className="story-card-actions"><IconButton title="Редактировать главу" onClick={onEdit}><Pencil size={15}/></IconButton><IconButton title="Удалить главу" onClick={onDelete}><Trash2 size={15}/></IconButton></div>}</article>;
}

function FamilyTreePage({ characters, relationships, treeRows, onCreateRelation, onMove, onEditRelation, onDeleteRelation, openCharacter, canEdit, notify }) {
  const viewportRef = useRef(null);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 48, y: 20 });
  const [drag, setDrag] = useState(null);
  const [selectedRel, setSelectedRel] = useState(null);
  const fallbackPositions = useMemo(() => Object.fromEntries(characters.map((c, i) => [c.id, { x: 100 + (i % 3) * 330, y: 130 + Math.floor(i / 3) * 220 }])), [characters]);
  const positions = useMemo(() => Object.fromEntries(characters.map(c => {
    const saved = treeRows.find(r => r.character_id === c.id);
    return [c.id, { x: Number(saved?.x ?? fallbackPositions[c.id]?.x ?? 120), y: Number(saved?.y ?? fallbackPositions[c.id]?.y ?? 120) }];
  })), [characters, treeRows, fallbackPositions]);
  const center = (id) => positions[id] ? { x: positions[id].x + 116, y: positions[id].y + 71 } : null;
  const relsToDraw = relationships.filter(r => positions[r.from_character] && positions[r.to_character]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(z => Math.max(0.38, Math.min(1.55, z + (e.deltaY < 0 ? 0.06 : -0.06))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onBoardDown = (e) => {
    if (e.target.closest('.tree-node') || e.target.closest('.tree-edge-label') || e.target.closest('.tree-edge-actions')) return;
    setDrag({ kind: 'pan', startX: e.clientX, startY: e.clientY, originX: pan.x, originY: pan.y });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onBoardMove = (e) => {
    if (!drag) return;
    if (drag.kind === 'pan') setPan({ x: drag.originX + e.clientX - drag.startX, y: drag.originY + e.clientY - drag.startY });
    else if (drag.kind === 'node') {
      const x = Math.max(0, Math.min(2100, drag.originNodeX + (e.clientX - drag.startX) / zoom));
      const y = Math.max(0, Math.min(1250, drag.originNodeY + (e.clientY - drag.startY) / zoom));
      setDrag(prev => ({ ...prev, currentX: x, currentY: y }));
    }
  };
  const onBoardUp = (e) => {
    if (drag?.kind === 'node') onMove(drag.characterId, drag.currentX ?? drag.originNodeX, drag.currentY ?? drag.originNodeY);
    setDrag(null);
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
  };
  const startNodeDrag = (e, character) => {
    if (!canEdit) return;
    e.stopPropagation();
    const p = positions[character.id] || { x: 120, y: 120 };
    setDrag({ kind: 'node', characterId: character.id, startX: e.clientX, startY: e.clientY, originNodeX: p.x, originNodeY: p.y, currentX: p.x, currentY: p.y });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const positionFor = (id) => drag?.kind === 'node' && drag.characterId === id ? { x: drag.currentX ?? drag.originNodeX, y: drag.currentY ?? drag.originNodeY } : positions[id];
  const zoomBy = (v) => setZoom(z => Math.max(0.38, Math.min(1.55, Number((z + v).toFixed(2)))));

  return <div className="page-content tree-page"><PageHeader kicker="ROOTS, BRANCHES & CONNECTIONS" title="Древо семьи" description="Перемещай карточки, исследуй связи и смотри, как разрастается твоя вселенная." icon={Network} action={canEdit ? onCreateRelation : null} actionLabel="Добавить связь" actionIcon={Link2} />
    <div className="tree-toolbar"><div className="tree-legend"><span><i style={{ background: REL_COLORS['мама'] }}/> семья</span><span><i style={{ background: REL_COLORS['партнёр'] }} /> партнёры</span><span><i className="legend-dashed" style={{ borderColor: REL_COLORS['тайная связь'] }} /> тайная связь</span><span><i style={{ background: REL_COLORS['друг'] }} /> дружба</span></div><div className="tree-tools"><span className="zoom-level">{Math.round(zoom * 100)}%</span><IconButton title="Уменьшить" onClick={() => zoomBy(-0.1)}><ZoomOut size={17}/></IconButton><IconButton title="Увеличить" onClick={() => zoomBy(0.1)}><ZoomIn size={17}/></IconButton><IconButton title="Сбросить масштаб и позицию" onClick={() => { setZoom(0.8); setPan({ x: 48, y: 20 }); }}><RefreshCw size={16}/></IconButton></div></div>
    <div className="tree-board-frame"><div className="tree-board" ref={viewportRef} onPointerDown={onBoardDown} onPointerMove={onBoardMove} onPointerUp={onBoardUp} onPointerCancel={onBoardUp}>
      <div className="tree-world" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <svg className="tree-lines" width="2300" height="1450" viewBox="0 0 2300 1450" aria-label="Линии семейных связей">{relsToDraw.map(r => {
          const a = center(r.from_character); const b = center(r.to_character); const color = REL_COLORS[r.type] || '#d19bae';
          const actualA = drag?.kind === 'node' && drag.characterId === r.from_character ? { x: drag.currentX + 116, y: drag.currentY + 71 } : a;
          const actualB = drag?.kind === 'node' && drag.characterId === r.to_character ? { x: drag.currentX + 116, y: drag.currentY + 71 } : b;
          const dx = actualB.x - actualA.x; const dy = actualB.y - actualA.y;
          const path = `M ${actualA.x} ${actualA.y} C ${actualA.x + dx*0.36} ${actualA.y + dy*0.08}, ${actualB.x - dx*0.36} ${actualB.y - dy*0.08}, ${actualB.x} ${actualB.y}`;
          const labelX = (actualA.x + actualB.x)/2; const labelY = (actualA.y + actualB.y)/2 - 8;
          return <g key={r.id} className="tree-edge" onClick={(e) => { e.stopPropagation(); setSelectedRel(r); }}><path d={path} stroke={color} strokeWidth="3" strokeDasharray={REL_DASH[r.type] || ''} fill="none" opacity={selectedRel?.id === r.id ? 1 : .72}/><circle cx={actualA.x} cy={actualA.y} r="4" fill={color}/><circle cx={actualB.x} cy={actualB.y} r="4" fill={color}/><rect x={labelX - 54} y={labelY - 13} width="108" height="25" rx="12" fill="#fff9fb" stroke={color} strokeWidth="1"/><text x={labelX} y={labelY + 4} textAnchor="middle" fill="#765667" fontSize="11" fontFamily="DM Sans, sans-serif">{r.type}</text></g>;
        })}</svg>
        {characters.map((c, i) => {
          const p = positionFor(c.id) || { x: 80 + (i%3)*340, y: 90 + Math.floor(i/3)*220 };
          const connected = relationships.filter(r => r.from_character === c.id || r.to_character === c.id).length;
          return <div key={c.id} className={`tree-node ${drag?.kind === 'node' && drag.characterId === c.id ? 'dragging' : ''}`} style={{ left: `${p.x}px`, top: `${p.y}px` }} onPointerDown={(e) => startNodeDrag(e, c)}>
            <div className="tree-node-top"><span>✿ CHARACTER FILE</span>{c.is_favorite && <Star size={12} fill="currentColor"/>}</div><button className="tree-node-main" onClick={(e) => { if (drag) return; e.stopPropagation(); openCharacter(c); }}><Avatar character={c} size="sm"/><span><strong>{c.name}</strong><small>{c.age || 'Возраст неизвестен'}</small></span><ChevronRight size={15}/></button><div className="tree-node-bottom"><span><Link2 size={12}/>{connected} связи</span><span>{c.career || 'история продолжается'}</span></div><span className="tree-node-handle tl"/><span className="tree-node-handle tr"/><span className="tree-node-handle bl"/><span className="tree-node-handle br"/></div>;
        })}
        {!characters.length && <div className="tree-empty"><div>✧</div><h3>Здесь вырастет твоё древо</h3><p>Добавь персонажей, а затем соедини их отношениями.</p></div>}
      </div>
      <div className="tree-corner-label"><span>✦</span> THE FAMILY ARCHIVE <small>drag to move · zoom to explore</small></div>
      <div className="tree-board-hint"><Move size={13}/> {canEdit ? 'Перетаскивай карточки · Ctrl/⌘ + колесо — масштаб' : 'Нажми на карточку, чтобы открыть досье'}</div>
    </div></div>
    {selectedRel && <div className="selected-relationship"><div className="selected-relation-icon" style={{ color: REL_COLORS[selectedRel.type] || '#d19bae' }}><Heart size={17}/></div><div className="selected-relation-copy"><b>{characters.find(c => c.id === selectedRel.from_character)?.name || 'Персонаж'} <span>↔</span> {characters.find(c => c.id === selectedRel.to_character)?.name || 'Персонаж'}</b><small>{selectedRel.type} · {selectedRel.status || 'Активна'}</small><p>{selectedRel.description || 'У этой связи пока нет описания.'}</p></div>{canEdit && <div className="selected-relation-actions"><IconButton title="Редактировать связь" onClick={() => onEditRelation(selectedRel)}><Pencil size={15}/></IconButton><IconButton title="Удалить связь" onClick={() => onDeleteRelation(selectedRel)}><Trash2 size={15}/></IconButton></div>}<IconButton title="Скрыть описание" onClick={() => setSelectedRel(null)}><X size={16}/></IconButton></div>}
    <div className="tree-help-row"><span><Grip size={15}/> Карточки можно расставлять в любом порядке</span><span><Heart size={14}/> Линии показывают направление истории, а не правду в последней инстанции</span></div>
  </div>;
}

function RelationshipsPage({ relationships, characters, onCreate, onEdit, onDelete, canEdit }) {
  const [filter, setFilter] = useState('Все типы'); const [search, setSearch] = useState('');
  const typeList = ['Все типы', ...new Set(relationships.map(r => r.type).filter(Boolean))];
  const filtered = relationships.filter(r => {
    const from = characters.find(c => c.id === r.from_character); const to = characters.find(c => c.id === r.to_character);
    return (filter === 'Все типы' || r.type === filter) && [from?.name,to?.name,r.type,r.description,r.status,...safeArray(r.tags)].join(' ').toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru'));
  });
  return <div className="page-content"><PageHeader kicker="THE INVISIBLE THREADS" title="Отношения" description="Родственные узы, дружба, бывшие и связи, о которых пока никто не знает." icon={HeartHandshake} action={canEdit ? onCreate : null} actionLabel="Новая связь" actionIcon={Link2} />
    <div className="relationship-summary"><div className="relationship-summary-icon"><HeartHandshake size={20}/></div><div><b>{relationships.length} нитей связывают эту историю</b><p>У отношений есть свой характер: некоторые согревают, другие усложняют сюжет.</p></div><div className="relationship-type-counts">{Object.keys(REL_COLORS).slice(0,4).map(t => <span key={t}><i style={{ background: REL_COLORS[t] }}/>{t}</span>)}</div></div>
    <div className="list-toolbar"><label className="toolbar-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Найти по персонажу или описанию…"/><span>{filtered.length}</span></label><label className="sort-select"><Filter size={15}/><select value={filter} onChange={e => setFilter(e.target.value)}>{typeList.map(t => <option key={t}>{t}</option>)}</select><ChevronDown size={14}/></label></div>
    {filtered.length ? <div className="relationship-list">{filtered.map(r => <RelationshipCard key={r.id} relationship={r} characters={characters} onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} canEdit={canEdit} />)}</div> : <EmptyState icon={HeartHandshake} title="Связи ещё не прописаны" text="Свяжи двух персонажей и опиши, что на самом деле происходит между ними." action={canEdit ? onCreate : undefined} actionLabel="Добавить первую связь" />}
  </div>;
}
function RelationshipCard({ relationship: r, characters, onEdit, onDelete, canEdit }) {
  const from = characters.find(c => c.id === r.from_character); const to = characters.find(c => c.id === r.to_character); const color = REL_COLORS[r.type] || '#d19bae';
  return <article className="relationship-card"><div className="relation-kind" style={{ color, backgroundColor: `${color}1c` }}><Heart size={16}/><span>{r.type}</span></div><div className="relation-people"><div className="relation-person"><Avatar character={from} size="sm"/><div><b>{from?.name || 'Персонаж удалён'}</b><small>{from?.age || '—'}</small></div></div><div className={`relation-connector ${REL_DASH[r.type] ? 'dashed' : ''}`} style={{ borderColor: color, color }}><span>♡</span></div><div className="relation-person"><Avatar character={to} size="sm"/><div><b>{to?.name || 'Персонаж удалён'}</b><small>{to?.age || '—'}</small></div></div></div><div className="relation-description"><span className="status-dot" style={{ background: color }}/><span>{r.description || 'Описание связи ещё не добавлено.'}</span></div><div className="relation-status">{r.status || 'Активна'}</div>{canEdit && <div className="relation-actions"><IconButton title="Редактировать связь" onClick={onEdit}><Pencil size={15}/></IconButton><IconButton title="Удалить связь" onClick={onDelete}><Trash2 size={15}/></IconButton></div>}</article>;
}

function IdeasPage({ ideas, onCreate, onEdit, onDelete, canEdit }) {
  const [category, setCategory] = useState('Все'); const [status, setStatus] = useState('Все статусы'); const [search, setSearch] = useState('');
  const categories = ['Все', ...new Set(ideas.map(i => i.category).filter(Boolean))]; const statuses = ['Все статусы', ...new Set(ideas.map(i => i.status).filter(Boolean))];
  const filtered = ideas.filter(i => (category === 'Все' || i.category === category) && (status === 'Все статусы' || i.status === status) && [i.title,i.content,i.category,i.status,...safeArray(i.tags)].join(' ').toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru')));
  const toneIndex = (s) => ['Сцена','Конфликт','Диалог','Поворот','Персонаж'].indexOf(s) < 0 ? 0 : ['Сцена','Конфликт','Диалог','Поворот','Персонаж'].indexOf(s);
  return <div className="page-content"><PageHeader kicker="SCRAPS OF FUTURE STORIES" title="Идеи" description="Быстрые заметки, внезапные конфликты и реплики, которые слишком хороши, чтобы их забыть." icon={Lightbulb} action={canEdit ? onCreate : null} actionLabel="Записать идею" actionIcon={Feather} />
    <div className="idea-mantra"><span>✧</span><div><b>Не нужно сразу писать шедевр.</b><p>Достаточно сохранить искру — остальное можно придумать потом.</p></div><span className="mantra-cat">ฅ^•ﻌ•^ฅ</span></div>
    <div className="list-toolbar"><label className="toolbar-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Найти сцену, конфликт или реплику…"/><span>{filtered.length}</span></label><label className="sort-select"><Lightbulb size={15}/><select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select><ChevronDown size={14}/></label><label className="sort-select"><CheckCircle2 size={15}/><select value={status} onChange={e => setStatus(e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={14}/></label></div>
    {filtered.length ? <div className="idea-grid">{filtered.map((idea,i) => <article key={idea.id} className={`idea-card idea-card-${toneIndex(idea.category)}`}><div className="idea-card-top"><span className="idea-cat"><span>✦</span>{idea.category || 'Сцена'}</span><span className="idea-status">{idea.status || 'В планах'}</span></div><h3>{idea.title}</h3><p>{idea.content || 'Идея ждёт, пока у неё появятся детали…'}</p><div className="idea-tags">{safeArray(idea.tags).map(t => <TagPill key={t}>{t}</TagPill>)}</div><div className="idea-card-footer"><span><Clock size={13}/>{idea.created_at ? new Date(idea.created_at).toLocaleDateString('ru-RU') : 'Без даты'}</span>{canEdit && <div><IconButton title="Редактировать идею" onClick={() => onEdit(idea)}><Pencil size={15}/></IconButton><IconButton title="Удалить идею" onClick={() => onDelete(idea)}><Trash2 size={15}/></IconButton></div>}</div><span className="idea-decoration">{['✿','☁','♡','✧','☾'][toneIndex(idea.category)]}</span></article>)}</div> : <EmptyState icon={Lightbulb} title="Чистый лист — тоже начало" text={search ? 'По этому запросу пока ничего нет.' : 'Сохрани первую задумку. Неважно, насколько она пока сырая.'} action={canEdit ? onCreate : undefined} actionLabel="Записать идею" />}
  </div>;
}

function SearchPage({ query, setQuery, tags, selectedTag, setSelectedTag, results, onOpenCharacter, onOpenStory, onOpenRelationship, characters, onCreateCharacter }) {
  const total = results.characters.length + results.stories.length + results.relationships.length + results.ideas.length;
  return <div className="page-content"><PageHeader kicker="FIND THE THREAD" title="Поиск и теги" description="Одно имя, случайная реплика или тег — и нужный кусочек истории найдётся." icon={Search} />
    <div className="search-hero"><div className="search-hero-icon"><Search size={22}/></div><div><b>Что будем искать?</b><p>Поиск проходит по анкетам, биографиям, секретам, главам, идеям и описаниям связей.</p></div><span className="search-star">✧</span><label className="big-search"><Search size={19}/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Например: письмо, детство, тайная связь…"/>{query && <button onClick={() => setQuery('')}><X size={15}/></button>}</label></div>
    <section className="tag-cloud-section"><div className="section-title"><h2>Путеводитель по тегам <span className="title-flower">✿</span></h2><span className="muted-count">{tags.length} меток</span></div><div className="tag-cloud"><button className={`tag-cloud-chip ${!selectedTag ? 'selected' : ''}`} onClick={() => setSelectedTag('')}>Все теги <span>{tags.length}</span></button>{tags.map((t,i) => <button className={`tag-cloud-chip tag-cloud-${i%5} ${selectedTag === t ? 'selected' : ''}`} key={t} onClick={() => setSelectedTag(selectedTag === t ? '' : t)}>#{t}</button>)}</div></section>
    {(query || selectedTag) ? <section className="search-results"><div className="search-results-head"><div><div className="eyebrow"><Sparkles size={13}/> FOUND IN YOUR UNIVERSE</div><h2>{total ? `Нашлось ${total} совпадений` : 'Пока ничего не нашлось'}</h2></div>{selectedTag && <button className="filter-chip is-on" onClick={() => setSelectedTag('')}>#{selectedTag} <X size={13}/></button>}</div>
      {results.characters.length > 0 && <ResultGroup title="Персонажи" icon={Users} count={results.characters.length}>{results.characters.map(c => <button className="search-result-card" key={c.id} onClick={() => onOpenCharacter(c)}><Avatar character={c} size="sm"/><span><b>{c.name}</b><small>{c.career || c.age || 'Досье персонажа'}</small></span><ArrowUpRight size={15}/></button>)}</ResultGroup>}
      {results.stories.length > 0 && <ResultGroup title="Главы" icon={BookOpen} count={results.stories.length}>{results.stories.map(s => <button className="search-result-card" key={s.id} onClick={() => onOpenStory(s)}><span className="result-icon"><BookOpen size={17}/></span><span><b>{s.title}</b><small>{s.subtitle || (s.mood ? `${s.mood} · ` : '') + (s.content || '').slice(0,82)}</small></span><ArrowUpRight size={15}/></button>)}</ResultGroup>}
      {results.relationships.length > 0 && <ResultGroup title="Отношения" icon={HeartHandshake} count={results.relationships.length}>{results.relationships.map(r => <div className="search-result-card result-static" key={r.id}><span className="result-icon" style={{ color: REL_COLORS[r.type] || '#d19bae' }}><Heart size={17}/></span><span><b>{r.type}: {characters.find(c => c.id === r.from_character)?.name || 'Персонаж'} ↔ {characters.find(c => c.id === r.to_character)?.name || 'Персонаж'}</b><small>{r.description || 'Описание связи'}</small></span><span className="result-status">{r.status || 'Активна'}</span></div>)}</ResultGroup>}
      {results.ideas.length > 0 && <ResultGroup title="Идеи" icon={Lightbulb} count={results.ideas.length}>{results.ideas.map(i => <div className="search-result-card result-static" key={i.id}><span className="result-icon"><Lightbulb size={17}/></span><span><b>{i.title}</b><small>{i.content || i.category}</small></span><span className="result-status">{i.status}</span></div>)}</ResultGroup>}
      {!total && <EmptyState icon={Search} title="Пустота тоже подсказка" text="Измени формулировку или выбери другой тег." action={onCreateCharacter} actionLabel="Добавить персонажа" />}
    </section> : <div className="search-empty-splash"><div className="splash-doodle">⌕</div><b>Начни с имени, слова или метки</b><p>Всё, что ты пишешь в архиве, может стать нитью к другой истории.</p><div className="quick-search-suggestions">{['семья','тайна','романтика','новое поколение'].map(t => <button key={t} onClick={() => { setSelectedTag(tags.includes(t) ? t : ''); setQuery(t); }}>{t} <ArrowUpRight size={12}/></button>)}</div></div>}
  </div>;
}
function ResultGroup({ title, icon: Icon, count, children }) { return <div className="result-group"><div className="result-group-head"><span><Icon size={16}/>{title}</span><small>{count}</small></div><div className="result-group-content">{children}</div></div>; }

function CharacterModal({ record, onClose, onSave, uploadImage, deleteStoredImage, onDelete, notify }) {
  const [form, setForm] = useState(() => ({ ...blankCharacter(), ...(record || {}), traits: safeArray(record?.traits), tags: safeArray(record?.tags) }));
  const [photoBusy, setPhotoBusy] = useState(false); const [saveBusy, setSaveBusy] = useState(false); const [removedPhoto, setRemovedPhoto] = useState(''); const [formError, setFormError] = useState('');
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const onPhoto = async (file) => {
    if (!file) return;
    setPhotoBusy(true); setFormError('');
    try { const next = await uploadImage(file, `characters/${form.id || 'new'}`); if (form.portrait_url && form.portrait_url !== next) setRemovedPhoto(form.portrait_url); set('portrait_url', next); notify('Портрет добавлен ✨'); }
    catch (e) { setFormError(e.message); }
    finally { setPhotoBusy(false); }
  };
  const submit = async (e) => {
    e.preventDefault(); setSaveBusy(true); setFormError('');
    try { await onSave({ ...form, name: form.name.trim(), traits: safeArray(form.traits), tags: safeArray(form.tags) }); if (removedPhoto && removedPhoto !== form.portrait_url) { try { await deleteStoredImage(removedPhoto); } catch {} } }
    catch (e2) { setFormError(e2.message || 'Не удалось сохранить персонажа.'); }
    finally { setSaveBusy(false); }
  };
  return <Modal title={record ? 'Редактировать персонажа' : 'Новый персонаж'} subtitle="У каждого сима есть прошлое, настоящее и история, которую ещё предстоит прожить." onClose={onClose} wide>
    <form onSubmit={submit} className="editor-form">
      <div className="character-form-top"><div className="character-photo-editor"><Avatar character={form} size="xxl"/><label className="upload-photo-button"><Camera size={15}/>{photoBusy ? 'Загружаем…' : form.portrait_url ? 'Заменить фото' : 'Добавить фото'}<input type="file" accept="image/*" disabled={photoBusy} onChange={e => { onPhoto(e.target.files?.[0]); e.target.value = ''; }}/></label>{form.portrait_url && <button type="button" className="remove-photo-link" onClick={() => { setRemovedPhoto(form.portrait_url); set('portrait_url', ''); }}>Удалить портрет</button>}<small>JPG, PNG, WEBP · до 15 МБ</small></div><div className="character-primary-fields"><FormField label="Полное имя" value={form.name} onChange={v => set('name',v)} placeholder="Например, Мира Вейл" required/><div className="form-grid-two"><FormField label="Возраст / этап жизни" value={form.age} onChange={v => set('age',v)} placeholder="Молодая взрослая"/><FormField label="Работа / карьера" value={form.career} onChange={v => set('career',v)} placeholder="Кем работает сим"/></div><FormField label="Внешность" value={form.appearance} onChange={v => set('appearance',v)} placeholder="Волосы, глаза, стиль, приметы…" multiline rows={3}/><FormField label="Характер" value={form.personality} onChange={v => set('personality',v)} placeholder="Каким его видят другие? А какой он на самом деле?" multiline rows={3}/></div></div>
      <div className="form-section-heading"><span>01</span><div><b>Личность</b><small>Что делает его именно им?</small></div></div><TagsField label="Черты характера" value={form.traits} onChange={v => set('traits',v)} placeholder="романтичный, ревнивый, смелый"/><div className="form-grid-two"><FormField label="Увлечения" value={form.hobbies} onChange={v => set('hobbies',v)} placeholder="Чем живёт вне работы?" multiline/><FormField label="Страхи" value={form.fears} onChange={v => set('fears',v)} placeholder="Чего боится потерять?" multiline/><FormField label="Мечты" value={form.dreams} onChange={v => set('dreams',v)} placeholder="К чему стремится?" multiline/><FormField label="Секреты" value={form.secrets} onChange={v => set('secrets',v)} placeholder="Что скрывает от остальных?" multiline/></div>
      <div className="form-section-heading"><span>02</span><div><b>История</b><small>Биография и следы прошлого</small></div></div><FormField label="Биография" value={form.biography} onChange={v => set('biography',v)} placeholder="Откуда он родом, что пережил, как оказался здесь…" multiline rows={6}/><TagsField value={form.tags} onChange={v => set('tags',v)}/><label className="favorite-toggle"><input type="checkbox" checked={Boolean(form.is_favorite)} onChange={e => set('is_favorite',e.target.checked)}/><span className="fake-check"><Heart size={14} fill="currentColor"/></span><span><b>Добавить в избранные</b><small>Персонаж появится на главной странице.</small></span></label>
      {formError && <div className="form-error"><CircleHelp size={15}/>{formError}</div>}
      <div className="modal-actions form-actions">{record && <Button variant="danger-ghost" icon={Trash2} onClick={onDelete}>Удалить персонажа</Button>}<span className="form-actions-spacer"/><Button variant="soft" onClick={onClose}>Отмена</Button><Button type="submit" icon={Save} disabled={saveBusy || photoBusy}>{saveBusy ? 'Сохраняю…' : 'Сохранить персонажа'}</Button></div>
    </form>
  </Modal>;
}

function StoryModal({ record, onClose, onSave, uploadImage, deleteStoredImage, notify }) {
  const initialBlocks = record && safeArray(record.blocks).length ? record.blocks : record?.content ? record.content.split(/\n\s*\n/).filter(Boolean).map(text => ({ type: 'paragraph', text })) : [{ type: 'paragraph', text: '' }];
  const [form, setForm] = useState(() => ({ ...blankStory(), ...(record || {}), tags: safeArray(record?.tags), blocks: initialBlocks }));
  const [busyBlock, setBusyBlock] = useState(''); const [saveBusy, setSaveBusy] = useState(false); const [error, setError] = useState(''); const [removedUrls, setRemovedUrls] = useState([]);
  const updateBlock = (index, change) => setForm(prev => ({ ...prev, blocks: prev.blocks.map((b,i) => i === index ? { ...b, ...change } : b) }));
  const addBlock = (type) => setForm(prev => ({ ...prev, blocks: [...prev.blocks, type === 'image' ? { type, url: '', caption: '', alt: '' } : { type, text: '' }] }));
  const removeBlock = (index) => { const block = form.blocks[index]; if (block?.type === 'image' && block.url) setRemovedUrls(prev => [...prev, block.url]); setForm(prev => ({ ...prev, blocks: prev.blocks.filter((_,i) => i !== index) })); };
  const moveBlock = (i, diff) => setForm(prev => { const n = [...prev.blocks]; const j = i + diff; if (j < 0 || j >= n.length) return prev; [n[i],n[j]] = [n[j],n[i]]; return { ...prev, blocks: n }; });
  const uploadBlock = async (index, file) => {
    if (!file) return; setBusyBlock(String(index)); setError('');
    try { const url = await uploadImage(file, `stories/${form.id || 'new'}`); const old = form.blocks[index]?.url; if (old) setRemovedUrls(prev => [...prev, old]); updateBlock(index, { url, alt: file.name }); notify('Фото добавлено в главу ✨'); }
    catch (e) { setError(e.message); } finally { setBusyBlock(''); }
  };
  const submit = async (e) => {
    e.preventDefault(); setSaveBusy(true); setError('');
    try {
      const blocks = form.blocks.map(b => ({ ...b }));
      const content = blocks.filter(b => ['paragraph','heading','quote'].includes(b.type)).map(b => b.text || '').join('\n\n');
      await onSave({ ...form, title: form.title.trim(), content, blocks });
      for (const url of removedUrls) if (!blocks.some(b => b.url === url)) { try { await deleteStoredImage(url); } catch {} }
    } catch (e2) { setError(e2.message || 'Не удалось сохранить главу.'); }
    finally { setSaveBusy(false); }
  };
  const BLOCK_LABELS = { paragraph: 'Абзац', heading: 'Подзаголовок', quote: 'Цитата', image: 'Фотография' };
  return <Modal title={record ? 'Редактировать главу' : 'Новая глава'} subtitle="Собери историю из текста, фотографий и маленьких деталей." onClose={onClose} wide>
    <form className="editor-form story-editor-form" onSubmit={submit}><div className="form-grid-two"><FormField label="Название главы" value={form.title} onChange={v => setForm(p => ({...p,title:v}))} placeholder="Например, Дом, в котором горит свет" required/><FormField label="Подзаголовок" value={form.subtitle} onChange={v => setForm(p => ({...p,subtitle:v}))} placeholder="Глава 01 · Начало чего-то нового"/></div><div className="form-grid-two"><SelectField label="Настроение главы" value={form.mood} onChange={v => setForm(p => ({...p,mood:v}))} options={['Нежность','Ностальгия','Тайна','Драма','Романтика','Радость','Грусть','Надежда','Хаос','Напряжение']}/><FormField label="Цитата главы" value={form.quote} onChange={v => setForm(p => ({...p,quote:v}))} placeholder="Одна фраза, которую хочется запомнить…"/></div>
      <div className="form-section-heading"><span>✧</span><div><b>Конструктор главы</b><small>Добавляй блоки и меняй их порядок — как в журнальной статье.</small></div></div>
      <div className="story-block-list">{form.blocks.map((block,index) => <div className={`story-block-editor block-${block.type}`} key={`${index}-${block.type}`}><div className="story-block-editor-head"><div className="block-grip"><Grip size={15}/><span>{String(index+1).padStart(2,'0')}</span></div><span className="block-type-label">{block.type === 'heading' ? <><span>H</span> Подзаголовок</> : block.type === 'paragraph' ? <><Feather size={13}/> Абзац</> : block.type === 'quote' ? <><Quote size={13}/> Цитата</> : <><ImagePlus size={13}/> Фотография</>}</span><div className="block-move-actions"><IconButton title="Выше" disabled={index===0} onClick={() => moveBlock(index,-1)}><ChevronLeft className="rotate-minus" size={14}/></IconButton><IconButton title="Ниже" disabled={index===form.blocks.length-1} onClick={() => moveBlock(index,1)}><ChevronRight className="rotate-plus" size={14}/></IconButton><IconButton title="Удалить блок" onClick={() => removeBlock(index)}><Trash2 size={14}/></IconButton></div></div>
        {block.type === 'image' ? <div className="image-block-editor">{block.url ? <div className="image-block-preview"><img src={block.url} alt={block.alt || ''}/><button type="button" onClick={() => { setRemovedUrls(prev => [...prev, block.url]); updateBlock(index,{url:''}); }}><Trash2 size={13}/> Убрать фото</button></div> : <label className="image-dropzone"><ImagePlus size={23}/><b>{busyBlock === String(index) ? 'Загружаем фото…' : 'Добавить фотографию'}</b><span>Нажми, чтобы выбрать файл с устройства · до 15 МБ</span><input type="file" accept="image/*" disabled={Boolean(busyBlock)} onChange={e => { uploadBlock(index,e.target.files?.[0]); e.target.value=''; }}/></label>}<FormField label="Подпись к фотографии" value={block.caption || ''} onChange={v => updateBlock(index,{caption:v})} placeholder="Где, когда и почему этот кадр важен?"/></div> : <FormField label={block.type === 'heading' ? 'Заголовок раздела' : block.type === 'quote' ? 'Текст цитаты' : 'Текст абзаца'} value={block.text || ''} onChange={v => updateBlock(index,{text:v})} placeholder={block.type === 'heading' ? 'Новая сцена…' : block.type === 'quote' ? 'Слова, которые останутся с читателем…' : 'Пиши свободно. Абзац может быть длинным…'} multiline rows={block.type === 'paragraph' ? 5 : 2}/>}</div>)}</div>
      <div className="add-block-row"><span>Добавить блок:</span><button type="button" onClick={() => addBlock('paragraph')}><Plus size={14}/> Абзац</button><button type="button" onClick={() => addBlock('heading')}><Plus size={14}/> Заголовок</button><button type="button" onClick={() => addBlock('quote')}><Plus size={14}/> Цитата</button><button type="button" onClick={() => addBlock('image')}><ImagePlus size={14}/> Фото</button></div>
      <TagsField value={form.tags} onChange={v => setForm(p => ({...p,tags:v}))} label="Теги главы"/><label className="favorite-toggle"><input type="checkbox" checked={Boolean(form.published)} onChange={e => setForm(p => ({...p,published:e.target.checked}))}/><span className="fake-check"><Eye size={14}/></span><span><b>Показывать в публичном архиве</b><small>Если снять галочку, глава не будет выводиться гостям после подключения правил публикации.</small></span></label>
      {error && <div className="form-error"><CircleHelp size={15}/>{error}</div>}<div className="modal-actions form-actions"><span className="form-actions-spacer"/><Button variant="soft" onClick={onClose}>Отмена</Button><Button type="submit" icon={Save} disabled={saveBusy || Boolean(busyBlock)}>{saveBusy ? 'Сохраняю…' : 'Сохранить главу'}</Button></div>
    </form>
  </Modal>;
}

function IdeaModal({ record, onClose, onSave }) {
  const [form, setForm] = useState({ ...blankIdea(), ...(record || {}), tags: safeArray(record?.tags) }); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p => ({ ...p, [k]: v }));
  const submit = async e => { e.preventDefault(); setSaving(true); setError(''); try { await onSave({ ...form, title: form.title.trim() }); } catch (e2) { setError(e2.message); } finally { setSaving(false); } };
  return <Modal title={record ? 'Изменить идею' : 'Новая идея'} subtitle="Сохрани маленькую искру для будущей главы." onClose={onClose}><form className="editor-form" onSubmit={submit}><FormField label="Название" value={form.title} onChange={v => set('title',v)} placeholder="Разговор после полуночи" required/><div className="form-grid-two"><SelectField label="Тип идеи" value={form.category} onChange={v => set('category',v)} options={['Сцена','Конфликт','Диалог','Поворот сюжета','Персонаж','Локация','Финал','Другое']}/><SelectField label="Статус" value={form.status} onChange={v => set('status',v)} options={['В планах','Черновик','В работе','Использовано','Отложено']}/></div><FormField label="Сама задумка" value={form.content} onChange={v => set('content',v)} placeholder="Что случается? Кто участвует? Какая эмоция должна остаться?" multiline rows={7}/><TagsField value={form.tags} onChange={v => set('tags',v)}/>{error && <div className="form-error"><CircleHelp size={15}/>{error}</div>}<div className="modal-actions form-actions"><span className="form-actions-spacer"/><Button variant="soft" onClick={onClose}>Отмена</Button><Button type="submit" icon={Save} disabled={saving}>{saving ? 'Сохраняю…' : 'Сохранить идею'}</Button></div></form></Modal>;
}

function RelationshipModal({ record, characters, onClose, onSave }) {
  const [form, setForm] = useState({ ...blankRelationship(), ...(record || {}), tags: safeArray(record?.tags) }); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p => ({ ...p, [k]: v }));
  const submit = async e => { e.preventDefault(); setSaving(true); setError(''); try { await onSave(form); } catch (e2) { setError(e2.message || 'Не удалось сохранить связь.'); } finally { setSaving(false); } };
  return <Modal title={record ? 'Редактировать связь' : 'Новая связь'} subtitle="Выбери двух персонажей и опиши, что их объединяет или разделяет." onClose={onClose}><form className="editor-form" onSubmit={submit}><div className="relationship-person-picker"><label className="form-field"><span>Первый персонаж *</span><select required value={form.from_character} onChange={e => set('from_character',e.target.value)}><option value="">Выбрать…</option>{characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="picker-heart" style={{ color: REL_COLORS[form.type] || '#d19bae' }}>♡</div><label className="form-field"><span>Второй персонаж *</span><select required value={form.to_character} onChange={e => set('to_character',e.target.value)}><option value="">Выбрать…</option>{characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
      <div className="form-grid-two"><SelectField label="Тип связи" value={form.type} onChange={v => set('type',v)} options={RELATION_TYPES}/><SelectField label="Статус" value={form.status} onChange={v => set('status',v)} options={['Активна','Завершена','Сложно','Скрытая','На паузе','Неизвестно']}/></div><div className="relation-type-preview"><span className="preview-line" style={{ borderColor: REL_COLORS[form.type] || '#d19bae', borderStyle: REL_DASH[form.type] ? 'dashed' : 'solid' }}/><span>Так будет выглядеть линия на семейном древе</span></div><FormField label="Описание связи" value={form.description} onChange={v => set('description',v)} placeholder="Как они познакомились? Что чувствуют? Что знают друг о друге?" multiline rows={5}/><TagsField value={form.tags} onChange={v => set('tags',v)} label="Теги связи" placeholder="доверие, ревность, семейная тайна"/>{error && <div className="form-error"><CircleHelp size={15}/>{error}</div>}{characters.length < 2 && <div className="form-note">Для создания связи нужно хотя бы два персонажа.</div>}<div className="modal-actions form-actions"><span className="form-actions-spacer"/><Button variant="soft" onClick={onClose}>Отмена</Button><Button type="submit" icon={Save} disabled={saving || characters.length < 2}>{saving ? 'Сохраняю…' : 'Сохранить связь'}</Button></div></form></Modal>;
}

function LoginModal({ onClose, notify }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [showPassword, setShowPassword] = useState(false);
  const submit = async e => { e.preventDefault(); setBusy(true); setError(''); try { if (!supabase) throw new Error('Сначала подключи Supabase: скопируй .env.example в .env.local и заполни ключи.'); const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (authError) throw authError; notify('Рада снова видеть тебя, хранительница историй ✨'); onClose(); } catch (e2) { setError(e2.message || 'Не удалось войти. Проверь почту и пароль.'); } finally { setBusy(false); } };
  return <Modal title="Привет, хранительница" subtitle="Войди в редактор, чтобы продолжить свою историю." onClose={onClose}><div className="login-illustration"><div className="login-illustration-star">✧</div><div className="login-illustration-lock"><LockKeyhole size={28}/></div><span>your little archive is safe</span><div className="login-illustration-heart">♡</div></div>{supabase ? <form className="editor-form login-form" onSubmit={submit}><FormField label="Email аккаунта владельца" value={email} onChange={setEmail} type="email" placeholder="you@example.com" required/><label className="form-field"><span>Пароль</span><div className="password-input"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Твой пароль" required/><button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label><div className="auth-info"><ShieldCheck size={16}/><span>Регистрация здесь отключена. Аккаунт создаётся вручную в Supabase — посторонние не смогут получить доступ через форму регистрации.</span></div>{error && <div className="form-error"><CircleHelp size={15}/>{error}</div>}<Button type="submit" icon={LogIn} disabled={busy}>{busy ? 'Проверяем доступ…' : 'Войти в редактор'}</Button></form> : <div className="login-demo"><p>Пока сайт работает в демо-режиме. После подключения Supabase здесь появится безопасный вход по аккаунту владельца.</p><Button onClick={onClose}>Понятно <Heart size={15}/></Button></div>}</Modal>;
}

function BackupModal({ canEdit, busy, onClose, onExport, onImport }) {
  const inputRef = useRef(null); const [restoreConfirm, setRestoreConfirm] = useState(false);
  return <Modal title="Резервные копии" subtitle="Твоя вселенная — это труд, к которому стоит бережно относиться." onClose={onClose}><div className="backup-illustration"><div className="backup-file"><FileDown size={28}/><span>JSON</span></div><div className="backup-star">✦</div><div className="backup-heart">♡</div></div><div className="backup-options"><div className="backup-option"><div className="backup-option-icon"><Download size={18}/></div><div><b>Экспортировать архив</b><p>Скачай JSON со всеми персонажами, главами, связями, идеями, тегами и фото (по возможности изображения будут встроены в файл).</p><Button icon={Download} onClick={onExport} disabled={busy}>Скачать JSON</Button></div></div><div className="backup-option"><div className="backup-option-icon"><Upload size={18}/></div><div><b>Импортировать копию</b><p>Добавит записи из JSON к текущему архиву и обновит записи с совпадающими ID. Это не заменяет и не очищает весь архив.</p>{!canEdit && <small className="auth-required-note">Для импорта нужен вход владельца.</small>}<Button variant="soft" icon={FileUp} onClick={() => { if (!canEdit) return; setRestoreConfirm(true); }} disabled={busy || !canEdit}>Выбрать JSON-файл</Button></div></div></div>{restoreConfirm && <div className="import-confirm"><p><b>Добавить записи из копии?</b> Существующие записи с совпадающими ID обновятся. Перед массовым импортом рекомендуется экспортировать текущую версию.</p><input ref={inputRef} type="file" accept="application/json,.json" onChange={e => { const file=e.target.files?.[0]; if(file) { onImport(file); onClose(); } e.target.value=''; }} /><div className="modal-actions"><Button variant="soft" onClick={() => setRestoreConfirm(false)}>Назад</Button><Button icon={FileUp} onClick={() => inputRef.current?.click()} disabled={busy}>Выбрать файл</Button></div></div>}<div className="backup-tip"><ShieldCheck size={16}/><p><b>Небольшое напоминание:</b> JSON может содержать личные семейные сюжеты и фотографии. Храни файл там, где не будет случайного доступа.</p></div></Modal>;
}

function CharacterDetail({ character: c, relationships, characters, canEdit, onEdit, onClose, onSelect }) {
  const connected = relationships.filter(r => r.from_character === c.id || r.to_character === c.id);
  const relCharacter = r => characters.find(x => x.id === (r.from_character === c.id ? r.to_character : r.from_character));
  return <Modal title={c.name || 'Досье персонажа'} subtitle={c.age || 'Личное дело из архива династии'} onClose={onClose} wide><div className="character-detail"><div className="detail-portrait-column"><div className="detail-portrait"><Avatar character={c} size="xxl"/><span>SIM STORY UNIVERSE · CHARACTER FILE</span></div><div className="detail-mini-note"><Quote size={16}/><p>{c.dreams ? `«${c.dreams}»` : 'У каждого персонажа есть мечта, даже если он пока не может назвать её вслух.'}</p></div>{canEdit && <Button icon={Pencil} onClick={() => onEdit(c)}>Редактировать досье</Button>}</div><div className="detail-main-column"><div className="detail-section"><div className="eyebrow">✦ THE BASICS</div><h3>Личность и характер</h3>{c.personality && <p className="detail-lead">{c.personality}</p>}{c.appearance && <div className="detail-info-row"><span>Внешность</span><p>{c.appearance}</p></div>}{c.career && <div className="detail-info-row"><span>Работа</span><p>{c.career}</p></div>}{c.hobbies && <div className="detail-info-row"><span>Увлечения</span><p>{c.hobbies}</p></div>}{safeArray(c.traits).length > 0 && <div className="detail-info-row"><span>Черты</span><div className="trait-row">{c.traits.map(t => <span key={t}>{t}</span>)}</div></div>}</div>{c.biography && <div className="detail-section"><div className="eyebrow">✦ A LIFE IN WORDS</div><h3>Биография</h3><p className="detail-prose">{c.biography}</p></div>}<div className="detail-grid-two">{c.fears && <div className="detail-secret-card fear-card"><span>☾ Чего боится</span><p>{c.fears}</p></div>}{c.dreams && <div className="detail-secret-card dream-card"><span>✧ О чём мечтает</span><p>{c.dreams}</p></div>}</div>{c.secrets && <div className="detail-section secret-section"><div className="eyebrow"><LockKeyhole size={13}/> A LITTLE SECRET</div><h3>Секреты</h3><p>{c.secrets}</p></div>}{safeArray(c.tags).length>0 && <div className="detail-tags">{c.tags.map(t => <TagPill key={t}>{t}</TagPill>)}</div>}<div className="detail-section"><div className="section-title"><h3>Связи персонажа</h3><span className="muted-count">{connected.length}</span></div>{connected.length ? <div className="detail-relations">{connected.map(r => { const other = relCharacter(r); return <button key={r.id} className="detail-relation-row" onClick={() => other && onSelect(other)}><Avatar character={other} size="sm"/><span><b>{other?.name || 'Персонаж удалён'}</b><small>{r.type} · {r.status || 'Активна'}</small></span><span className="detail-rel-type" style={{ color: REL_COLORS[r.type] || '#d19bae' }}>{r.type}</span><ChevronRight size={15}/></button>; })}</div> : <p className="muted-copy">У этого персонажа пока нет прописанных связей.</p>}</div></div></div></Modal>;
}

function StoryReader({ story: s, canEdit, onEdit, onClose }) {
  const blocks = safeArray(s.blocks).length ? s.blocks : (s.content || '').split(/\n\s*\n/).filter(Boolean).map(text => ({ type: 'paragraph', text }));
  return <Modal title={s.title || 'История'} subtitle={s.subtitle || 'Из архива династии'} onClose={onClose} wide><article className="story-reader"><div className="story-reader-cover"><div className="reader-cover-overline">SIM STORY UNIVERSE · CHAPTER</div><div className="reader-cover-number">{s.created_at ? new Date(s.created_at).getDate().toString().padStart(2,'0') : '✧'}</div><h2>{s.title}</h2>{s.subtitle && <p>{s.subtitle}</p>}<span className="reader-cover-flower">✿</span><span className="reader-cover-mood">{s.mood || 'История'} · {s.created_at ? new Date(s.created_at).toLocaleDateString('ru-RU',{month:'long',year:'numeric'}) : 'без даты'}</span></div>{s.quote && <blockquote className="reader-opening-quote"><Quote size={20}/><p>{s.quote}</p><span>— из этой главы</span></blockquote>}<div className="story-reader-body">{blocks.map((b,i) => b.type === 'heading' ? <h3 key={i}>{b.text}</h3> : b.type === 'quote' ? <blockquote key={i} className="reader-inline-quote">“{b.text}”</blockquote> : b.type === 'image' ? b.url ? <figure className="reader-figure" key={i}><img src={b.url} alt={b.alt || b.caption || ''}/>{b.caption && <figcaption><span>✧</span> {b.caption}</figcaption>}</figure> : null : <p key={i}>{b.text}</p>)}</div>{safeArray(s.tags).length>0 && <div className="reader-tags">{s.tags.map(t => <TagPill key={t}>{t}</TagPill>)}</div>}<div className="reader-end-mark"><span>✧</span><span>конец главы</span><span>✧</span></div>{canEdit && <div className="reader-edit-bottom"><Button icon={Pencil} onClick={() => onEdit(s)}>Редактировать главу</Button></div>}</article></Modal>;
}
