/**
 * Küçük performans ayarları — geri almak için:
 * - Bu dosyadaki sayıları eski değerlere çevirin, veya
 * - Dosyayı silip ilgili import / argümanları kaldırın.
 */

/** Ana sayfa dilimleri en fazla index 49 kullanır (40–50); tamponlu. */
export const HOME_BOOKS_FETCH_LIMIT = 60;

/** Katalog tam liste; backend üst sınırı 200. Koleksiyon büyürse artırın. */
export const CATALOG_BOOKS_FETCH_LIMIT = 200;

/** Kitap detayında “benzer” havuzu (önceki değer: 100). */
export const SIMILAR_BOOKS_POOL_LIMIT = 80;
