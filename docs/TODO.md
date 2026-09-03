# 🦷 Dental AI — Project TODO List

## 🚨 HIGH PRIORITY — Admin Approval Platform ✅ DONE
> Admin approval system is now live!

### 🗄️ Database Changes ✅
- [x] **User model mein `status` field add karo** — ✅ `PENDING | APPROVED | REJECTED` enum added
- [x] **User model mein `role` field** — ✅ `USER | ADMIN` enum added
- [x] **Prisma migration run karo** — ✅ Schema updated + migrated
- [x] **SystemConfig table** — ✅ AI Model setting storage added

### 🔐 Auth / Access Control ✅
- [x] **Registration flow update** — ✅ New users get `status: PENDING` by default
- [x] **Login check** — ✅ Session includes role + status
- [x] **Proxy Guard** — ✅ PENDING → /pending-approval, REJECTED → /pending-approval?status=rejected
- [x] **Session mein status store karo** — ✅ NextAuth JWT + session now includes `role` and `status`

### 📧 Notifications
- [ ] **Admin ko email** — Naya user register hone pe Admin ko notification email bhejo
- [ ] **User ko email** — Jab Admin approve/reject kare tab user ko email aaye

### 🖥️ Admin Dashboard ✅
- [x] **`/admin` page** — ✅ Full admin dashboard with stats, filters, search
- [x] **Pending Users List** — ✅ Shows name, email, college, ID card, record count
- [x] **Approve / Reject Button** — ✅ One-click approve, reject with reason modal
- [x] **ID Card Preview** — ✅ Expandable card shows uploaded ID card
- [x] **Approved/Rejected History** — ✅ Filter by status to see all decisions
- [x] **Admin link in Navbar** — ✅ Only shows for ADMIN role users
- [x] **make-admin script** — ✅ `npm run make-admin <email>` to bootstrap first admin

### 🤖 AI Model Switcher ✅
- [x] **DB mein `activeModel` setting** — ✅ SystemConfig table stores activeModel
- [x] **Admin Dashboard pe Model Selector UI** — ✅ Three cards: Google AI, Mock AI, Own AI
- [x] **Active model highlight** — ✅ Active card has glow effect + "Active" badge
- [x] **API Route** — ✅ `/api/admin/set-model` GET/POST
- [ ] **AI Router** — Connect `/api/analyze` to read activeModel and route accordingly
- [x] **Users ko pata na chale** — ✅ Model switch is backend-only

### 👤 User Side ✅
- [x] **"Awaiting Approval" Page** — ✅ Beautiful page with animated timeline
- [x] **Rejection Message** — ✅ Shows rejection reason on /pending-approval?status=rejected
- [x] **Re-apply Option** — ✅ Re-apply button changes status back to PENDING

---

## 🐛 Bugs / Fixes ✅ ALL DONE
- [x] **Dev Server Cache Fix** — ✅ `npm run dev:clean` script added (auto-deletes `.next` before starting)
- [x] **Hydration Mismatch** — ✅ Fixed: `suppressHydrationWarning` on `<body>`, deprecated meta tag updated
- [x] **Middleware Warning** — ✅ Fixed: `middleware.js` renamed to `proxy.js` (Next.js 16 convention)

---

## ⚙️ Backend / Database
- [ ] **MySQL Connection** — Production DB ka `DATABASE_URL` `.env` mein set karo
- [ ] **Prisma Migrations** — Schema changes ke baad `prisma migrate deploy` run karo
- [ ] **Record Schema** — `findings` field JSON hai, proper validation add karo
- [ ] **User Verification** — College ID card upload ka verification flow banana hai

---

## 🤖 AI Features
- [ ] **TensorFlow Model** — MobileNet ko dental-specific custom model se replace karo (better accuracy)
- [ ] **Gemini Prompt** — X-ray findings se better patient summary generate karne ka prompt improve karo
- [ ] **AI Loading State** — Better loading UI jab AI inference chal raha ho (`LoadingOverlay.jsx`)
- [ ] **Offline AI** — TF model ko PWA cache mein store karo taaki offline bhi kaam kare

### 🎯 Own Custom AI Integration (Apna Model)
- [ ] **Custom dental model train karo** — DENTEX ya similar dental X-ray dataset pe train karo
- [ ] **Model export karo** — TensorFlow.js format (`.json` + `.bin`) mein convert karo
- [ ] **Model host karo** — `/public/models/` folder mein rakho ya alag server pe deploy karo
- [ ] **`/api/analyze/own-model` route banao** — Custom model ka inference endpoint
- [ ] **Model version control** — Admin multiple model versions upload kar sake aur switch kar sake
- [ ] **Performance metrics** — Har model ki accuracy/speed admin ko dikhe

---

## 🎨 UI / Frontend
- [x] **Footer** — ✅ "Made by BIT Buggy Team" add kiya
- [x] **Navbar** — ✅ Mobile responsive fixed (hamburger at 1024px, body scroll lock, auth in mobile menu)
- [x] **Dark/Light Mode** — ✅ Theme toggle tested, FOUC prevention added
- [ ] **3D Tooth Viewer** — `ToothViewer3D.jsx` mein better lighting/materials add karo
- [ ] **Landmarks Page** — Fabric.js canvas pe undo/redo feature add karo

---

## 📄 Pages / Features
- [ ] **Diagnosis Page** — X-ray upload → AI analysis → DB mein save karo (full flow test karo)
- [ ] **Forensics Page** — `forensicData.js` ka data properly display karo
- [ ] **Education Page** — Content complete karo `education/page.js`
- [x] **History Page** — ✅ Delete with confirmation + Export (JSON/CSV) added, extra stat cards
- [ ] **Dashboard** — Charts mein real DB data connect karo (abhi sample data hai?)

---

## 🔐 Auth / Security
- [x] **NextAuth** — ✅ Credentials login verified, JWT session working
- [x] **Protected Routes** — ✅ Verified: proxy.js protects diagnosis, landmarks, forensics, compare, records, history, tooth-chart
- [x] **bcrypt** — ✅ Verified: bcrypt.hash(password, 10) in signup, bcrypt.compare in auth

---

## 📦 Deployment / DevOps
- [ ] **Docker** — `Dockerfile` ready hai, production build test karo
- [ ] **GitHub** — Large files (models, images) Git LFS mein move karo
- [x] **PWA** — ✅ manifest.json + sw.js working, install prompt tested
- [ ] **Environment Variables** — `.env` ka production version set karo (Vercel/Server)
- [x] **Build Test** — ✅ `npm run build` successful — 0 errors, all 18 routes compiled

---

> 💡 **Tip:** Pehle 🐛 Bugs fix karo, phir 🤖 AI features improve karo!

---
*Last Updated: 2026-03-06 11:50 AM*
*Session Progress: 🐛 Bugs ✅ | 🎨 UI ✅ | 📄 History ✅ | 🔐 Auth ✅ | 📦 Build ✅ | 🚨 Admin Platform ✅*
