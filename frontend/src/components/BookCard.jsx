import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SmartBookCover from './SmartBookCover'

function firstTopicLabel(raw) {
  if (!raw || typeof raw !== 'string') return ''
  const t = raw.trim()
  if (!t) return ''
  const part = t.split(/[,;/|]/)[0]
  return (part || t).trim()
}

/** Liste anahtarı: DB satırlarında `isbn`, Google’dan gelen kartlarda `id` / `volumeId` */
export function bookListKey(book, fallbackIndex = 0) {
  const k = book?.isbn ?? book?.id ?? book?.volumeId
  if (k != null && String(k).trim() !== '') return String(k)
  return `book-${fallbackIndex}`
}

/** PostgreSQL (/api/kitaplar) ve Google Books çıktısını tek kartta kullanmak için */
export default function BookCard({ book, compact = false, decorative = false }) {
  const title =
    (book.kitap_adi && String(book.kitap_adi).trim()) ||
    book.title ||
    'İsimsiz Kitap'

  const authorFromDb = book.yazar && String(book.yazar).trim()
  const authorFromApi = Array.isArray(book.authors) ? book.authors[0] : book.authors
  const author = (authorFromDb || authorFromApi || '').trim() || 'Bilinmeyen Yazar'

  const category =
    firstTopicLabel(book.kategoriler || book.ilgili_kategoriler) ||
    book.volumeInfo?.categories?.[0] ||
    'Genel'

  const coverUrl =
    (book.kapak_url && String(book.kapak_url).trim()) ||
    book.thumbnail ||
    book.volumeInfo?.imageLinks?.thumbnail ||
    book.coverFallbackUrl ||
    '/placeholder-book.jpg'

  const isbn = book.isbn != null && String(book.isbn).trim() !== '' ? String(book.isbn) : ''
  const detailTo = isbn ? `/kitap/${encodeURIComponent(isbn)}` : '/katalog'
  
  const reduce = useReducedMotion()
  const w = compact ? 'w-[130px] sm:w-[140px]' : 'w-[140px] sm:w-[150px]'

  return (
    <Link
      to={detailTo}
      tabIndex={decorative ? -1 : undefined}
      aria-hidden={decorative ? true : undefined}
      className={`group block flex-shrink-0 ${w} rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`}
    >
      <motion.div
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md transition duration-300 group-hover:border-slate-300 group-hover:shadow-xl"
        whileHover={
          reduce
            ? undefined
            : { y: -6, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 22 } }
        }
        whileTap={reduce ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      >
        <div className={`relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-night/5 to-night/10 ${compact ? 'aspect-[2/3]' : 'aspect-[2/3]'}`}>
          
          {/* 2. Kapak URL'sini güncelliyoruz */}
          <SmartBookCover
            src={coverUrl} 
            fallbackSrc="/placeholder-book.jpg"
            title={title}
            alt={`${title} kapak görseli`}
            decorative={decorative}
            imageClassName="h-full w-full rounded-t-2xl object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
          
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/40 to-transparent" />
          <span className="absolute left-2 top-2 rounded-full border border-white/30 bg-slate-900/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
            {category}
          </span>
        </div>
        <div className="p-2.5">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900">
            {title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
            {author}
          </p>
        </div>
      </motion.div>
    </Link>
  )
}