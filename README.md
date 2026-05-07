# TaskFlow: Premium Kanban & Project Management

TaskFlow, modern ekipler için tasarlanmış, hız ve estetik odaklı, gerçek zamanlı bir proje yönetim uygulamasıdır. **Next.js**, **Supabase** ve **dnd-kit** kullanılarak geliştirilen bu platform, hem masaüstü hem de mobil cihazlarda kusursuz bir kullanıcı deneyimi sunar.

## 🛠️ Teknik Yığın (Tech Stack)

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Drag and Drop:** [@dnd-kit/core](https://dnd-kit.com/)
- **Styling:** Vanilla CSS (Modern CSS Variables & Glassmorphism)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animations:** Canvas Confetti & CSS Transitions

## Kütüphane Seçim Kararları (Rasyoneller)

### 1. dnd-kit (Sürükle-Bırak)
*Neden seçildi?*
- **Performans:** Geleneksel kütüphanelerin aksine modülerdir, sadece ihtiyaç duyulan sensörleri yükler.
- **Touch Support:** Mobil cihazlar için yerleşik `TouchSensor` desteği sayesinde "long-press" (uzun basma) sürüklemesi yapılabilir.
- **Accessibility:** Klavye ve ekran okuyucu desteği en üst seviyededir.

### 2. Supabase (Backend-as-a-Service)
*Neden seçildi?*
- **Realtime Sync:** PostgreSQL tabanlı "Realtime" özelliği sayesinde, bir kullanıcının yaptığı değişiklik sayfa yenilenmeden diğerinde görünür.
- **Hızlı Geliştirme:** Auth, Database ve Storage servislerini tek noktadan yöneterek 48 saatlik maratonda hıza odaklanılmasını sağlar.

### 3. Lucide React (İkon Seti)
*Neden seçildi?*
- **Tutarlılık:** Modern, ince çizgili (lightweight) tasarımıyla uygulamanın "Premium" havasını destekler.
- **Tree-shaking:** Sadece kullanılan ikonlar bundle'a dahil edilerek performans korunur.

## ✨ Öne Çıkan Özellikler

- **Mobile-First Tasarım:** Özel mobil alt menü (Bottom Nav) ve parmakla kaydırmaya duyarlı (Snap-scroll) Kanban tahtası.
- **Akıllı Sıralama Mantığı:** Kartlar arasında `float` tabanlı pozisyon hesaplaması ile milimetrik ve kalıcı sıralama.
- **Dashboard İstatistikleri:** Toplam görev ve acil vadesi yaklaşan görevlerin anlık takibi.
- **Arşivleme Sistemi:** Tamamlanan veya gizlenmesi gereken panolar için özel arşiv yönetim paneli.
- **👥 Ekip İşbirliği:** Pano paylaşımı ve her kullanıcıya özel avatar desteği.
  
## 🚀 Kurulum

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/kullaniciadi/taskflow.git
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. `.env.local` dosyasını oluşturun ve Supabase bilgilerinizi ekleyin:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
4. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```

## 📂 Dosya Yapısı (Folder Structure)

```text
taskflow/
├── app/                  # Next.js App Router (Sayfalar ve Layoutlar)
│   ├── auth/             # Kayıt ve Giriş sayfaları
│   ├── board/[id]/       # Dinamik Kanban tahtası sayfası
│   ├── dashboard/        # Ana yönetim merkezi (Dashboard)
│   ├── calendar/         # Takvim görünümü sayfası
│   ├── globals.css       # Global stil tanımları ve Tasarım Sistemi
│   └── layout.js         # Ana uygulama iskeleti
├── components/           # Yeniden kullanılabilir UI Bileşenleri
│   ├── Sidebar.jsx       # Yan navigasyon menüsü
│   ├── TaskCard.jsx      # Bireysel görev kartı bileşeni
│   ├── TaskModal.jsx     # Görev detay ve düzenleme modalı
│   └── MobileBottomNav.jsx # Mobil alt navigasyon barı
├── lib/                  # Yardımcı fonksiyonlar ve servisler
│   ├── supabase.js       # Supabase istemci yapılandırması
│   └── utils.js          # Tarih, renk ve pozisyon yardımcıları
└── public/               # Statik varlıklar (İkonlar, görseller)
```

## 🏗️ Mimari Yaklaşım

TaskFlow, sürdürülebilir ve yüksek performanslı bir kullanıcı deneyimi için aşağıdaki mimari prensiplerle inşa edilmiştir:

### 1. Bileşen Bazlı Mimari (Component-Based)
Tüm arayüz, atomik bileşenlere parçalanmıştır. Bu sayede kod tekrarı önlenmiş ve bakım kolaylığı sağlanmıştır. Örneğin; `TaskCard` bileşeni hem ana tahtada hem de Dashboard özetlerinde aynı tutarlılıkla çalışır.

### 2. Gerçek Zamanlı Veri Akışı (Real-Time Flux)
Veri yönetimi için doğrudan **Supabase Realtime** kanalları kullanılmıştır. Bir kullanıcının yaptığı sürükle-bırak işlemi, diğer kullanıcının ekranında sayfa yenilenmeden (optimistic updates ile) anında yansır.

### 3. Modern Tasarım Sistemi (CSS Variables)
Tailwind CSS yerine modern CSS değişkenleri (`:root`) tercih edilmiştir. Bu sayede uygulama çapında renk, boşluk ve tipografi yönetimi merkezi bir noktadan yapılır, "Dark Mode" gibi özelliklere tam uyum sağlanır.

### 4. Mobil-Öncelikli (Mobile-First) Strateji
Tasarım en küçük ekrandan başlayarak masaüstüne doğru genişletilmiştir. Mobilde parmak hareketlerine duyarlı `TouchSensor` ve `Scroll-Snap` özellikleri kullanıcı deneyiminin merkezine yerleştirilmiştir.

## 🔍 Teknik Dosya Detayları & Kod Mantığı

Jüri incelemesi için kritik dosyaların içerdiği mantıksal yapılar aşağıda özetlenmiştir:

## 🔍 Teknik Dosya Analizi (Klasör Bazlı Tam Liste)

### 📁 `app/` (Ana Uygulama Dizini)
- **`layout.js` (Root Layout)**: Uygulamanın tüm sayfalarını sarmalayan ana katman. Next.js App Router mimarisinde evrensel navigasyonu (`Sidebar`, `MobileBottomNav`) yönetir ve kullanıcı oturumunu (session) tüm alt sayfalara tutarlı bir şekilde aktarır.
- **`page.js` (Giriş & Yönlendirme)**: Uygulamanın "Root" (Kök) sayfasıdır. Kullanıcının oturum durumunu kontrol eder; giriş yapmış kullanıcıları doğrudan `Dashboard`'a, yapmamış olanları ise `Auth` sayfalarına yönlendiren akıllı yönlendirme mantığını (routing logic) barındırır.
- **`globals.css` (Tasarım Sistemi)**: Projenin tüm görsel kimliğini belirleyen ana stil dosyasıdır. CSS değişkenleri (`:root`) kullanılarak bir tasarım sistemi (Design System) oluşturulmuştur. Glassmorphism efektleri, premium renk paleti ve duyarlı (responsive) grid yapıları burada tanımlıdır.

#### 📂 `app/auth/` (Kimlik Doğrulama Klasörü)
- **`login/page.js`**: Kullanıcı giriş arayüzü ve Supabase Login entegrasyonu.
- **`register/page.js`**: Yeni kullanıcı kayıt formu ve hesap oluşturma süreci.

#### 📂 `app/board/[id]/` (Dinamik Kanban Klasörü)
- **`page.js`**: Belirli bir panonun (ID bazlı) Kanban tahtası. Sürükle-bırak (Dnd) işlemlerinin ve Realtime senkronizasyonun yönetildiği ana motor.

#### 📂 `app/dashboard/` (Yönetim Merkezi Klasörü)
- **`page.js`**: Tüm panoların listelendiği, gruplandırıldığı (Proje, Toplantı, Notlar) ve arşivlendiği Dashboard ana ekranı.

#### 📂 `app/calendar/` (Takvim Klasörü)
- **`page.js`**: Görevlerin zaman çizelgesi üzerinde dağılımını gösteren interaktif takvim sayfası.

### 📁 `components/` (Arayüz Bileşenleri)
- **`Column.jsx`**: Kanban tahtasındaki dikey sütunlar. Kendi içindeki görevleri `SortableContext` ile sarmalayarak sürükle-bırak alanlarını tanımlar.
- **`TaskCard.jsx`**: Görev kartı; her bir görevin öncelik, tarih ve kişi bilgisini taşıyan atomik bileşendir.
- **`TaskModal.jsx`**: Görev detaylarının derinlemesine düzenlendiği, etiketlerin yönetildiği merkezi kontrol paneli.
- **`Sidebar.jsx`**: Masaüstü navigasyonu, profil erişimi ve Arşiv geçişlerini yöneten yan menü.
- **`MobileBottomNav.jsx`**: Mobil cihazlar için optimize edilmiş, dokunma dostu alt navigasyon sistemi.
- **`SearchBar.jsx`**: Tüm pano veya görevler içerisinde başlık bazlı anlık filtreleme sağlayan arama motoru bileşeni.
- **`Filter.jsx`**: Görevleri öncelik, tarih veya atanan kişi bazında süzmeye yarayan gelişmiş filtreleme arayüzü.
- **`ProgressBar.jsx`**: Kartlar üzerindeki checklist ilerlemesini veya görev tamamlanma oranını görselleştiren ilerleme çubuğu.
- **`TrashZone.jsx`**: Sürüklenen kartların üzerine bırakılarak hızlıca silinmesini sağlayan interaktif "Çöp Kutusu" alanı.
- **`MemberList.jsx`**: Panodaki ekip üyelerinin yönetimi ve yeni üye davet etme arayüzü.
- **`LabelBadge.jsx`**: Görev etiketlerinin dinamik renk yönetimi ve `TagInput` sistemini içeren bileşen.

### 📁 `lib/` (Yardımcı Fonksiyonlar & Servisler)
- **`supabase.js`**: Veritabanı ve Auth servisleri için ana Supabase istemci bağlantısı.
- **`utils.js`**: `calculatePosition` (ondalıklı sıralama) ve tarih işleme algoritmalarının merkezi.

### ⚙️ Sistem Klasörleri ve Yapılandırma
- **`.next/`**: Next.js tarafından otomatik oluşturulan derleme (build) klasörüdür. Kodun tarayıcıda en hızlı şekilde çalışması için yapılan optimizasyonları ve önbellek dosyalarını barındırır. (GitHub'a dahil edilmez).
- **`node_modules/`**: Projenin çalışması için gerekli olan tüm dış kütüphanelerin (dnd-kit, lucide-react vb.) yüklendiği dizindir.
- **`.env.local`**: Veritabanı anahtarları gibi hassas bilgilerin saklandığı gizli yapılandırma dosyasıdır.
- **`public/`**: Uygulama içerisinde kullanılan logo, favicon ve statik görsellerin bulunduğu klasördür.

## 💡 Mimari Kararlar ve Teknik Vizyon

TaskFlow projesinde tercih edilen teknolojiler ve mimari yaklaşımlar, modern yazılım prensiplerine dayanmaktadır:

### Next.js 15 & Hybrid Rendering
Bu projede Next.js 15 ve App Router mimarisi tercih edilmiştir. Bu yapı, modern web standartlarına en uygun **Hybrid Rendering** (Server & Client) dengesini sunar. Kanban tahtası gibi etkileşimi yüksek ve anlık tepki gerektiren alanlarda **Client Components**'ın hızından faydalanırken, uygulamanın ana iskeletinde **Server Components** kullanarak ilk yükleme (FCP) süreleri optimize edilmiştir.

### Supabase SDK & Veri Yönetimi
Veri mutasyonlarında (kart taşıma, güncelleme, silme) **Supabase SDK**'nın sunduğu asenkron yapı ve **Optimistic Updates** mantığı kullanılmıştır. Bu sayede:
- **Hız:** Kullanıcı bir kartı taşıdığında, veritabanı cevabı beklenmeden arayüz güncellenir, böylece gecikmesiz bir deneyim sağlanır.
- **Güvenlik:** Tüm veritabanı işlemleri Supabase'in Row Level Security (RLS) politikalarıyla korunmaktadır.
- **Ölçeklenebilirlik:** Proje, kurumsal ölçekte binlerce kartı ve kullanıcıyı anlık olarak yönetebilecek (scalable) bir altyapı üzerine inşa edilmiştir.

## Projeyi Başlatma & Demo (How to Run)

Uygulamayı yerel makinenizde çalıştırmak veya demo olarak incelemek için şu adımları izleyin:

### 1. Hazırlık
Uygulama Next.js motoruyla çalıştığı için tek bir dosyayı çalıştırmak yerine, projenin çalışma ortamını kurmanız ve tüm bağımlılıkları yapılandırmanız gerekir:
```bash
npm install
```

### 2. Ortam Değişkenleri
Kök dizinde bir `.env.local` dosyası oluşturun ve veritabanı bağlantısı için gerekli Supabase anahtarlarınızı girin:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 3. Uygulamayı Çalıştırma
Geliştirme sunucusunu başlatmak için aşağıdaki komutu kullanın:
```bash
npm run dev
```
Uygulama hazır olduğunda tarayıcınızdan `http://localhost:3000` adresine giderek demoyu kullanmaya başlayabilirsiniz. Uygulama otomatik olarak `app/page.js` dosyasından itibaren tüm sayfaları yükleyecektir.

---
*Bu dokümantasyon, TaskFlow projesinin teknik şeffaflığını ve mimari kalitesini belgelemek amacıyla hazırlanmıştır.*
