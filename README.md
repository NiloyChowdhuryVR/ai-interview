# 🎙️ AI Voice Interviewer

![AI Interviewer Banner](/public/banner.png) <!-- Feel free to add an actual banner screenshot here -->

An advanced, fully autonomous **Voice-to-Voice AI Interviewer** built with Next.js, React, and Google Gemini. Practice for your dream job with real-time, adaptive technical and behavioral interviews tailored to top tech companies (Google, Amazon, Meta, Microsoft, and more).

## ✨ Key Features

- **📄 Smart Resume Parsing:** Upload your PDF resume, and the AI will extract your skills, experience, and projects to tailor the interview precisely to your background.
- **🏢 Company-Specific Modes:** Select from major companies like Google, Meta, Microsoft, Amazon, or entry-level modes like TCS Ninja. The AI adapts its strictness, question types (e.g., Amazon Leadership Principles), and difficulty accordingly.
- **🗣️ Real-time Voice Interaction:** Completely hands-free. The AI speaks to you using realistic Speech Synthesis, and listens to your answers using the Web Speech API.
- **🧠 Adaptive Follow-ups:** The AI doesn't just read from a list. It analyzes your answers in real-time and asks deep, technical follow-up questions to test the limits of your knowledge.
- **📊 Comprehensive Feedback:** After the interview, receive a detailed breakdown of your performance, including an overall score, round-by-round metrics, strengths, weaknesses, and actionable improvements.
- **⚙️ Multi-Key API Rotation:** Engineered with a robust backend that automatically cycles through multiple Gemini API keys to gracefully bypass rate limits and ensure uninterrupted interviews.
- **🎨 Premium UI/UX:** Built with a stunning dark-mode glassmorphic aesthetic featuring custom loading states, micro-animations, and a highly responsive design.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Frontend Library:** React 19
- **State Management:** Zustand
- **AI Brain:** Google Gemini API (Gemini 2.5 Flash & 2.0 Flash)
- **Audio Processing:** Native Browser Web Speech API (STT & TTS)
- **Styling:** CSS Modules & TailwindCSS
- **Resume Processing:** `pdf-parse`

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/ai-interviewer.git
cd ai-interviewer
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Google Gemini API keys. You can add multiple keys to enable automatic rate-limit bypassing!

```env
# Get free keys at: https://aistudio.google.com/apikey
GEMINI_API_KEY_1=your_api_key_here
GEMINI_API_KEY_2=your_second_api_key_here
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to start your AI interview.

## 🌐 Deployment
This project is fully optimized for zero-config deployment on Vercel.
1. Push your code to GitHub.
2. Import the project in your Vercel Dashboard.
3. Add your `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, etc. to the Environment Variables settings.
4. Deploy!

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
