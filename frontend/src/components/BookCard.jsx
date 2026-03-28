import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SmartBookCover from './SmartBookCover'

export default function BookCard({ book, compact = false, decorative = false }) {
  const author = book.authors?.[0] || 'Bilinmeyen yazar'
  const reduce = useReducedMotion()
  const w = compact ? 'w-[140px]' : 'w-[160px]'

  return (
    <Link
      to={`/kitap/${book.id}`}
      tabIndex={decorative ? -1 : undefined}
      aria-hidden={decorative ? true : undefined}
      className={`group block flex-shrink-0 ${w} rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`}
    >
      <motion.div
        className="overflow-hidden rounded-card bg-white shadow-card transition-shadow duration-300 group-hover:shadow-card-hover"
        whileHover={
          reduce
            ? undefined
            : { y: -8, scale: 1.03, transition: { type: 'spring', stiffness: 400, damping: 22 } }
        }
        whileTap={reduce ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      >
        <div
          className={`overflow-hidden rounded-t-card bg-gradient-to-br from-night/5 to-night/10 ${
            compact ? 'aspect-[2/3]' : 'aspect-[2/3]'
          }`}
        >
          <SmartBookCover
            src={book.thumbnail}
            isbnDigits={book.isbnDigits}
            title={book.title}
            authorLine={author}
            className="h-full w-full rounded-t-card"
            imageClassName="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{book.title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-ink/55">{author}</p>
        </div>
      </motion.div>
    </Link>
  )
}
