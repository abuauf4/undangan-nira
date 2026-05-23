'use client'

import { useState, useEffect } from 'react'

// Default values — matches what's in admin DEFAULT_VALUES
const DEFAULTS: Record<string, string> = {
  groom: 'Irwan Pratomo',
  bride: 'Anira Tri Agustini',
  groomParents: 'Bpk. Sugeng Hartanto & Ibu Dahlianingsih',
  brideParents: 'Bpk. Andi Yosalfi & Ibu Budi Hastuti',
  coupleSubtitle: 'Dua jiwa, satu kisah',
  coverSeal: 'I&A',
  akadDate: '2026-07-05T10:00:00+07:00',
  resepsiDate: '2026-07-05T11:00:00+07:00',
  resepsiEnd: '2026-07-05T17:00:00+07:00',
  venue: 'Rumah Mempelai Wanita',
  address: 'Villa Mutiara Bogor 2 Blok C2 No.36, Kel. Waringin Jaya, Kec. Bojonggede, Kab. Bogor',
  lamaranDate: '31 Agustus 2025',
  mapsUrl: 'https://maps.app.goo.gl/JJ1Lmg33ensJgAvEA?g_st=ac',
  mapsQrImage: '/images/maps-qrcode.png',
  diaryIntroYear: '2020',
  diarySubtitle: 'Cerita kami dimulai',
  diaryIntro: 'Tidak ada yang kebetulan di dunia ini, semua sudah tersusun rapih oleh Sang Maha Kuasa, kita tidak bisa memilih kepada siapa kita akan jatuh cinta, awal kami bertemu pada tahun 2020. Tidak ada yang pernah menyangka bahwa pertemuan itu membawa kami pada suatu ikatan yang suci. Setiap langkah yang kami ambil, setiap tawa dan air mata yang kami bagikan, seolah mengantarkan kami pada satu titik yang telah dituliskan sejak lamanya. Mungkin kami tidak selalu memahami jalan yang kami lalui, tapi kini kami yakin bahwa setiap detik telah menjadi bagian dari cerita ini.',
  timeline: '[{"year":"2022","title":"Mulai Dekat","description":"Seiring berjalan waktu kami semakin dekat. Latar belakang yang berbeda membuat kami saling melengkapi dan banyak menemukan hal baru. Satu dua langkah menuntun kami hingga ke perjalanan selanjutnya."},{"year":"2025","title":"Lamaran","description":"Kehendak-Nya menuntun kami pada pertemuan yang tak pernah disangka hingga akhirnya membawa kami pada sebuah ikatan suci yang dicintai-Nya, kami melangsungkan acara lamaran pada 31 Agustus 2025."},{"year":"2026","title":"Menikah","description":"Percayalah, bukan karena bertemu lalu berjodoh, tapi karena berjodohlah kami dipertemukan. Atas izin Allah kami memutuskan untuk mengikrarkan janji suci pernikahan pada 05 Juli 2026."}]',
  closingTitle: 'Dan seperti semua cerita indah, kami memulai babak baru bersama.',
  closingSubtitle: 'Terima kasih telah menjadi bagian dari hari bahagia kami.',
  closingArabicDoa: 'بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ',
  closingTransliteration: "Barakallahu lakuma wa baraka 'alaikuma wa jama'a bainakuma fi khair.",
  closingFooter: 'Forever starts with Bismillah.',
  closingFinal: 'Cerita kami belum selesai, ini baru permulaan. Sampai jumpa di hari bahagia kami!',
  creditText: 'Powered By Nauka Motion',
  bismillahQuote: '"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang."',
  bismillahSource: '— QS. Ar-Rum: 21',
  envelopeMessage: 'Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Dan jika memberi adalah ungkapan tanda kasih, Anda bisa mengirimkan melalui:',
  bankAccounts: '[{"bank":"BCA","number":"360058289","name":"Anira Tri Agustini"},{"bank":"BCA","number":"7621009625","name":"Irwan Pratomo"}]',
  giftAddress: 'Villa Mutiara Bogor 2 Blok C2 No.36, Kel. Waringin Jaya, Kec. Bojonggede, Kab. Bogor',
  giftRecipient: 'Anira Tri Agustini',
  galleryCaptions: '["Pertama kali","Bersama","Kenangan","Tawa","Bahagia"]',
  galleryImages: '["/images/gallery-1.jpg","/images/gallery-2.jpg","/images/gallery-3.jpg","/images/gallery-4.jpg","/images/gallery-5.jpg"]',
  photoGroom: '/images/groom.jpg',
  photoBride: '/images/bride.jpg',
  coverImage: '/images/hero-poster.jpg',
}

export interface WeddingData {
  groom: string
  bride: string
  groomParents: string
  brideParents: string
  coupleSubtitle: string
  coverSeal: string
  akadDate: string
  resepsiDate: string
  resepsiEnd: string
  venue: string
  address: string
  lamaranDate: string
  mapsUrl: string
  mapsQrImage: string
  diaryIntroYear: string
  diarySubtitle: string
  diaryIntro: string
  timeline: { year: string; title: string; description: string }[]
  closingTitle: string
  closingSubtitle: string
  closingArabicDoa: string
  closingTransliteration: string
  closingFooter: string
  closingFinal: string
  creditText: string
  bismillahQuote: string
  bismillahSource: string
  envelopeMessage: string
  bankAccounts: { bank: string; number: string; name: string }[]
  giftAddress: string
  giftRecipient: string
  galleryCaptions: string[]
  galleryImages: string[]
  photoGroom: string
  photoBride: string
  coverImage: string
}

// Parse JSON field safely
function parseJSON<T>(str: string | undefined, fallback: T): T {
  if (!str) return fallback
  try { return JSON.parse(str) } catch { return fallback }
}

// Build WeddingData from raw config key-value pairs
function buildWeddingData(raw: Record<string, string>): WeddingData {
  return {
    groom: raw.groom || DEFAULTS.groom,
    bride: raw.bride || DEFAULTS.bride,
    groomParents: raw.groomParents || DEFAULTS.groomParents,
    brideParents: raw.brideParents || DEFAULTS.brideParents,
    coupleSubtitle: raw.coupleSubtitle || DEFAULTS.coupleSubtitle,
    coverSeal: raw.coverSeal || DEFAULTS.coverSeal,
    akadDate: raw.akadDate || DEFAULTS.akadDate,
    resepsiDate: raw.resepsiDate || DEFAULTS.resepsiDate,
    resepsiEnd: raw.resepsiEnd || DEFAULTS.resepsiEnd,
    venue: raw.venue || DEFAULTS.venue,
    address: raw.address || DEFAULTS.address,
    lamaranDate: raw.lamaranDate || DEFAULTS.lamaranDate,
    mapsUrl: raw.mapsUrl || DEFAULTS.mapsUrl,
    mapsQrImage: raw.mapsQrImage || DEFAULTS.mapsQrImage,
    diaryIntroYear: raw.diaryIntroYear || DEFAULTS.diaryIntroYear,
    diarySubtitle: raw.diarySubtitle || DEFAULTS.diarySubtitle,
    diaryIntro: raw.diaryIntro || DEFAULTS.diaryIntro,
    timeline: parseJSON(raw.timeline, parseJSON(DEFAULTS.timeline, [])),
    closingTitle: raw.closingTitle || DEFAULTS.closingTitle,
    closingSubtitle: raw.closingSubtitle || DEFAULTS.closingSubtitle,
    closingArabicDoa: raw.closingArabicDoa || DEFAULTS.closingArabicDoa,
    closingTransliteration: raw.closingTransliteration || DEFAULTS.closingTransliteration,
    closingFooter: raw.closingFooter || DEFAULTS.closingFooter,
    closingFinal: raw.closingFinal || DEFAULTS.closingFinal,
    creditText: raw.creditText || DEFAULTS.creditText,
    bismillahQuote: raw.bismillahQuote || DEFAULTS.bismillahQuote,
    bismillahSource: raw.bismillahSource || DEFAULTS.bismillahSource,
    envelopeMessage: raw.envelopeMessage || DEFAULTS.envelopeMessage,
    bankAccounts: parseJSON(raw.bankAccounts, parseJSON(DEFAULTS.bankAccounts, [])),
    giftAddress: raw.giftAddress || DEFAULTS.giftAddress,
    giftRecipient: raw.giftRecipient || DEFAULTS.giftRecipient,
    galleryCaptions: parseJSON(raw.galleryCaptions, parseJSON(DEFAULTS.galleryCaptions, [])),
    galleryImages: parseJSON(raw.galleryImages, parseJSON(DEFAULTS.galleryImages, [])),
    photoGroom: raw.photoGroom || DEFAULTS.photoGroom,
    photoBride: raw.photoBride || DEFAULTS.photoBride,
    coverImage: raw.coverImage || DEFAULTS.coverImage,
  }
}

// Default wedding data from hardcoded values (used before API loads)
function getDefaultData(): WeddingData {
  return buildWeddingData(DEFAULTS)
}

export function useWeddingConfig() {
  const [data, setData] = useState<WeddingData>(getDefaultData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.ok ? r.json() : {})
      .then(raw => {
        setData(buildWeddingData(raw))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { data, loading }
}

export { getDefaultData, buildWeddingData }
