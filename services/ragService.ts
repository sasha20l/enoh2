import { BibleVerse, BibleCommentary } from "../types";

// MOCK DATASET (Simulating PostgreSQL content)
const MOCK_VERSES: BibleVerse[] = [
  {
    id: 1,
    translation: 'RST',
    book_id: 40,
    book_name: 'Мф.',
    chapter: 5,
    verse: 3,
    text: 'Блаженны нищие духом, ибо их есть Царство Небесное.',
    azbyka_url: 'https://azbyka.ru/biblia/?Mt.5:3',
    azbyka_url2: 'https://azbyka.ru/biblia/?Mt.5:3&utfcs'
  },
  {
    id: 2,
    translation: 'RST',
    book_id: 43,
    book_name: 'Ин.',
    chapter: 1,
    verse: 1,
    text: 'В начале было Слово, и Слово было у Бога, и Слово было Бог.',
    azbyka_url: 'https://azbyka.ru/biblia/?Jn.1:1',
  },
  {
    id: 3,
    translation: 'RST',
    book_id: 40,
    book_name: 'Мф.',
    chapter: 6,
    verse: 6,
    text: 'Ты же, когда молишься, войди в комнату твою и, затворив дверь твою, помолись Отцу твоему, Который втайне; и Отец твой, видящий тайное, воздаст тебе явно.',
    azbyka_url: 'https://azbyka.ru/biblia/?Mt.6:6',
  }
];

const MOCK_COMMENTARIES: BibleCommentary[] = [
  {
    id: 101,
    verse_id: 1,
    book_id: 40,
    book_name: 'Мф.',
    chapter: 5,
    verse: 3,
    author: 'Иоанн Златоуст',
    label: 'Беседы на Евангелие от Матфея',
    text_plain: 'Что значит: нищие духом? Смиренные и сокрушенные сердцем. Духом Он назвал душу и расположение человека... Почему же не сказал Он: смиренные, а сказал: нищие? Потому что последнее выразительнее первого; нищими Он называет здесь тех, которые боятся и трепещут заповедей Божиих.',
    html: '<p>Что значит: нищие духом? Смиренные и сокрушенные сердцем...</p>',
    source_title: 'Беседы на Евангелие от Матфея',
    azbyka_url: 'https://azbyka.ru/biblia/?Mt.5:3&c',
    created_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 102,
    verse_id: 1,
    book_id: 40,
    book_name: 'Мф.',
    chapter: 5,
    verse: 3,
    author: 'Феофилакт Болгарский',
    label: 'Толкование',
    text_plain: 'Нищие духом суть те, которые смирились душой своей, ибо духом называет здесь душу. Или же нищие духом — это те, которые по своей воле, ради Бога, обнищали в мирских благах.',
    html: '<p>Нищие духом суть те...</p>',
    source_title: 'Толкование на Евангелие от Матфея',
    azbyka_url: 'https://azbyka.ru/biblia/?Mt.5:3&c',
    created_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 103,
    verse_id: 3,
    book_id: 40,
    book_name: 'Мф.',
    chapter: 6,
    verse: 6,
    author: 'Иоанн Кронштадтский',
    label: 'Дневник',
    text_plain: 'Господь хочет, чтобы молитва наша была искренняя, сердечная, глубоко сосредоточенная, чуждая всякого лицемерия и тщеславия. "Клеть" — это сердце твое.',
    html: '<p>Господь хочет...</p>',
    azbyka_url: 'https://azbyka.ru/biblia/?Mt.6:6&c',
    created_at: '2023-01-01T00:00:00Z'
  }
];

export const RagService = {
  // Step A: Normalization
  normalizeQuery: (query: string): string => {
      // Basic normalization: lowercase, remove punctuation
      return query.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
  },

  // Step B: Search Verses (Simulates FTS/Semantic Search)
  searchVerses: async (query: string): Promise<BibleVerse[]> => {
    const normalized = RagService.normalizeQuery(query);
    
    // In a real DB, this would be a SQL query with FTS or Vector Cosine Similarity
    const results = MOCK_VERSES.filter(v => 
      v.text.toLowerCase().includes(normalized) || 
      (normalized.includes('блажен') && v.text.toLowerCase().includes('блажен')) ||
      (normalized.includes('молит') && v.text.toLowerCase().includes('молиш')) ||
      (normalized.includes('начал') && v.text.toLowerCase().includes('начале'))
    );
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600)); 
    return results;
  },

  // Step C: Get Commentaries for Verses
  getCommentariesForVerses: async (verseIds: number[]): Promise<BibleCommentary[]> => {
    // In real DB: SELECT * FROM bible_commentaries WHERE verse_id IN (...)
    const results = MOCK_COMMENTARIES.filter(c => verseIds.includes(c.verse_id));
    return results;
  }
};