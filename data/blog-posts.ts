export interface BlogAuthor {
  name: string;
  avatar?: string;
}

export type BlogSection =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; level?: 2 | 3 }
  | { type: 'table'; rows: string[][] }
  | { type: 'image'; url: string; alt: string; caption?: string }
  | { type: 'list'; items: string[]; ordered?: boolean };

export interface BlogPost {
  slug: string;
  title: string;
  metaDescription: string;
  summary: string;
  date: string;
  updatedDate?: string;
  author: BlogAuthor;
  featuredImage?: string;
  featuredImageAlt?: string;
  sections: BlogSection[];
  published: boolean;
}

const DEFAULT_AUTHOR: BlogAuthor = { name: 'Hal\u0131 Dene Ekibi' };

export const staticBlogPosts: BlogPost[] = [
  {
    slug: '6-metrekare-hali',
    title: '6 m\u00B2 Hal\u0131n\u0131n \u00D6l\u00E7\u00FCs\u00FC Nedir? | Boyutlar ve Se\u00E7im Rehberi',
    metaDescription: '6 metrekare hal\u0131 \u00F6l\u00E7\u00FCleri, boyutlar\u0131 ve se\u00E7im rehberi. 2x3, 1.5x4 gibi farkl\u0131 \u00F6l\u00E7\u00FC kombinasyonlar\u0131n\u0131 ve odan\u0131za en uygun hal\u0131y\u0131 nas\u0131l se\u00E7ece\u011Finizi \u00F6\u011Frenin.',
    summary: '6 metrekare hal\u0131 \u00F6l\u00E7\u00FCleri, boyutlar\u0131 ve odan\u0131za en uygun hal\u0131y\u0131 nas\u0131l se\u00E7ece\u011Finizi \u00F6\u011Frenin.',
    date: '2026-03-10',
    author: DEFAULT_AUTHOR,
    published: true,
    sections: [
      { type: 'paragraph', text: 'Hal\u0131 al\u0131rken en s\u0131k kar\u015F\u0131la\u015F\u0131lan sorulardan biri "6 metrekare hal\u0131n\u0131n \u00F6l\u00E7\u00FCs\u00FC nedir?" sorusudur. Asl\u0131nda 6 m\u00B2 bir alan \u00F6l\u00E7\u00FCs\u00FCD\u00FCr ve farkl\u0131 en-boy kombinasyonlar\u0131yla elde edilebilir. Do\u011Fru hal\u0131y\u0131 se\u00E7mek i\u00E7in odan\u0131z\u0131n \u015Feklini ve mobilya yerle\u015Fimini g\u00F6z \u00F6n\u00FCnde bulundurman\u0131z gerekir.' },
      { type: 'heading', text: '6 m\u00B2 Hal\u0131 \u00D6l\u00E7\u00FC Tablosu', level: 2 },
      { type: 'paragraph', text: 'A\u015Fa\u011F\u0131daki tabloda 6 metrekarelik hal\u0131lar\u0131n en yayg\u0131n \u00F6l\u00E7\u00FC kombinasyonlar\u0131n\u0131 ve hangi oda tiplerine uygun olduklar\u0131n\u0131 bulabilirsiniz:' },
      { type: 'table', rows: [['En x Boy', 'Boyutlar', 'Uygun Oda Tipi'], ['2 m x 3 m', '200 x 300 cm', 'Salon, oturma odas\u0131'], ['1.5 m x 4 m', '150 x 400 cm', 'Uzun koridor, giri\u015F hol\u00FC'], ['2.4 m x 2.5 m', '240 x 250 cm', 'Kare oturma alan\u0131'], ['1.7 m x 3.5 m', '170 x 350 cm', 'Yemek odas\u0131']] },
      { type: 'heading', text: 'En Yayg\u0131n \u00D6l\u00E7\u00FC: 200 x 300 cm', level: 2 },
      { type: 'paragraph', text: '6 metrekarelik hal\u0131larda en \u00E7ok tercih edilen \u00F6l\u00E7\u00FC 200 x 300 cm\'dir. Bu \u00F6l\u00E7\u00FC, standart bir oturma odas\u0131nda koltuk grubunun \u00F6n\u00FCne veya yemek masas\u0131n\u0131n alt\u0131na ideal olarak yerle\u015Fir. \u00C7o\u011Fu hal\u0131 \u00FCreticisi bu \u00F6l\u00E7\u00FCy\u00FC standart olarak \u00FCretmektedir.' },
      { type: 'heading', text: 'Odan\u0131za Uygun \u00D6l\u00E7\u00FCy\u00FC Nas\u0131l Se\u00E7ersiniz?', level: 2 },
      { type: 'list', items: ['Odan\u0131z\u0131n eni ve boyunu \u00F6l\u00E7\u00FCn', 'Mobilyalar\u0131n yerle\u015Fimini belirleyin', 'Hal\u0131n\u0131n kenarlar\u0131ndan duvara en az 30-40 cm bo\u015Fluk b\u0131rak\u0131n', 'Koltuk gruplar\u0131n\u0131n \u00F6n ayaklar\u0131 hal\u0131n\u0131n \u00FCzerinde olmal\u0131d\u0131r'], ordered: true },
      { type: 'heading', text: 'Hal\u0131y\u0131 Almadan \u00D6nce Deneyin', level: 2 },
      { type: 'paragraph', text: 'Hal\u0131n\u0131n odan\u0131zda nas\u0131l duraca\u011F\u0131n\u0131 merak ediyorsan\u0131z, Hal\u0131 Dene uygulamas\u0131yla yapay zeka destekli deneme yapabilirsiniz. Odan\u0131z\u0131n foto\u011Fraf\u0131n\u0131 \u00E7ekin, 3700+ hal\u0131 aras\u0131ndan se\u00E7im yap\u0131n ve hal\u0131n\u0131n odan\u0131zdaki g\u00F6r\u00FCn\u00FCm\u00FCn\u00FC an\u0131nda g\u00F6r\u00FCn.' },
    ],
  },
  {
    slug: '4-metrekare-hali',
    title: '4 m\u00B2 Hal\u0131n\u0131n \u00D6l\u00E7\u00FCs\u00FC Nedir? | Boyutlar ve Se\u00E7im Rehberi',
    metaDescription: '4 metrekare hal\u0131 \u00F6l\u00E7\u00FCleri, boyutlar\u0131 ve se\u00E7im rehberi. 2x2, 1.6x2.5 gibi farkl\u0131 \u00F6l\u00E7\u00FC kombinasyonlar\u0131n\u0131 ve odan\u0131za en uygun hal\u0131y\u0131 nas\u0131l se\u00E7ece\u011Finizi \u00F6\u011Frenin.',
    summary: '4 metrekare hal\u0131 \u00F6l\u00E7\u00FCleri, boyutlar\u0131 ve odan\u0131za en uygun hal\u0131y\u0131 nas\u0131l se\u00E7ece\u011Finizi \u00F6\u011Frenin.',
    date: '2026-03-10',
    author: DEFAULT_AUTHOR,
    published: true,
    sections: [
      { type: 'paragraph', text: 'Hal\u0131 se\u00E7erken s\u0131kl\u0131kla sorulan sorulardan biri de "4 metrekare hal\u0131n\u0131n \u00F6l\u00E7\u00FCs\u00FC nedir?" sorusudur. 4 m\u00B2, \u00F6zellikle yatak odalar\u0131, \u00E7ocuk odalar\u0131 ve k\u00FC\u00E7\u00FCk oturma alanlar\u0131 i\u00E7in ideal bir hal\u0131 b\u00FCy\u00FCkl\u00FC\u011F\u00FCD\u00FCr.' },
      { type: 'heading', text: '4 m\u00B2 Hal\u0131 \u00D6l\u00E7\u00FC Tablosu', level: 2 },
      { type: 'paragraph', text: '4 metrekarelik hal\u0131lar\u0131n en yayg\u0131n \u00F6l\u00E7\u00FC kombinasyonlar\u0131 ve uygun olduklar\u0131 oda tipleri:' },
      { type: 'table', rows: [['En x Boy', 'Boyutlar', 'Uygun Oda Tipi'], ['2 m x 2 m', '200 x 200 cm', 'Kare yatak odas\u0131, \u00E7al\u0131\u015Fma odas\u0131'], ['1.6 m x 2.5 m', '160 x 250 cm', 'Yatak odas\u0131, \u00E7ocuk odas\u0131'], ['1.33 m x 3 m', '133 x 300 cm', 'Dar koridor, mutfak'], ['1 m x 4 m', '100 x 400 cm', 'Uzun koridor, giri\u015F']] },
      { type: 'heading', text: 'En Yayg\u0131n \u00D6l\u00E7\u00FC: 160 x 250 cm', level: 2 },
      { type: 'paragraph', text: '4 metrekarelik hal\u0131larda en \u00E7ok tercih edilen \u00F6l\u00E7\u00FC 160 x 250 cm\'dir. Bu \u00F6l\u00E7\u00FC, bir yatak odas\u0131nda yata\u011F\u0131n \u00F6n\u00FCne veya yan\u0131na yerle\u015Ftirmek i\u00E7in idealdir. Ayr\u0131ca k\u00FC\u00E7\u00FCk oturma odalar\u0131nda koltuk grubunun \u00F6n\u00FCnde kullan\u0131labilir.' },
      { type: 'heading', text: '4 m\u00B2 Hal\u0131 Nerelerde Kullan\u0131l\u0131r?', level: 2 },
      { type: 'list', items: ['Yatak odas\u0131: Yata\u011F\u0131n \u00F6n\u00FCnde veya yan\u0131nda', '\u00C7ocuk odas\u0131: Oyun alan\u0131 olarak', '\u00C7al\u0131\u015Fma odas\u0131: Masa alt\u0131nda', 'K\u00FC\u00E7\u00FCk salon: Sehpa alt\u0131nda', 'Giri\u015F hol\u00FC: Kar\u015F\u0131lama alan\u0131 olarak'], ordered: false },
      { type: 'heading', text: 'Odan\u0131zda Hal\u0131y\u0131 Canl\u0131 G\u00F6r\u00FCn', level: 2 },
      { type: 'paragraph', text: 'Hal\u0131n\u0131n odan\u0131za uyup uymad\u0131\u011F\u0131n\u0131 sat\u0131n almadan \u00F6nce g\u00F6rmek ister misiniz? Hal\u0131 Dene ile yapay zeka teknolojisi kullanarak hal\u0131y\u0131 odan\u0131zda deneyebilirsiniz. 17 markadan 3700\'den fazla hal\u0131 aras\u0131ndan se\u00E7im yap\u0131n.' },
    ],
  },
];
