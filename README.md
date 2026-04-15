# NirmanHack26
# 🏙️ NagarVaani – Smart Grievance Intelligence Platform

NagarVaani is an AI-powered civic grievance platform that aggregates complaints from multiple sources, intelligently processes them, and ensures faster, transparent resolution.

---

## 🚀 Features

* 🔁 **Deduplication & Clustering** – Merge duplicate complaints into a single master ticket
* ⭐ **Aam Aadmi Trust Score (AATS)** – Public accountability scoring system
* 👥 **Crowd Validation** – Citizens verify complaints
* 📸 **AI Proof of Resolution** – Before/after validation using AI + GPS
* 🛡️ **Whistleblower Mode** – Secure anonymous complaints (AES + RSA)
* 🧠 **Intelligent Insights Engine** – Predictive issue detection
* 🌐 **Multilingual Support** – Regional language support
* 🚫 **Spam & Noise Filter** – Regex + AI-based filtering

---

## 📁 Project Structure

```
nagarvaani/
│
├── frontend/        # React + Vite frontend
├── backend/         # Node.js backend
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/tanaygit0530/NirmanHack26.git
cd nagarvaani
```

---

## 💻 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 🌐 Frontend Environment Variables (`frontend/.env`)

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:3001

# Optional: Firebase (Push Notifications)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🖥️ Backend Setup

```bash
cd backend
npm install
npm run dev
```

### 🔐 Backend Environment Variables (`backend/.env`)

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_api_key
WHISTLEBLOWER_SECRET_KEY=your_secret_key

GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password

# Optional: Social Media Ingestion
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password
```

---

## 🧠 How It Works

1. 📡 Collects complaints from web + social media
2. 🧹 Filters spam using regex + AI
3. 🔗 Clusters duplicate complaints
4. 🏷️ Categorizes & prioritizes using AI
5. 📍 Assigns to nearest authority
6. 🛠️ Tracks resolution with proof validation
7. 📊 Generates insights for future prevention

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), TailwindCSS
* **Backend:** Node.js, Express
* **Database:** Supabase
* **AI:** Gemini API
* **Maps:** Leaflet
* **Charts:** Recharts

---

## 📊 Example Flow

* Complaint detected → clustered → prioritized
* Assigned to officer → action initiated
* Issue resolved → validated → citizens notified

---

## 🎯 Goal

To make civic grievance systems:

* Faster ⚡
* Transparent 🔍
* Accountable 📊
* Citizen-driven 👥

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📜 License

This project is for educational and hackathon purposes.

---

## 💡 Tagline

**"This is what transparency looks like."**
