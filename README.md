# Professional PDCA Software (MSO Style)

This project is a professional-grade PDCA (Plan-Do-Check-Act) management system refactored from a vanilla prototype into a modern React application.

## 🚀 Tech Stack
- **Framework**: React 18
- **Language**: TypeScript
- **Bundler**: Vite
- **Backend**: Express.js with Nodemailer
- **Icons**: Lucide React
- **Styling**: Modern CSS Variables & Responsive Layouts

## 🛠️ Setup & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Email Notifications (Optional)
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Sign up for a free [Mailtrap](https://mailtrap.io) account
3. Get your SMTP credentials from Mailtrap
4. Update `.env` with your credentials:
   ```
   SMTP_USER=your_mailtrap_username
   SMTP_PASS=your_mailtrap_password
   ```

### 3. Start Development Servers
Open **two terminal windows**:

**Terminal 1 - Frontend (Vite)**:
```bash
npm run dev
```

**Terminal 2 - Backend API (Express)**:
```bash
npm run server
```

The frontend will run on `http://localhost:5173` and the backend API on `http://localhost:3001`.

### 4. Build for Production
```bash
npm run build
```

## 📧 Email Notifications
The system sends automated email notifications when:
- Users are assigned to execution actions
- Teams meeting dates are set or changed
- Action due dates are updated

Emails are sent via SMTP (Mailtrap in development). Check the backend terminal for email sending status.

## 📂 Project Structure
- `src/components`: Reusable UI elements
- `src/pages`: Main application views (Cockpit, Workspace, Admin)
- `src/services`: Data handling and business logic
- `src/types`: TypeScript interfaces for the data model
- `src/styles`: Global design tokens and styles
- `server.js`: Express backend API for email notifications
