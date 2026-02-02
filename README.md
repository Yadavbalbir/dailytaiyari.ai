# 🎯 DailyTaiyari.ai

**India's Premier Exam Preparation Platform**

A production-grade, full-stack exam preparation platform built with Django REST Framework and React. Designed to compete with Unacademy & Byju's — but cleaner, faster, and more focused.

![DailyTaiyari](https://img.shields.io/badge/Version-1.0.0-orange)
![Django](https://img.shields.io/badge/Django-5.0-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

## 🌟 Features

### For Students
- 📚 **Smart Study Plans** - AI-powered daily study recommendations
- ✍️ **Practice Quizzes** - Topic-wise, subject-wise, and PYQ quizzes
- 📝 **Mock Tests** - Full-length exam simulations with detailed analytics
- 📊 **Performance Analytics** - Track progress, identify weak areas
- 🏆 **Gamification** - XP, levels, badges, streaks, and leaderboards
- 🤖 **AI Doubt Solver** - Instant help from AI tutor powered by LLM
- 🔥 **Streak System** - Maintain daily study streaks for motivation

### Supported Exams
- NEET (Medical)
- IIT JEE (Main + Advanced)
- CBSE Class 6-12
- NDA
- *Future: SSC, Banking, UPSC, CUET*

## 🏗️ Architecture

```
DailyTaiyari/
├── backend/                    # Django REST Framework
│   ├── dailytaiyari/          # Main project settings
│   ├── core/                   # Base models & utilities
│   ├── users/                  # Authentication & profiles
│   ├── exams/                  # Exam, Subject, Topic models
│   ├── content/                # Study materials & plans
│   ├── quiz/                   # Questions, quizzes, mock tests
│   ├── analytics/              # Performance tracking
│   ├── gamification/           # XP, badges, leaderboards
│   └── chatbot/                # AI doubt solver
│
├── frontend/                   # React + Tailwind CSS
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── context/           # State management (Zustand)
│   │   ├── services/          # API service layer
│   │   └── styles/            # Global styles
│   └── public/                # Static assets
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (optional, SQLite for development)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
SECRET_KEY=your-secret-key-here
DEBUG=True
OPENAI_API_KEY=your-openai-api-key  # For AI chatbot
EOF

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1/
- API Docs: http://localhost:8000/api/docs/
- Admin: http://localhost:8000/admin/

## 📱 Screen Flow

### 1. Authentication
- Login / Register with email
- Smart onboarding with exam selection
- Grade and study preferences setup

### 2. Dashboard (Most Important)
- Today's study plan with progress
- Daily/weekly goal tracking
- Streak indicator 🔥
- Quick action buttons
- Weak topics for revision
- AI chatbot CTA

### 3. Study Section
- Subject → Topic → Content hierarchy
- Notes, videos, PDFs, formula sheets
- Progress tracking per content

### 4. Quiz Engine
- Multiple quiz types (topic, subject, daily challenge, PYQ)
- Timer with visual feedback
- Color-coded answer options
- Post-quiz analytics
- XP rewards

### 5. Mock Tests
- Full exam simulation
- Section-wise navigation
- Rank and percentile after submission

### 6. Analytics
- Accuracy trends (line charts)
- Questions per day (bar charts)
- Topic mastery distribution (pie chart)
- Weak/strong topics identification
- Weekly reports

### 7. Leaderboard
- Daily/Weekly/Monthly/All-time tabs
- Exam-wise filtering
- Rank with change indicators
- User badges showcase

### 8. AI Doubt Solver
- Chat interface with AI tutor
- Session management
- FAQ suggestions
- Save helpful responses

## 🎨 Design System

### Colors
```css
Primary: #f97316 (Orange)
Accent: #d946ef (Magenta)
Success: #10b981 (Green)
Warning: #f59e0b (Amber)
Error: #ef4444 (Red)
```

### Typography
- Display: Clash Display / Outfit
- Body: Outfit
- Mono: JetBrains Mono

### Components
- Cards with subtle shadows and rounded corners
- Gradient buttons with hover effects
- Progress rings and bars
- Streak fire animations
- Glass morphism effects

## 🔌 API Endpoints

### Authentication
```
POST /api/v1/auth/register/      # User registration
POST /api/v1/auth/login/         # JWT login
POST /api/v1/auth/refresh/       # Refresh token
POST /api/v1/auth/onboarding/    # Complete onboarding
GET  /api/v1/auth/profile/       # Get profile
```

### Exams & Content
```
GET  /api/v1/exams/              # List exams
GET  /api/v1/exams/{id}/subjects/   # Exam subjects
GET  /api/v1/content/            # List content
GET  /api/v1/content/study-plans/today/  # Today's plan
```

### Quiz & Mock Tests
```
GET  /api/v1/quiz/quizzes/       # List quizzes
POST /api/v1/quiz/quizzes/{id}/start/    # Start quiz
POST /api/v1/quiz/quizzes/{id}/submit/   # Submit quiz
GET  /api/v1/quiz/mock-tests/    # List mock tests
```

### Analytics
```
GET  /api/v1/analytics/dashboard/    # Dashboard stats
GET  /api/v1/analytics/topic-mastery/    # Topic mastery
GET  /api/v1/analytics/streaks/current/  # Current streak
```

### Gamification
```
GET  /api/v1/gamification/leaderboard/   # Leaderboard
GET  /api/v1/gamification/my-badges/     # User badges
GET  /api/v1/gamification/xp-history/    # XP transactions
```

### AI Chatbot
```
POST /api/v1/chatbot/sessions/           # Create session
POST /api/v1/chatbot/sessions/{id}/send_message/  # Send message
GET  /api/v1/chatbot/faq/                # FAQ list
```

## 📊 Data Models

### Core Entities
- **User** - Custom user with email auth
- **StudentProfile** - Extended profile with preferences
- **Exam** - NEET, JEE, CBSE, etc.
- **Subject** - Physics, Chemistry, Math, etc.
- **Topic** - Hierarchical topics within subjects

### Content System
- **Content** - Notes, videos, PDFs
- **ContentProgress** - User progress tracking
- **StudyPlan** - Daily study plans
- **StudyPlanItem** - Individual plan items

### Quiz System
- **Question** - MCQ, numerical, fill-blank
- **QuestionOption** - Answer options
- **Quiz** - Quiz configuration
- **MockTest** - Full mock tests
- **QuizAttempt/MockTestAttempt** - User attempts
- **Answer** - Individual answers

### Analytics
- **TopicMastery** - Per-topic mastery levels
- **SubjectPerformance** - Subject-level stats
- **DailyActivity** - Daily activity logs
- **Streak** - Streak tracking
- **WeeklyReport** - Weekly summaries

### Gamification
- **Badge** - Achievement badges
- **StudentBadge** - Earned badges
- **XPTransaction** - XP history
- **LeaderboardEntry** - Leaderboard rankings
- **Challenge** - Special challenges

### Chatbot
- **ChatSession** - Chat sessions
- **ChatMessage** - Individual messages
- **SavedResponse** - Bookmarked responses
- **FrequentQuestion** - FAQ database

## 🔒 Security

- JWT authentication with refresh tokens
- Rate limiting on quiz submissions
- CORS configuration
- Input validation on all endpoints
- SQL injection prevention via ORM

## 🚢 Deployment

### Docker (Recommended)

```dockerfile
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/dailytaiyari
      
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
      
  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Environment Variables

```bash
# Backend
SECRET_KEY=your-secret-key
DEBUG=False
DATABASE_URL=postgres://...
OPENAI_API_KEY=sk-...
REDIS_URL=redis://...

# Frontend
VITE_API_URL=https://api.dailytaiyari.ai
```

## 📈 MVP vs Phase-2

### MVP (Current)
- ✅ Authentication & Onboarding
- ✅ Dashboard with study plan
- ✅ Quiz & Mock test engine
- ✅ Basic analytics
- ✅ XP & Leaderboard
- ✅ AI Doubt Solver

### Phase-2 (Roadmap)
- 🔲 Video courses with progress
- 🔲 Live classes integration
- 🔲 Discussion forums
- 🔲 Mentorship matching
- 🔲 Offline mode (PWA)
- 🔲 Parent dashboard
- 🔲 School/coaching partnerships
- 🔲 Advanced ML recommendations
- 🔲 Payment & subscriptions

## 🤝 Contributing

This is a proprietary project. For partnership inquiries, contact support@dailytaiyari.ai

## 📄 License

Copyright © 2024 DailyTaiyari. All rights reserved.

---

**Built with ❤️ for Indian students**

*Ace Your Exams with DailyTaiyari!* 🚀

