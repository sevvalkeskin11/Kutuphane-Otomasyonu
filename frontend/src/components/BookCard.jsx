import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SmartBookCover from './SmartBookCover'

export default function BookCard({ book, compact = false, decorative = false }) {
  const author = book.authors?.[0] || 'Bilinmeyen yazar'
  const category = book.volumeInfo?.categories?.[0] || 'Genel'
  const reduce = useReducedMotion()
  const w = compact ? 'w-[140px] sm:w-[150px]' : 'w-full min-w-[150px] sm:min-w-[160px]'

  return (
    <Link
      to={`/kitap/${book.id}`}
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
          <SmartBookCover
            src={book.thumbnail}
            fallbackSrc={book.coverFallbackUrl}
            title={book.title}
            alt={`${book.title} kapak gorseli`}
            decorative={decorative}
            imageClassName="h-full w-full rounded-t-2xl object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/40 to-transparent" />
          <span className="absolute left-2 top-2 rounded-full border border-white/30 bg-slate-900/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
            {category}
          </span>
        </div>
        <div className="p-3.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{book.title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{author}</p>
        </div>
      </motion.div>
    </Link>
  )
}
