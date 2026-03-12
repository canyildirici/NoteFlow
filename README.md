# 📚 NoteFlow

> Öğrenciler için akıllı not paylaşım platformu — React Native + Expo + Firebase

---

## 📱 Ekran Görüntüleri

| Ana Ekran | Arama | Koleksiyonlar | Klasörler | Profil |
|-----------|-------|---------------|-----------|--------|
| ![](https://raw.githubusercontent.com/canyildirici/NoteFlow/main/assets/screenshots/1.png) | ![](https://raw.githubusercontent.com/canyildirici/NoteFlow/main/assets/screenshots/2.png) | ![](https://raw.githubusercontent.com/canyildirici/NoteFlow/main/assets/screenshots/3.png) | ![](https://raw.githubusercontent.com/canyildirici/NoteFlow/main/assets/screenshots/4.png) | ![](https://raw.githubusercontent.com/canyildirici/NoteFlow/main/assets/screenshots/5.png) |

---

## 🌟 Nedir?

NoteFlow, öğrencilerin notlarını oluşturmasını, düzenlemesini ve sınıf arkadaşlarıyla paylaşmasını sağlayan modern bir mobil uygulamadır. Üniversitede not paylaşımının dağınık ve verimsiz olduğunu fark ederek geliştirdim. iOS, Android ve Web platformlarında çalışır.

---

## 📊 Proje İstatistikleri

| Özellik | Değer |
|---|---|
| Platform | iOS, Android, Web |
| Backend | Firebase Firestore |
| Depolama | Cloudinary |
| Erişim Seviyesi | 3 (Özel, Sınıf, Açık) |
| Ders Klasörü | 5 |
| Desteklenen Dosya | PDF, Fotoğraf |

---

## ✨ Özellikler

### 📝 Not Yönetimi
- Not oluşturma, düzenleme ve silme
- Otomatik versiyonlama — her kaydetmede geçmiş saklanır
- 5 farklı ders klasörü: `Matematik` `Fizik` `Kimya` `Tarih` `Genel`
- Etiket sistemi ile hızlı filtreleme
- Favori notlar ve koleksiyonlar

### 📂 Dosya Yükleme
- PDF ve fotoğraf yükleme
- Cloudinary ile bulut depolama — tüm cihazlardan erişim
- Web'de PDF yeni sekmede açılır, Android'de Google Docs ile görüntülenir

### 🔐 Erişim Kontrolü

| Seviye | Kimler Görebilir? |
|--------|-------------------|
| 🔴 **Özel** | Sadece sen |
| 🟡 **Sınıf** | Aynı sınıf koduna sahip herkes |
| 🟢 **Açık** | Tüm kullanıcılar |

### 🏫 Sınıf Sistemi
- Kayıt olurken sınıf kodu belirle (örn: `MAT101`)
- Aynı kodu giren öğrenciler ortak notlara erişir
- Profil ekranından sınıf kodunu istediğin zaman güncelle

### 🔍 Arama
- Türkçe karakter desteği — ş, ğ, ü, ö, ç, ı ile sorunsuz arama
- Başlık, içerik, etiket ve klasöre göre anlık arama
- Erişim tipine göre filtreleme

### 💬 Diğer
- Notlara yorum yapma
- Karanlık / Aydınlık tema
- Profilde istatistikler ve erişim dağılımı

---

## 🛠 Teknolojiler

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

---

## 📦 Kurulum
```bash
git clone https://github.com/canyildirici/NoteFlow.git
cd NoteFlow
npm install
npx expo start --tunnel
```

> Expo Go uygulamasını telefonuna yükle ve QR kodu tara!

---

**Can Yıldırıcı** — 2025