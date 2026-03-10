# OpenClaw Hackathon Management System

A full-stack hackathon management system with participant registration, judge evaluation, and real-time leaderboard.

## Features

### For Participants
- Register with personal and project information
- Upload PDF proposals and demo videos
- Submit project URLs and GitHub repositories
- Automatic PDF text extraction and storage

### For Judges
- Secure password-based login
- View all participant submissions
- Preview PDFs and videos inline
- Score projects across multiple dimensions (Innovation, Technical, Market, Demo)
- View real-time leaderboard with weighted scores

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS with custom dark theme
- Framer Motion for animations
- React Router for navigation
- Axios for API calls
- React Dropzone for file uploads

### Backend
- FastAPI (Python)
- Supabase for database
- JWT authentication
- File upload handling
- PDF text extraction

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Supabase account

### 1. Supabase Setup

Create a new Supabase project and run these SQL commands:

\`\`\`sql
-- Create participants table
CREATE TABLE participants (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  organization TEXT NOT NULL,
  github TEXT,
  project_title TEXT NOT NULL,
  project_description TEXT NOT NULL,
  demo_url TEXT,
  repo_url TEXT,
  pdf_path TEXT,
  video_path TEXT,
  pdf_text TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scores table
CREATE TABLE scores (
  id BIGSERIAL PRIMARY KEY,
  participant_id BIGINT REFERENCES participants(id),
  innovation_score DECIMAL(3,1) NOT NULL,
  technical_score DECIMAL(3,1) NOT NULL,
  market_score DECIMAL(3,1) NOT NULL,
  demo_score DECIMAL(3,1) NOT NULL,
  weighted_score DECIMAL(3,2) NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_participants_status ON participants(status);
CREATE INDEX idx_scores_participant ON scores(participant_id);
\`\`\`

### 2. Backend Setup

\`\`\`bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your credentials:
# SUPABASE_URL=your_supabase_project_url
# SUPABASE_KEY=your_supabase_anon_key
# JUDGE_PASSWORD=your_secure_password
# SECRET_KEY=your_jwt_secret_key

# Run the server
python main.py
\`\`\`

The backend will run on http://localhost:8000

### 3. Frontend Setup

\`\`\`bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

The frontend will run on http://localhost:3000

## Usage

### Landing Page
1. Visit http://localhost:5173 (Vite default port)
2. Choose your role: **参赛者 (Participant)** or **评委 (Judge)**

### Participant Flow
1. Click "参赛者" on the landing page
2. Fill in personal information (name, email, organization, GitHub)
3. Add project details (title and description)
4. Upload project proposal (PDF, max 10MB) and demo video (MP4/MOV, max 100MB)
5. Add optional demo URL and GitHub repository
6. Accept terms and submit registration

### Judge Flow
1. Click "评委" on the landing page
2. Enter judge password (default: judge123)
3. View participant dashboard with filtering and search
4. Click "查看详情" on any project card to score it
5. Rate across 4 dimensions with sliders (0-10 scale)
6. Add optional comments and submit score
7. View real-time leaderboard with 3D podium display

## API Endpoints

### Participants
- `POST /api/participants/register` - Register new participant
- `GET /api/judges/participants` - Get all participants
- `GET /api/judges/participants/:id` - Get specific participant

### Judges
- `POST /api/judges/login` - Judge authentication
- `POST /api/judges/score` - Submit scores
- `GET /api/judges/leaderboard` - Get ranked leaderboard

### Files
- `GET /api/files/:type/:filename` - Retrieve uploaded files

## Scoring System

Projects are scored across 4 dimensions:
- **Innovation (30%)**: Novelty and creativity
- **Technical (30%)**: Implementation quality
- **Market (20%)**: Commercial viability
- **Demo (20%)**: Presentation quality

Final score = (Innovation × 0.3) + (Technical × 0.3) + (Market × 0.2) + (Demo × 0.2)

## Design System

- **Primary Color**: #ff5833 (Orange)
- **Dark Background**: #181210
- **Font**: Space Grotesk
- **Theme**: Dark mode with glass morphism effects

## Project Structure

\`\`\`
openclaw-hackathon/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ParticipantRegistration.jsx
│   │   │   ├── JudgeLogin.jsx
│   │   │   ├── JudgeDashboard.jsx
│   │   │   ├── JudgeScoring.jsx
│   │   │   └── Leaderboard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── backend/
    ├── main.py
    ├── requirements.txt
    └── .env
\`\`\`

## Security Notes

- Judge password is stored as environment variable
- JWT tokens for session management
- File uploads are validated and stored securely
- CORS configured for localhost development

## Future Enhancements

- Email notifications
- Multi-round judging
- Team management
- Export results to CSV
- Admin dashboard
- Real-time updates with WebSockets

## License

MIT License - feel free to use for your hackathon!
