import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SEED_DATA: Record<string, string> = {
  groom: 'Irwan Pratomo',
  bride: 'Anira Tri Agustini',
  groomParents: 'Bpk. Sugeng Hartanto & Ibu Dahlianingsih',
  brideParents: 'Bpk. Andi Yosalfi & Ibu Budi Hastuti',
  akadDate: '2026-07-05T10:00:00+07:00',
  resepsiDate: '2026-07-05T11:00:00+07:00',
  resepsiEnd: '2026-07-05T17:00:00+07:00',
  venue: 'Rumah Mempelai Wanita',
  address: 'Villa Mutiara Bogor 2 Blok C2 No.36, Kel. Waringin Jaya, Kec. Bojonggede, Kab. Bogor',
  lamaranDate: '31 Agustus 2025',
  timeline: JSON.stringify([
    {
      year: '2022',
      title: 'Mulai Dekat',
      description: 'Seiring berjalan waktu kami semakin dekat. Latar belakang yang berbeda membuat kami saling melengkapi dan banyak menemukan hal baru. Satu dua langkah menuntun kami hingga ke perjalanan selanjutnya.',
    },
    {
      year: '2025',
      title: 'Lamaran',
      description: 'Kehendak-Nya menuntun kami pada pertemuan yang tak pernah disangka hingga akhirnya membawa kami pada sebuah ikatan suci yang dicintai-Nya, kami melangsungkan acara lamaran pada 31 Agustus 2025.',
    },
    {
      year: '2026',
      title: 'Menikah',
      description: 'Percayalah, bukan karena bertemu lalu berjodoh, tapi karena berjodohlah kami dipertemukan. Atas izin Allah kami memutuskan untuk mengikrarkan janji suci pernikahan pada 05 Juli 2026.',
    },
  ]),
  galleryImages: JSON.stringify([
    '/images/gallery-1.jpg',
    '/images/gallery-2.jpg',
    '/images/gallery-3.jpg',
    '/images/gallery-4.jpg',
    '/images/gallery-5.jpg',
  ]),
  galleryCaptions: JSON.stringify(['Pertama kali', 'Bersama', 'Kenangan', 'Tawa', 'Bahagia']),
  diaryIntro: 'Tidak ada yang kebetulan di dunia ini, semua sudah tersusun rapih oleh Sang Maha Kuasa, kita tidak bisa memilih kepada siapa kita akan jatuh cinta, awal kami bertemu pada tahun 2020. Tidak ada yang pernah menyangka bahwa pertemuan itu membawa kami pada suatu ikatan yang suci. Setiap langkah yang kami ambil, setiap tawa dan air mata yang kami bagikan, seolah mengantarkan kami pada satu titik yang telah dituliskan sejak lamanya. Mungkin kami tidak selalu memahami jalan yang kami lalui, tapi kini kami yakin bahwa setiap detik telah menjadi bagian dari cerita ini.',
  diarySubtitle: 'Cerita kami dimulai',
  closingTitle: 'Dan seperti semua cerita indah yang dituliskan semesta, kisah kami baru saja dimulai.',
  closingSubtitle: 'Terima kasih telah menjadi bagian dari perjalanan kecil kami menuju selamanya.',
  closingTransliteration: 'Barakallahu lakuma wa baraka \'alaikuma wa jama\'a bainakuma fi khair',
  closingFooter: 'Semoga Allah memberkahimu dan memberkatimu, serta mengumpulkan kalian dalam kebaikan',
  closingFinal: 'بَارَكَ اللهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ',
  creditText: 'Kami Nauka Creative Digital mempersembahkan ini untuk kedua mempelai',
  bismillahQuote: 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.',
  bismillahSource: '— QS. Ar-Rum: 21',
  photoGroom: '/images/groom.jpg',
  photoBride: '/images/bride.jpg',
}

async function main() {
  console.log('Seeding database...')

  for (const [key, value] of Object.entries(SEED_DATA)) {
    await prisma.weddingConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  console.log(`Seeded ${Object.keys(SEED_DATA).length} config entries`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
