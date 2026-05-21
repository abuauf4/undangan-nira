# Task 3 — Interactive Features Agent Work Record

## Task
Add personalized guest URL parameter, Google Maps embed, Calendar button, and Dress Code info to the wedding invitation.

## Changes Made

### 1. CoverSection.tsx — Guest Name from URL
- Added `useSearchParams` from `next/navigation`
- Reads `?to=` URL parameter and displays guest name
- Shows "Kepada Yth." label + guest name below date, above "Buka Undangan" button
- Falls back to "Tamu Undangan" when no param provided

### 2. page.tsx — Suspense Boundary
- Added `Suspense` import and wrapped `<CoverSectionComponent>` in `<Suspense fallback={null}>`
- Required for `useSearchParams` in Next.js 16

### 3. page.tsx — EventSection Additions
- Google Maps iframe embed with venue location
- "Buka Google Maps" button (opens Google Maps search)
- "Tambah ke Kalender" button (Google Calendar event link)
- Dress Code: "Busana Formal / Batik"
- Children policy note

## Status: ✅ Complete
