/** Örnek veriler — backend bağlandığında API ile değiştirilecek */

export const mockDashboardStats = {
  totalBooks: 2847,
  activeBorrows: 312,
  overdue: 18,
}

export const mockUsers = [
  { id: '1', name: 'Ayşe Yılmaz', email: 'ayse@ornek.com', status: 'active', joined: '2024-01-12' },
  { id: '2', name: 'Mehmet Kaya', email: 'mehmet@ornek.com', status: 'active', joined: '2024-02-03' },
  { id: '3', name: 'Zeynep Demir', email: 'zeynep@ornek.com', status: 'inactive', joined: '2023-11-20' },
  { id: '4', name: 'Can Öztürk', email: 'can@ornek.com', status: 'active', joined: '2024-03-01' },
]

export const mockTransactions = [
  { id: 't1', userName: 'Ayşe Yılmaz', bookTitle: '1984', dueDate: '2025-04-02', status: 'borrowed' },
  { id: 't2', userName: 'Mehmet Kaya', bookTitle: 'Suç ve Ceza', dueDate: '2025-03-18', status: 'overdue' },
  { id: 't3', userName: 'Zeynep Demir', bookTitle: 'Sefiller', dueDate: '2025-04-10', status: 'borrowed' },
  { id: 't4', userName: 'Can Öztürk', bookTitle: 'Dönüşüm', dueDate: '2025-03-25', status: 'borrowed' },
]

/** Kitap ID -> stok (frontend demo) */
const stockByBookId = new Map()

export function getStockForBook(bookId) {
  if (!bookId) return { inStock: false, copies: 0 }
  if (!stockByBookId.has(bookId)) {
    stockByBookId.set(bookId, { inStock: Math.random() > 0.35, copies: Math.floor(Math.random() * 4) + 1 })
  }
  const s = stockByBookId.get(bookId)
  return { inStock: s.inStock && s.copies > 0, copies: s.copies }
}

export function simulateBorrow(bookId) {
  const s = stockByBookId.get(bookId)
  if (!s || !s.inStock || s.copies < 1) return false
  s.copies -= 1
  if (s.copies === 0) s.inStock = false
  return true
}

export function simulateReturn(bookId) {
  const s = stockByBookId.get(bookId) || { inStock: true, copies: 0 }
  s.copies = (s.copies || 0) + 1
  s.inStock = true
  stockByBookId.set(bookId, s)
}
