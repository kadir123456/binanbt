# 🤖 Binance Futures Trading Bot

Mobil uyumlu, güvenli ve 24/7 çalışan Binance vadeli işlemler trading botu.

## 🚀 Özellikler

### 🔐 Güvenlik
- Firebase Authentication ile güvenli kullanıcı yönetimi
- API anahtarları server-side şifreleme ile korunur
- OWASP Top 10 güvenlik standartlarına uygun
- Admin panel ile sistem yönetimi

### 📊 Trading Algoritması
- EMA (9, 21, 50) tabanlı trend analizi
- Hacim onayı ile sinyal filtreleme
- Otomatik TP/SL yönetimi
- Çoklu kripto para desteği
- Risk yönetimi ve pozisyon boyutlandırma

### 🌐 Teknik Altyapı
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + CCXT
- **Database**: Firebase Realtime Database
- **Deployment**: Render.com ready

### 📱 Kullanıcı Deneyimi
- Mobil-first responsive tasarım
- Real-time veri güncellemeleri
- Intuitive kontrol paneli
- Anlık bildirimler ve hata yönetimi

## 🛠️ Kurulum

### Gereksinimler
- Node.js 18+
- Firebase projesi
- Binance API anahtarları

### Yerel Geliştirme

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd binance-futures-bot
```

2. **Frontend bağımlılıklarını yükleyin**
```bash
npm install
```

3. **Backend bağımlılıklarını yükleyin**
```bash
cd server
npm install
```

4. **Environment variables ayarlayın**
```bash
# server/.env dosyasını oluşturun
cp server/.env.example server/.env
# Gerekli değerleri doldurun
```

5. **Firebase Admin SDK kurulumu**
- Firebase Console'dan service account key indirin
- Key bilgilerini `.env` dosyasına ekleyin

6. **Uygulamayı başlatın**
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
npm run dev
```

## 🚀 Render.com Deployment

### Otomatik Deployment
1. Repository'yi Render.com'a bağlayın
2. `render.yaml` dosyası otomatik olarak iki servis oluşturur:
   - Frontend (Static Site)
   - Backend (Web Service)

### Manuel Konfigürasyon
1. **Backend Service**:
   - Environment: Node.js
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`

2. **Frontend Service**:
   - Environment: Static Site
   - Build Command: `npm run build`
   - Publish Directory: `dist`

### Environment Variables
Backend servisinde aşağıdaki environment variable'ları ayarlayın:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_DATABASE_URL`
- `ADMIN_KEY`
- `JWT_SECRET`

## 📖 Kullanım Kılavuzu

### 1. Hesap Oluşturma
- Ana sayfada "Kayıt Ol" sekmesini seçin
- Email ve şifre ile hesap oluşturun

### 2. API Anahtarları
- Dashboard'da "API Ayarları" bölümüne gidin
- Binance API Key ve Secret Key'inizi girin
- Anahtarlar şifrelenmiş olarak saklanır

### 3. Trading Ayarları
- Kaldıraç oranını seçin (5x-100x)
- Risk yüzdesini belirleyin (%1-10)
- TP/SL oranlarını ayarlayın
- Trading yapılacak kripto paraları seçin
- Zaman dilimini belirleyin

### 4. Bot Kontrolü
- "Botu Başlat" butonuna tıklayın
- Bot 24/7 piyasayı takip eder
- Pozisyonlar otomatik olarak yönetilir

## 🔧 Admin Panel

Admin paneline `/admin` URL'sinden erişebilirsiniz.

### Özellikler:
- **Genel Duyuru**: Tüm kullanıcılara duyuru gönderme
- **IP Whitelist**: Binance API için IP adresi yönetimi
- **Sistem Durumu**: Server ve database durumu takibi

## 📊 Trading Stratejisi

### EMA Cross Strategy
- **EMA 9 > EMA 21 > EMA 50**: Long pozisyon sinyali
- **EMA 9 < EMA 21 < EMA 50**: Short pozisyon sinyali
- **Hacim Onayı**: Ortalama hacmin %20 üzerinde olmalı

### Risk Yönetimi
- Pozisyon boyutu: Bakiye × Risk% × Kaldıraç
- Otomatik TP/SL emirleri
- Maksimum pozisyon limiti

## 🛡️ Güvenlik

### API Güvenliği
- API anahtarları Base64 ile şifrelenir
- Server-side'da saklanır, client'a gönderilmez
- IP whitelist önerisi

### Uygulama Güvenliği
- Helmet.js ile HTTP header koruması
- CORS konfigürasyonu
- Input validation ve sanitization
- Rate limiting

## 📞 Destek

Herhangi bir sorun veya öneriniz için:
- Email: support@bilwin.inc
- GitHub Issues

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

**⚠️ Risk Uyarısı**: Kripto para trading'i yüksek risk içerir. Sadece kaybetmeyi göze alabileceğiniz miktarlarla işlem yapın.

**Yapımcı**: bilwin.inc