import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const SHEET_CONFIG = {
  spreadsheetId: '1BvVWjkgcXLbUkt7fROJ_aofdZFNcEbrq',
  sheets: {
    Book_List: { sheet: 'Book_List', gid: '', csvUrl: '' },
    Tag_Color_Map: { sheet: 'Tag_Color_Map', gid: '', csvUrl: '' },
    Rarity_Config: { sheet: 'Rarity_Config', gid: '', csvUrl: '' },
    Review_Rewards: { sheet: 'Review_Rewards', gid: '', csvUrl: '' },
  },
};

const SAMPLE_BOOKS = [
  {
    id: 'sample-1',
    제목: '파도 사이의 편지',
    작가: '샘플 작가',
    출간년: '2021',
    장르구분: '장편',
    출판사: '종이와잉크',
    소개문: '제주 바다를 떠난 사람이 오래 묻어둔 가족의 기억을 따라 다시 섬으로 돌아오는 회복의 이야기.',
    확인메모: '도서관 문학자료실 A-01',
    이미지URL: '',
    태그1: '제주',
    태그2: '가족',
    태그3: '회복',
    태그4: '기억',
    태그5: '장편',
  },
  {
    id: 'sample-2',
    제목: '도시의 밤과 로봇',
    작가: '가상 소설가',
    출간년: '2024',
    장르구분: 'SF',
    출판사: '아카이브문학',
    소개문: '사라진 기억을 수집하는 로봇과 도시 변두리의 청소년들이 서로의 고독을 번역하는 근미래 소설.',
    확인메모: '도서관 신간 코너 B-14',
    이미지URL: '',
    태그1: 'SF',
    태그2: '로봇',
    태그3: '도시',
    태그4: '청소년',
    태그5: '고독',
  },
];

const SAMPLE_TAG_COLORS = {
  사랑: '#ef6f6c',
  성장: '#6abf69',
  가족: '#d99a4e',
  청소년: '#4aa3df',
  회복: '#74b49b',
  고독: '#565f89',
  미스터리: '#6d5dfc',
  SF: '#3aaed8',
  제주: '#3d9fbf',
  기억: '#c08497',
  로봇: '#7a8cff',
  도시: '#59656f',
  장편: '#b08968',
};

const DEFAULT_RARITIES = [
  { 등급: '마스터피스', 확률분모: '100', 표시명: '마스터피스', 설명: '가장 희귀한 문학적 섬광' },
  { 등급: '슈퍼레어', 확률분모: '50', 표시명: '슈퍼레어', 설명: '강한 수집감을 주는 특별 카드' },
  { 등급: '울트라레어', 확률분모: '30', 표시명: '울트라레어', 설명: '빛과 질감이 도드라지는 카드' },
  { 등급: '스페셜레어', 확률분모: '10', 표시명: '스페셜레어', 설명: '선명한 연출이 들어간 카드' },
  { 등급: '레어', 확률분모: '5', 표시명: '레어', 설명: '은은한 광택을 두른 카드' },
  { 등급: '스페셜', 확률분모: '3', 표시명: '스페셜', 설명: '기본보다 조금 더 특별한 카드' },
  { 등급: '노멀', 확률분모: '', 표시명: '노멀', 설명: '기본 카드' },
];

const EMOJI_RULES = [
  ['사랑', '❤️'], ['성장', '🌱'], ['가족', '🏠'], ['청소년', '🧃'], ['회복', '🌿'],
  ['고독', '🌙'], ['미스터리', '🕵️'], ['스릴러', '🔪'], ['공포', '👻'], ['SF', '🚀'],
  ['환상', '✨'], ['판타지', '🐉'], ['죽음', '🕯️'], ['애도', '🕯️'], ['역사', '🏛️'],
  ['제주', '🌊'], ['여성', '🪞'], ['노동', '🧰'], ['도시', '🌃'], ['예술', '🎨'],
  ['음악', '🎧'], ['우정', '🤝'], ['폭력', '⚡'], ['기억', '📼'], ['상처', '🩹'],
  ['기후', '🌿'], ['로봇', '🤖'], ['동물', '🐋'], ['노년', '🪑'], ['문학상', '🏆'],
  ['앤솔로지', '📚'], ['단편', '📖'], ['장편', '📕'],
];

const RARITY_ORDER = ['마스터피스', '슈퍼레어', '울트라레어', '스페셜레어', '레어', '스페셜'];
const STARTING_COINS = 500;
const STORAGE_VERSION = 'rarity-v2';
const RARITY_RANK = ['노멀', '스페셜', '레어', '스페셜레어', '울트라레어', '슈퍼레어', '마스터피스'];

function csvUrlFor(name) {
  const entry = SHEET_CONFIG.sheets[name];
  const cacheBust = `cb=${Date.now()}`;
  if (entry.csvUrl) return `${entry.csvUrl}${entry.csvUrl.includes('?') ? '&' : '?'}${cacheBust}`;
  if (entry.gid) {
    return `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${entry.gid}&${cacheBust}`;
  }
  return `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(entry.sheet)}&${cacheBust}`;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);

  const headers = rows.shift() || [];
  return rows.map((values) =>
    headers.reduce((item, header, index) => {
      item[header] = values[index] || '';
      return item;
    }, {})
  );
}

async function fetchSheet(name) {
  const response = await fetch(csvUrlFor(name), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${name} fetch failed`);
  return parseCSV(await response.text());
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function cleanBooks(rows) {
  return rows
    .filter((book) => book.제목)
    .map((book, index) => {
      const memo = book.확인메모 || book['확인 메모'] || book.도서위치 || book['도서 위치'] || book.위치 || '';
      const imageUrl =
        book['첨부 링크'] ||
        book.첨부링크 ||
        book['이미지 링크'] ||
        book.이미지링크 ||
        book.이미지URL ||
        book['이미지 URL'] ||
        book.이미지 ||
        book.책표지 ||
        book['책표지 링크'] ||
        book.책표지링크 ||
        book.책표지URL ||
        book['책표지 URL'] ||
        book.표지 ||
        book['표지 링크'] ||
        book.표지링크 ||
        book.표지이미지URL ||
        book['표지이미지 URL'] ||
        book.표지이미지URL_직접입력 ||
        book.source_url ||
        book.sourceUrl ||
        book.Source_URL ||
        '';
      return {
        id: book.id || `book-${index + 1}`,
        제목: book.제목 || '제목 미상',
        작가: book.작가 || '작가 미상',
        출간년: book.출간년 || '',
        장르구분: book.장르구분 || '',
        출판사: book.출판사 || '',
        소개문: book.소개문 || '소개문이 아직 등록되지 않았습니다.',
        확인메모: memo,
        이미지URL: normalizeImageUrl(imageUrl || book.id),
        태그1: book.태그1 || '',
        태그2: book.태그2 || '',
        태그3: book.태그3 || '',
        태그4: book.태그4 || '',
        태그5: book.태그5 || '',
      };
    });
}

function refreshCardBooks(cards, latestBooks) {
  const byId = new Map(latestBooks.map((book) => [String(book.id), book]));
  const byTitleAuthor = new Map(latestBooks.map((book) => [`${book.제목}::${book.작가}`, book]));

  return cards.filter((card) => !isSampleBook(card.book)).map((card) => {
    const latest =
      byId.get(String(card.book?.id)) ||
      byTitleAuthor.get(`${card.book?.제목}::${card.book?.작가}`);

    return latest ? { ...card, book: { ...card.book, ...latest } } : card;
  });
}

function isSampleBook(book) {
  return (
    String(book?.id || '').startsWith('sample-') ||
    book?.작가 === '샘플 작가' ||
    book?.작가 === '가상 소설가'
  );
}

function tagsOf(book) {
  return ['태그1', '태그2', '태그3', '태그4', '태그5'].map((key) => book[key]).filter(Boolean);
}

function normalizeImageUrl(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (/^https?:\/\//i.test(trimmed)) return '';
  if (trimmed.startsWith('/cover/')) return trimmed;
  const cleanName = trimmed.replace(/^\/+/, '').replace(/^cover\//, '');
  if (/^\d+$/.test(cleanName)) return `/cover/book_${cleanName.padStart(3, '0')}.jpg`;
  if (/^\d+\.(jpe?g|png|webp)$/i.test(cleanName)) {
    const [number, extension] = cleanName.split('.');
    return `/cover/book_${number.padStart(3, '0')}.${extension}`;
  }
  if (!/\.(jpe?g|png|webp)$/i.test(cleanName)) return `/cover/${cleanName}.jpg`;
  return `/cover/${cleanName}`;
}

// 이미지 링크가 비어 있을 때 태그, 장르, 제목 순서로 카드의 대체 이모지를 고른다.
function getBookEmoji(book) {
  const tagText = tagsOf(book).join(' ');
  const genreText = book.장르구분 || '';
  const titleText = book.제목 || '';
  const scopes = [tagText, genreText, titleText];

  for (const scope of scopes) {
    for (const [keyword, emoji] of EMOJI_RULES) {
      if (scope.toLowerCase().includes(keyword.toLowerCase())) return emoji;
    }
  }
  return '📚';
}

function tagEmoji(tag) {
  const match = EMOJI_RULES.find(([keyword]) => tag.toLowerCase().includes(keyword.toLowerCase()));
  return match?.[1] || '·';
}

function pickRarity(rarities) {
  for (const grade of RARITY_ORDER) {
    const config = rarities.find((rarity) => rarity.등급 === grade);
    const denominator = Number(config?.확률분모);
    if (denominator > 0 && Math.floor(Math.random() * denominator) === 0) {
      return config;
    }
  }
  return rarities.find((rarity) => rarity.등급 === '노멀') || DEFAULT_RARITIES.at(-1);
}

function readableColor(hex) {
  if (!hex || !hex.startsWith('#')) return '#1d1a16';
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? '#1d1a16' : '#fffaf0';
}

function makeCard(book, rarity) {
  return {
    instanceId: `${book.id}-${rarity.등급}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    acquiredAt: new Date().toISOString(),
    rarity: rarity.등급,
    rarityLabel: rarity.표시명 || rarity.등급,
    rarityDescription: rarity.설명 || '',
    book,
  };
}

function rarityConfigByGrade(grade) {
  return DEFAULT_RARITIES.find((rarity) => rarity.등급 === grade) || DEFAULT_RARITIES.at(-1);
}

function rarityRank(grade) {
  const index = RARITY_RANK.indexOf(grade);
  return index === -1 ? 0 : index;
}

function nextRarity(grade) {
  return RARITY_RANK[Math.min(rarityRank(grade) + 1, RARITY_RANK.length - 1)];
}

function randomRarityAbove(grade) {
  const start = Math.min(rarityRank(grade) + 2, RARITY_RANK.length - 1);
  const candidates = RARITY_RANK.slice(start);
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : nextRarity(grade);
}

function pickCombinationRarity(cards) {
  const ranks = cards.map((card) => rarityRank(card.rarity));
  const highestRank = Math.max(...ranks);
  const highest = RARITY_RANK[highestRank];
  const highestCount = ranks.filter((rank) => rank === highestRank).length;
  const normalCount = ranks.filter((rank) => rank === 0).length;
  const roll = Math.random() * 100;

  if (highest === '노멀') {
    if (roll < 1) return randomRarityAbove('스페셜');
    if (roll < 6) return '스페셜';
    return '노멀';
  }

  let downgradeChance = 0;
  if (highest === '스페셜') {
    if (normalCount === 2) downgradeChance = 5;
    else if (normalCount === 1) downgradeChance = 3;
  }

  if (roll < downgradeChance) return '노멀';
  if (roll < downgradeChance + 1) return randomRarityAbove(nextRarity(highest));
  if (roll < downgradeChance + 6) return nextRarity(highest);
  return highest;
}

function uniqueValues(items, selector) {
  return [...new Set(items.map(selector).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'ko'));
}

function localDateKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function backRarityLines(label) {
  if (label?.endsWith('레어') && label.length > 3) {
    return [label.slice(0, -2), '레어'];
  }
  return [label];
}

function BookCard({ card, tagColors, compact = false }) {
  const [flipped, setFlipped] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageFitClass, setImageFitClass] = useState('');
  const book = card.book;
  const tags = tagsOf(book);
  const mainColor = tagColors[tags[0]] || '#c7a76c';
  const subColor = tagColors[tags[1]] || '#8fa6a3';
  const pattern = tags.slice(0, 5).map(tagEmoji);
  const titleLength = [...(book.제목 || '')].length;
  const titleSizeClass = titleLength > 15 ? 'title-xs' : titleLength > 10 ? 'title-sm' : 'title-md';

  return (
    <button
      type="button"
      aria-label={`${book.제목} 카드 뒤집기`}
      className={`card-shell ${compact ? 'scale-card-sm' : ''}`}
      onClick={() => setFlipped((value) => !value)}
    >
      <div className={`flip-card ${flipped ? 'is-flipped' : ''}`}>
        <div
          className={`card-face card-front rarity-${card.rarity}`}
          style={{
            '--tag-main': mainColor,
            '--tag-sub': subColor,
          }}
        >
          <div className="pattern-emojis" aria-hidden="true">
            {pattern.map((emoji, index) => (
              <span key={`${emoji}-${index}`} className={`pattern-e pattern-${index}`}>{emoji}</span>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className={`rarity-badge badge-${card.rarity}`}>{card.rarityLabel}</span>
            <span className="card-brand">K-Novel</span>
          </div>
          <div className="card-visual">
            {book.이미지URL && !imageFailed ? (
              <img
                className={imageFitClass}
                src={book.이미지URL}
                alt={`${book.제목} 이미지`}
                loading="lazy"
                onLoad={(event) => {
                  const image = event.currentTarget;
                  const imageRatio = image.naturalWidth / image.naturalHeight;
                  if (imageRatio < 0.62) {
                    setImageFitClass('cover-narrow');
                  } else if (imageRatio > 0.86) {
                    setImageFitClass('cover-wide');
                  } else {
                    setImageFitClass('');
                  }
                }}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span>{getBookEmoji(book)}</span>
            )}
          </div>
          <div className="front-book-meta">
            <p className={`front-title ${titleSizeClass}`}>{book.제목}</p>
            <p className="front-meta-line">{[book.작가, book.출간년, book.출판사].filter(Boolean).join(' · ')}</p>
          </div>
        </div>

        <div className="card-face card-back">
          <div className="flex items-start justify-between gap-3 border-b border-dashed border-stone-400 pb-3 text-left">
            <div>
              <p className="text-sm font-black text-stone-900">{book.제목}</p>
              <p className="mt-0.5 text-xs font-bold text-stone-600">{book.작가}</p>
            </div>
            <span className="back-rarity-badge">
              {backRarityLines(card.rarityLabel).map((line) => (
                <span key={line}>{line}</span>
              ))}
            </span>
          </div>
          <div className="back-tag-row">
            {tags.map((tag) => {
              const color = tagColors[tag] || '#e6d7b7';
              return (
                <span
                  key={tag}
                  className="tag-chip"
                  style={{ backgroundColor: color, color: readableColor(color) }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
          <div className="archive-lines">
            <p className="archive-copy">{book.소개문}</p>
          </div>
          <div className="location-note">
            <span>도서관 책 위치</span>
            <strong>{book.확인메모 || '위치 메모 준비 중'}</strong>
          </div>
        </div>
      </div>
    </button>
  );
}

function CapsuleMachine({ active, onDraw }) {
  return (
    <div className={`machine ${active ? 'machine-active' : ''}`}>
      <div className="machine-emoji">
        <div className="emoji-top">K-NOVEL CAPSULE</div>
        <div className="emoji-window">
          <span className="machine-poster poster-a" />
          <span className="machine-poster poster-b" />
          <span className="emoji-capsule cap-a" />
          <span className="emoji-capsule cap-b" />
          <span className="emoji-capsule cap-c" />
        </div>
        <div className="emoji-body">
          <span className="emoji-coin">1COIN</span>
          <span className="emoji-handle" />
          <button type="button" className="emoji-tray" onClick={onDraw}>
            <span>캡슐</span>
            <span>뽑기</span>
          </button>
          <span className="capsule-drop" />
        </div>
      </div>
    </div>
  );
}

function ReadingRecordSection({ setCoins }) {
  const [readingRecords, setReadingRecords] = useLocalStorage('knovel-reading-records', []);
  const [form, setForm] = useState({ title: '', author: '', reason: '' });
  const [message, setMessage] = useState('');
  const [editingRecordId, setEditingRecordId] = useState(null);

  function submitReadingRecord(event) {
    event.preventDefault();
    const reasonLength = form.reason.replace(/\s/g, '').length;

    if (!form.title.trim() || !form.author.trim() || !form.reason.trim() || reasonLength < 20) {
      setMessage('독서 기록은 20자 이상 작성해 주세요.');
      return;
    }

    if (editingRecordId) {
      setReadingRecords((current) =>
        current.map((record) =>
          record.id === editingRecordId
            ? {
                ...record,
                title: form.title.trim(),
                author: form.author.trim(),
                reason: form.reason.trim(),
                updatedAt: new Date().toISOString(),
              }
            : record,
        ),
      );
      setMessage('독서 기록이 수정되었습니다.');
      setEditingRecordId(null);
      setForm({ title: '', author: '', reason: '' });
      return;
    }

    const reward = 3;
    setReadingRecords((current) => [
      {
        id: Date.now(),
        title: form.title.trim(),
        author: form.author.trim(),
        reason: form.reason.trim(),
        reward,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setCoins((current) => current + reward);
    setMessage('독서 기록이 저장되었습니다. 토큰 3개를 받았습니다.');
    setForm({ title: '', author: '', reason: '' });
  }

  function startEditingRecord(record) {
    setEditingRecordId(record.id);
    setForm({
      title: record.title || '',
      author: record.author || '',
      reason: record.reason || record.text || '',
    });
    setMessage('수정할 내용을 고친 뒤 저장해 주세요.');
  }

  function cancelEditingRecord() {
    setEditingRecordId(null);
    setForm({ title: '', author: '', reason: '' });
    setMessage('');
  }

  function deleteReadingRecord(recordId) {
    setReadingRecords((current) => current.filter((record) => record.id !== recordId));
    if (editingRecordId === recordId) {
      setEditingRecordId(null);
      setForm({ title: '', author: '', reason: '' });
    }
    setMessage('독서 기록이 삭제되었습니다.');
  }

  return (
    <section className="section-band" id="reading-records">
      <div className="section-head">
        <div>
          <p className="eyebrow">Reader Notes</p>
          <h2 className="section-title">나만의 한국 소설 독서기록장</h2>
        </div>
        <div className="reward-note">독서 기록을 남기면 토큰 3개를 드립니다.</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <form onSubmit={submitReadingRecord} className="review-form">
          <p className="empty-copy">* 이 기록은 다른 사람에게 공개되지 않습니다.</p>
          <input
            className="field"
            placeholder="책 제목"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <input
            className="field"
            placeholder="작가명"
            value={form.author}
            onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))}
          />
          <textarea
            className="field min-h-36 resize-y"
            placeholder="감상"
            value={form.reason}
            onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
          />
          <div className="form-actions">
            <button type="submit" className="primary-button">
              {editingRecordId ? '독서 기록 수정하기' : '독서 기록 저장하고 토큰 받기'}
            </button>
            {editingRecordId && (
              <button type="button" className="secondary-button" onClick={cancelEditingRecord}>
                수정 취소
              </button>
            )}
          </div>
          {message && <p className="text-sm font-bold text-emerald-800">{message}</p>}
        </form>

        <div className="review-list">
          <h3 className="text-lg font-black text-stone-900">내 독서 기록</h3>
          {readingRecords.length === 0 ? (
            <p className="empty-copy">아직 저장한 독서 기록이 없습니다. 감상을 20자 이상 남기면 토큰 3개를 받습니다.</p>
          ) : (
            readingRecords.slice(0, 6).map((record) => (
              <article key={record.id} className="review-item">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-stone-900">{record.title}</h3>
                  <span className="text-xs font-black text-stone-500">{record.author || '작가 미상'}</span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-700">{record.reason || record.text}</p>
                <div className="review-actions">
                  <button type="button" className="small-action-button" onClick={() => startEditingRecord(record)}>
                    수정
                  </button>
                  <button type="button" className="small-action-button danger-button" onClick={() => deleteReadingRecord(record.id)}>
                    삭제
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function App() {
  const [books, setBooks] = useState([]);
  const [tagColors, setTagColors] = useState(SAMPLE_TAG_COLORS);
  const [rarities, setRarities] = useState(DEFAULT_RARITIES);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('Google Sheets에서 목록을 불러오는 중입니다.');
  const [coins, setCoins] = useLocalStorage('knovel-coins-test-500', STARTING_COINS);
  const [collection, setCollection] = useLocalStorage('knovel-collection', []);
  const [recent, setRecent] = useLocalStorage('knovel-recent', []);
  const [result, setResult] = useState(null);
  const [machineActive, setMachineActive] = useState(false);
  const [gachaMessage, setGachaMessage] = useState('');
  const [activeView, setActiveView] = useState('draw');
  const [filterType, setFilterType] = useState('전체');
  const [filterValue, setFilterValue] = useState('전체');
  const [sortMode, setSortMode] = useState('draw-new');
  const [selectedCombineIds, setSelectedCombineIds] = useState([]);
  const [combineResult, setCombineResult] = useState(null);
  const [pendingCombination, setPendingCombination] = useState(null);
  const [combineAnimating, setCombineAnimating] = useState(false);
  const [dailyRewardMessage, setDailyRewardMessage] = useState('');

  useEffect(() => {
    if (localStorage.getItem('knovel-storage-version') === STORAGE_VERSION) return;
    [
      'knovel-collection',
      'knovel-recent',
      'knovel-coins-v2',
      'knovel-coins',
    ].forEach((key) => localStorage.removeItem(key));
    localStorage.setItem('knovel-storage-version', STORAGE_VERSION);
    window.location.reload();
  }, []);

  useEffect(() => {
    const today = localDateKey();
    if (localStorage.getItem('knovel-daily-reward-date') === today) return;
    localStorage.setItem('knovel-daily-reward-date', today);
    setCoins((current) => current + 3);
    setDailyRewardMessage('오늘의 접속 보상으로 토큰 3개를 받았습니다.');
  }, [setCoins]);

  useEffect(() => {
    async function loadData() {
      try {
        const [bookRows, colorRows, rarityRows, rewardRows] = await Promise.all([
          fetchSheet('Book_List'),
          fetchSheet('Tag_Color_Map'),
          fetchSheet('Rarity_Config'),
          fetchSheet('Review_Rewards'),
        ]);

        const nextBooks = cleanBooks(bookRows);
        const usableBooks = nextBooks;
        setBooks(usableBooks);
        setCollection((current) => refreshCardBooks(current, usableBooks));
        setRecent((current) => refreshCardBooks(current, usableBooks));
        setResult((current) => (current ? refreshCardBooks([current], usableBooks)[0] : current));
        setTagColors({
          ...SAMPLE_TAG_COLORS,
          ...Object.fromEntries(colorRows.filter((row) => row.태그).map((row) => [row.태그, row.HEX || '#e6d7b7'])),
        });
        setRarities(DEFAULT_RARITIES);
        setRewards(rewardRows);
        setLoadMessage(nextBooks.length ? 'Google Sheets 동기화 완료' : '시트가 비어 있습니다.');
      } catch {
        setBooks([]);
        setCollection((current) => refreshCardBooks(current, []));
        setRecent((current) => refreshCardBooks(current, []));
        setResult((current) => (current && !isSampleBook(current.book) ? current : null));
        setTagColors(SAMPLE_TAG_COLORS);
        setRarities(DEFAULT_RARITIES);
        setRewards([]);
        setLoadMessage('Google Sheets 로딩 실패');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const uniqueCollected = useMemo(() => new Set(collection.map((card) => String(card.book.id))), [collection]);
  const totalPossible = Math.max(books.length, 1);
  const collectionRate = Math.round((uniqueCollected.size / totalPossible) * 100);

  const collectionFilterOptions = useMemo(() => {
    if (filterType === '작가별') return uniqueValues(collection, (card) => card.book.작가);
    if (filterType === '태그별') return uniqueValues(collection.flatMap((card) => tagsOf(card.book)), (tag) => tag);
    if (filterType === '분류별') return uniqueValues(collection, (card) => card.book.장르구분);
    if (filterType === '출판사별') return uniqueValues(collection, (card) => card.book.출판사);
    if (filterType === '등급별') return RARITY_RANK.filter((rarity) => collection.some((card) => card.rarity === rarity));
    return [];
  }, [collection, filterType]);

  const visibleCollection = useMemo(() => {
    const filtered = collection.filter((card) => {
      if (filterType === '전체' || filterValue === '전체') return true;
      if (filterType === '작가별') return card.book.작가 === filterValue;
      if (filterType === '태그별') return tagsOf(card.book).includes(filterValue);
      if (filterType === '분류별') return card.book.장르구분 === filterValue;
      if (filterType === '출판사별') return card.book.출판사 === filterValue;
      if (filterType === '등급별') return card.rarity === filterValue;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const yearA = Number(a.book.출간년) || 0;
      const yearB = Number(b.book.출간년) || 0;
      const dateA = new Date(a.acquiredAt || 0).getTime();
      const dateB = new Date(b.acquiredAt || 0).getTime();
      const rankA = RARITY_RANK.indexOf(a.rarity);
      const rankB = RARITY_RANK.indexOf(b.rarity);
      const safeRankA = rankA === -1 ? 0 : rankA;
      const safeRankB = rankB === -1 ? 0 : rankB;

      if (sortMode === 'year-desc') return yearB - yearA || dateB - dateA;
      if (sortMode === 'year-asc') return yearA - yearB || dateB - dateA;
      if (sortMode === 'draw-old') return dateA - dateB;
      if (sortMode === 'rarity-desc') return safeRankB - safeRankA || dateB - dateA;
      if (sortMode === 'rarity-asc') return safeRankA - safeRankB || dateB - dateA;
      if (sortMode === 'title-asc') return a.book.제목.localeCompare(b.book.제목, 'ko');
      if (sortMode === 'author-asc') return a.book.작가.localeCompare(b.book.작가, 'ko') || a.book.제목.localeCompare(b.book.제목, 'ko');
      return dateB - dateA;
    });
  }, [collection, filterType, filterValue, sortMode]);

  const combineCandidates = useMemo(() => {
    const bestRankByBook = new Map();
    collection.forEach((card) => {
      const bookId = card.book?.id;
      if (!bookId) return;
      bestRankByBook.set(bookId, Math.max(bestRankByBook.get(bookId) ?? 0, rarityRank(card.rarity)));
    });

    return collection
      .filter((card) => rarityRank(card.rarity) < (bestRankByBook.get(card.book?.id) ?? 0))
      .sort((a, b) => rarityRank(a.rarity) - rarityRank(b.rarity) || new Date(a.acquiredAt || 0) - new Date(b.acquiredAt || 0));
  }, [collection]);
  const selectedCombineCards = selectedCombineIds
    .map((id) => collection.find((card) => card.instanceId === id))
    .filter(Boolean);

  function drawGacha() {
    setDailyRewardMessage('');
    if (coins <= 0) {
      setGachaMessage('토큰이 없습니다. 독서 기록을 쓰면 다시 뽑을 수 있어요.');
      return;
    }
    if (!books.length) {
      setGachaMessage('불러온 책 데이터가 없습니다.');
      return;
    }

    setCoins((current) => current - 1);
    setMachineActive(true);
    setGachaMessage('캡슐이 굴러오는 중...');
    const pickedBook = books[Math.floor(Math.random() * books.length)];
    const pickedRarity = pickRarity(rarities);
    const nextCard = makeCard(pickedBook, pickedRarity);

    window.setTimeout(() => {
      setResult(nextCard);
      setCollection((current) => [nextCard, ...current]);
      setRecent((current) => [nextCard, ...current].slice(0, 3));
      setMachineActive(false);
      setGachaMessage(`${pickedRarity.표시명 || pickedRarity.등급} 《${pickedBook.제목}》획득`);
    }, 760);
  }

  function changeFilterType(value) {
    setFilterType(value);
    setFilterValue('전체');
  }

  function toggleCombineCard(card) {
    if (combineAnimating || pendingCombination) return;
    setCombineResult(null);
    setSelectedCombineIds((current) => {
      if (current.includes(card.instanceId)) return current.filter((id) => id !== card.instanceId);
      if (current.length >= 3) return current;
      return [...current, card.instanceId];
    });
  }

  function combineCards() {
    if (selectedCombineCards.length !== 3 || combineAnimating || pendingCombination) return;
    const ingredients = selectedCombineCards;
    const resultGrade = pickCombinationRarity(ingredients);
    const resultBook = books[Math.floor(Math.random() * books.length)] || ingredients[Math.floor(Math.random() * ingredients.length)].book;
    const nextCard = makeCard(resultBook, rarityConfigByGrade(resultGrade));

    setCombineAnimating(true);
    setCombineResult(null);
    window.setTimeout(() => {
      setCombineResult(nextCard);
      setPendingCombination({ result: nextCard, consumedIds: ingredients.map((card) => card.instanceId) });
      setCombineAnimating(false);
    }, 980);
  }

  function acceptCombination() {
    if (!pendingCombination) return;
    const consumed = new Set(pendingCombination.consumedIds);
    const nextCard = pendingCombination.result;
    setCollection((current) => [nextCard, ...current.filter((card) => !consumed.has(card.instanceId))]);
    setRecent((current) => [nextCard, ...current].slice(0, 3));
    setCombineResult(null);
    setPendingCombination(null);
    setSelectedCombineIds([]);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4eddc] text-stone-950">
      <div className="paper-grain" />
      <header className="sticky top-0 z-30 border-b border-stone-900/10 bg-[#f4eddc]/88 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="eyebrow">Capsule Literature Archive</p>
            <h1 className="site-title">
              한국 소설 뽑기
              <span>in 남산도서관</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-right">
            <div className="status-pill">토큰 {coins}</div>
            <div className="status-pill">수집률 {collectionRate}%</div>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 px-4 pb-4 sm:px-6" aria-label="페이지 탭">
          <button type="button" className={`tab-button ${activeView === 'draw' ? 'tab-button-active' : ''}`} onClick={() => setActiveView('draw')}>
            소설뽑기
          </button>
          <button type="button" className={`tab-button ${activeView === 'collection' ? 'tab-button-active' : ''}`} onClick={() => setActiveView('collection')}>
            컬렉션 보기
          </button>
          <button type="button" className={`tab-button ${activeView === 'combine' ? 'tab-button-active' : ''}`} onClick={() => setActiveView('combine')}>
            조합하기
          </button>
        </nav>
      </header>

      {activeView === 'draw' ? (
        <>
      <section className="hero-section mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:py-12">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">{loading ? 'Loading' : loadMessage}</p>
          <h2 className="mt-3 font-black leading-tight">
            <span>한국 소설 카드를</span>
            <span>모아보세요.</span>
          </h2>
          {dailyRewardMessage && (
            <p className="daily-reward-message">{dailyRewardMessage}</p>
          )}
        </div>

        <div className="gacha-column">
          <p className="image-credit">이미지 출처: 알라딘</p>
          <div className="gacha-stage">
            <CapsuleMachine active={machineActive} onDraw={drawGacha} />
            <div className="machine-actions">
              <p>{gachaMessage || '뽑기에는 토큰 1개가 필요합니다.'}</p>
              <button type="button" className="primary-button action-draw-button" onClick={drawGacha}>
                캡슐 뽑기
              </button>
            </div>
            <div className="result-slot">
              {result ? (
                <div key={result.instanceId} className="card-enter">
                  <BookCard card={result} tagColors={tagColors} />
                </div>
              ) : (
                <div className="empty-card">
                  <span className="text-6xl">📚</span>
                  <p>캡슐 안의 소설을 기다리는 중</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="section-head">
          <div>
            <p className="eyebrow">Recent Pulls</p>
            <h2 className="section-title">최근 뽑은 카드 3장</h2>
          </div>
        </div>
        <div className="recent-row">
          {recent.length === 0 ? (
            <p className="empty-copy">아직 최근 카드가 없습니다.</p>
          ) : recent.map((card) => (
            <BookCard key={card.instanceId} card={card} tagColors={tagColors} compact />
          ))}
        </div>
      </section>
      <ReadingRecordSection setCoins={setCoins} />
        </>
      ) : activeView === 'collection' ? (

      <section className="section-band collection-view" id="collection">
        <div className="section-head">
          <div>
            <p className="eyebrow">Collection</p>
            <h2 className="section-title">카드 컬렉션</h2>
          </div>
          <div className="status-pill">{uniqueCollected.size} / {totalPossible} 조합</div>
        </div>

        <div className="rarity-ladder" aria-label="카드 등급">
          {RARITY_RANK.map((rarity) => (
            <button
              type="button"
              key={rarity}
              className={`rarity-tier rarity-${rarity} ${filterType === '등급별' && filterValue === rarity ? 'rarity-tier-active' : ''}`}
              onClick={() => {
                setFilterType('등급별');
                setFilterValue(rarity);
              }}
            >
              <span className="rarity-tier-mark" />
              {rarity}
            </button>
          ))}
          <button
            type="button"
            className={`rarity-tier rarity-tier-all ${filterType === '전체' ? 'rarity-tier-active' : ''}`}
            onClick={() => {
              setFilterType('전체');
              setFilterValue('전체');
            }}
          >
            전체보기
          </button>
        </div>

        <div className="filter-bar">
          <select className="field" value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            <option value="draw-new">최신순</option>
            <option value="draw-old">오래된순</option>
            <option value="year-desc">출간년 내림차순</option>
            <option value="year-asc">출간년 오름차순</option>
            <option value="rarity-desc">등급순 내림차순</option>
            <option value="rarity-asc">등급순 오름차순</option>
            <option value="title-asc">도서명 가나다순</option>
            <option value="author-asc">작가명 가나다순</option>
          </select>
          <select className="field" value={filterType} onChange={(event) => changeFilterType(event.target.value)}>
            {['전체', '작가별', '태그별', '등급별', '분류별', '출판사별'].map((type) => <option key={type}>{type}</option>)}
          </select>
          {filterType !== '전체' && (
            <select className="field" value={filterValue} onChange={(event) => setFilterValue(event.target.value)}>
              <option>전체</option>
              {collectionFilterOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          )}
        </div>

        {visibleCollection.length === 0 ? (
          <div className="collection-empty">
            <span>📖</span>
            <p>아직 조건에 맞는 카드가 없습니다. 캡슐을 돌려 첫 장을 채워보세요.</p>
          </div>
        ) : (
          <div className="collection-grid">
            {visibleCollection.map((card) => (
              <BookCard key={card.instanceId} card={card} tagColors={tagColors} compact />
            ))}
          </div>
        )}
        <section className="selection-criteria">
          <h3>도서 선정 기준</h3>
          <ol>
            <li>주로 2010~2020년대에 출간된 한국 소설을 선정했고, 최근 3년간 출간된 도서를 높은 비중으로 리스트에 포함했다. 또한 이전 출간작 중 여전히 사랑을 받는 작품들은 포함시켰다.</li>
            <li>출판년과 출판사는 초판을 기준으로 작성하였다. 현재는 표지나 출판사가 다를 수 있다.</li>
            <li>도서 카드는 추후 업데이트 될 수 있다.</li>
            <li>수집률은 등급과 무관하게 같은 도서를 한 번 이상 획득했을 때 수집한 것으로 계산한다.</li>
          </ol>
        </section>
      </section>
      ) : (
      <section className="section-band collection-view">
        <div className="section-head">
          <div>
            <p className="eyebrow">Fusion Desk</p>
            <h2 className="section-title">카드 조합하기</h2>
          </div>
          <div className="status-pill">중복 3장 → 1장</div>
        </div>

        <div className="combine-layout">
          <div className="combine-panel">
            <p className="reward-note">
              남는 카드 3장을 골라 조합합니다. 같은 책에서 보유한 최고 등급 카드는 보호하고, 낮은 등급 카드만 정리 대상으로 보여줍니다.
            </p>
            <div className="status-pill combine-count">{selectedCombineCards.length} / 3장 선택</div>
            <div className="combine-picker">
              {combineCandidates.length === 0 ? (
                <p className="empty-copy">정리할 남는 카드가 아직 없습니다. 같은 책의 더 높은 등급을 보유하면 낮은 등급 카드가 여기에 표시됩니다.</p>
              ) : combineCandidates.map((card) => (
                <button
                  type="button"
                  key={card.instanceId}
                  className={`combine-pick ${selectedCombineIds.includes(card.instanceId) ? 'combine-pick-on' : ''}`}
                  onClick={() => toggleCombineCard(card)}
                >
                  <span>{card.book.제목}</span>
                  <strong>{card.rarity}</strong>
                </button>
              ))}
            </div>
            <button type="button" className="primary-button" onClick={combineCards} disabled={selectedCombineCards.length !== 3 || combineAnimating}>
              {combineAnimating ? '조합 중...' : '선택한 3장 조합하기'}
            </button>
          </div>

          <div className={`combine-stage ${combineAnimating ? 'is-combining' : ''}`}>
            {selectedCombineCards.length > 0 ? (
              <>
                <div className="combine-stack">
                  {selectedCombineCards.map((card, index) => (
                    <div className={`combine-mini combine-mini-${index}`} key={card.instanceId}>
                      <BookCard card={card} tagColors={tagColors} compact />
                    </div>
                  ))}
                </div>
                <div className="combine-arrow">→</div>
                <div className="combine-output">
                  {combineResult ? (
                    <div className="combine-result-box">
                      <BookCard card={combineResult} tagColors={tagColors} compact />
                      <div className="combine-result-meta">
                        <strong>{combineResult.rarityLabel} 획득</strong>
                        <span>{combineResult.book.제목}</span>
                        {pendingCombination && (
                          <button type="button" className="primary-button accept-button" onClick={acceptCombination}>받기</button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-card combine-placeholder">
                      <span className="text-5xl">✨</span>
                      <p>조합 결과 대기 중</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="collection-empty">
                <span>🃏</span>
                <p>왼쪽 목록에서 남는 카드 3장을 골라주세요.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      )}
      {activeView === 'draw' && (
        <footer className="site-disclaimer">
          이 페이지는 도서관 교육 프로그램 및 독서 활동 안내를 위한 비상업적 서비스입니다. 도서 표지 이미지는 도서 소개를 위한 참고 자료로 사용되며, 저작권은 각 출판사 및 권리자에게 있습니다. 도서 정보 일부는 알라딘을 참고했으며, 각 도서의 상세 정보는 연결된 도서 페이지에서 확인할 수 있습니다. 본 페이지의 이미지 및 자료는 무단 복제·배포·상업적 이용을 금합니다.
        </footer>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
