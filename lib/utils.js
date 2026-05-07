/**
 * Fractional Indexing — Sıralama Yardımcı Fonksiyonları
 *
 * Bu dosya, kartların ve sütunların sırasını korumak için kullanılan
 * "ondalıklı pozisyonlama" algoritmasını içerir.
 *
 * Avantajı: Araya bir kart eklendiğinde sadece o kartın position değeri
 * güncellenir, diğer kartlara dokunulmaz (O(1) veritabanı işlemi).
 */

/**
 * İki pozisyon arasında yeni bir pozisyon hesaplar.
 * @param {number|null} before - Üstteki öğenin pozisyonu (null ise en başa ekle)
 * @param {number|null} after - Alttaki öğenin pozisyonu (null ise en sona ekle)
 * @returns {number} Yeni pozisyon değeri
 */
export function calculatePosition(before, after) {
  if (before === null && after === null) {
    return 1.0; // İlk öğe
  }
  if (before === null) {
    return after / 2; // En başa ekle
  }
  if (after === null) {
    return before + 1.0; // En sona ekle
  }
  return (before + after) / 2; // İki öğenin arasına ekle
}

/**
 * Bir listedeki öğelerin pozisyonlarını yeniden hesaplar.
 * Çok fazla araya ekleme yapılıp pozisyonlar çok yakınlaşırsa (float hassasiyet kaybı)
 * bu fonksiyon ile pozisyonlar düzgünce 1.0, 2.0, 3.0... olarak yeniden atanır.
 * @param {Array} items - Sıralı öğe dizisi
 * @returns {Array} Yeni pozisyonlarla güncellenmiş öğeler
 */
export function rebalancePositions(items) {
  return items.map((item, index) => ({
    ...item,
    position: (index + 1) * 1.0,
  }));
}

/**
 * Tarih badge durumunu hesaplar.
 * @param {string|null} dueDate - Bitiş tarihi (ISO formatında)
 * @returns {'overdue'|'soon'|'on-track'|null} Durum
 */
export function getDueDateStatus(dueDate) {
  if (!dueDate) return null;

  const now = new Date();
  const target = new Date(dueDate);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) return 'overdue';
  if (diffHours <= 24) return 'soon';
  return 'on-track';
}

/**
 * Tarih badge için Türkçe etiket metni döner.
 * @param {string} status - getDueDateStatus'tan dönen değer
 * @param {string} dueDate - ISO tarih
 * @returns {string} Görüntülenecek metin
 */
export function getDueDateLabel(dueDate) {
  if (!dueDate) return '';
  const target = new Date(dueDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} gün gecikti`;
  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Yarın';
  return `${diffDays} gün kaldı`;
}

/**
 * Pastel renk paleti — kart arka plan renkleri
 */
export const CARD_COLORS = [
  { name: 'Beyaz', value: '#ffffff' },
  { name: 'Açık Sarı', value: '#fef9c3' },
  { name: 'Açık Yeşil', value: '#dcfce7' },
  { name: 'Açık Mavi', value: '#dbeafe' },
  { name: 'Açık Mor', value: '#f3e8ff' },
  { name: 'Açık Pembe', value: '#fce7f3' },
  { name: 'Açık Turuncu', value: '#ffedd5' },
  { name: 'Açık Gri', value: '#f3f4f6' },
];

/**
 * Varsayılan Etiketler — Board düzeyinde kullanılır
 */
export const DEFAULT_LABELS = [
  { id: 'bug', name: 'Bug', color: '#EF4444' },
  { id: 'feature', name: 'Feature', color: '#3B82F6' },
  { id: 'improvement', name: 'İyileştirme', color: '#8B5CF6' },
  { id: 'urgent', name: 'Acil', color: '#F59E0B' },
  { id: 'design', name: 'Tasarım', color: '#EC4899' },
  { id: 'backend', name: 'Backend', color: '#14B8A6' },
];

/**
 * Öncelik Seviyeleri
 */
export const PRIORITIES = [
  { id: 'none', name: 'Yok', color: '#94a3b8', stripe: 'transparent' },
  { id: 'low', name: 'Düşük', color: '#22c55e', stripe: '#22c55e' },
  { id: 'medium', name: 'Orta', color: '#f59e0b', stripe: '#f59e0b' },
  { id: 'high', name: 'Yüksek', color: '#ef4444', stripe: '#ef4444' },
];
