# Email Notification Setup Guide

## Overview
The MSO Maestro PDCA system now sends real email notifications when users are assigned to execution actions. This guide will help you set up and test the email functionality.

## Prerequisites
- Node.js installed
- MSO Maestro PDCA application running
- Mailtrap account (free) for development testing

## Setup Steps

### 1. Get Mailtrap Credentials
1. Go to [https://mailtrap.io](https://mailtrap.io)
2. Sign up for a free account
3. Navigate to **Email Testing** → **Inboxes**
4. Click on your inbox (or create a new one)
5. Go to **SMTP Settings** tab
6. Copy your credentials:
   - **Host**: `sandbox.smtp.mailtrap.io`
   - **Port**: `2525`
   - **Username**: (your username)
   - **Password**: (your password)

### 2. Configure Environment Variables
1. Open the `.env` file in the project root
2. Update the SMTP credentials:
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_actual_username
   SMTP_PASS=your_actual_password
   SMTP_FROM="MSO Maestro PDCA" <noreply@msomaestro.com>
   ```
3. Save the file

### 3. Start Both Servers

**Terminal 1 - Frontend**:
```bash
npm run dev
```

**Terminal 2 - Backend API**:
```bash
npm run server
```

You should see:
```
🚀 MSO Maestro API Server running on http://localhost:3001
📧 SMTP configured: Yes
📬 SMTP Host: sandbox.smtp.mailtrap.io
```

## Testing Email Notifications

### Test Scenario 1: Assign Action to User
1. Open the application at `http://localhost:5173`
2. Go to **Cockpit**
3. Open a topic in the **DO** phase
4. Click **+ Add Action**
5. Fill in:
   - **Action Title**: "Review Implementation"
   - **Description**: "Review the code changes"
   - **Assign Person**: Select a user (e.g., "Sophia Mayer")
   - **Teams Meeting**: Select a date/time
   - **Due Date**: Select a date
6. Click **Save** at the top
7. Watch for the notification toast in the top right:
   - ✓ Success: Green toast with "X email(s) sent successfully"
   - ⚠ Warning: Yellow toast if some failed
   - ✗ Error: "Email service unavailable" if backend is down

### Test Scenario 2: Check Mailtrap Inbox
1. Go back to your Mailtrap inbox
2. Refresh the page
3. You should see the email(s) sent
4. Click to view the email content
5. Verify:
   - Subject: `[MSO Maestro] Action Assignment: [Topic Title]`
   - Recipient: The assigned user's email
   - Content: Action details, Teams meeting, due date, etc.

### Test Scenario 3: Multiple Assignments
1. Create an action with **multiple people** assigned
2. Save the topic
3. Check Mailtrap - you should see **one email per person**
4. The toast will show the total count (e.g., "3 email(s) sent successfully")

## Troubleshooting

### "Email service unavailable" Error
**Cause**: Backend server is not running or not reachable.

**Solution**:
1. Check if `npm run server` is running in Terminal 2
2. Verify the server shows "🚀 MSO Maestro API Server running"
3. Test the health endpoint: `http://localhost:3001/api/health`

### "X email(s) failed to send" Warning
**Cause**: SMTP credentials are incorrect or Mailtrap is down.

**Solution**:
1. Double-check your `.env` file credentials
2. Restart the backend server: `Ctrl+C` then `npm run server`
3. Verify SMTP settings in Mailtrap dashboard
4. Check backend terminal for detailed error messages

### No Emails in Mailtrap
**Cause**: No users were assigned, or email sending was skipped.

**Solution**:
1. Ensure you assigned at least one person to the action
2. Check the backend terminal for log messages like:
   ```
   ✓ Email sent to Sophia Mayer (u1@company.com)
   ```
3. Refresh your Mailtrap inbox

### Backend Won't Start
**Cause**: Port 3001 is already in use.

**Solution**:
1. Change the port in `.env`:
   ```env
   PORT=3002
   ```
2. Update the frontend API URL if needed (currently defaults to 3001)

## Email Content Customization

To customize the email template, edit `server.js`:

```javascript
// Find the mailOptions section (around line 45)
html: `
    <!-- Your custom HTML email template here -->
`
```

## Production Deployment

For production, replace Mailtrap with a real SMTP service:
- **AWS SES** (Amazon Simple Email Service)
- **SendGrid**
- **Mailgun**
- **Your company's SMTP server**

Update `.env` with production credentials:
```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_production_user
SMTP_PASS=your_production_password
SMTP_FROM="MSO Maestro" <noreply@yourcompany.com>
```

## API Endpoint Reference

### POST /api/notifications/email
Send email notifications to assigned users.

**Request Body**:
```json
{
  "recipients": [
    {
      "userId": "u1",
      "userName": "Sophia Mayer",
      "email": "sophia@company.com"
    }
  ],
  "subject": "[MSO Maestro] Action Assignment",
  "body": "You have been assigned to an action...",
  "actionDetails": {
    "title": "Review Code",
    "topicTitle": "Q1 Process Improvement",
    "description": "Review implementation",
    "dueDate": "2026-02-15",
    "teamsMeeting": "2026-02-10T14:00:00",
    "owner": "Sophia Mayer"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Sent 1 email(s), 0 failed",
  "results": [
    {
      "recipient": "sophia@company.com",
      "userName": "Sophia Mayer",
      "success": true,
      "messageId": "<unique-id@mailtrap.io>"
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0
  }
}
```

### GET /api/health
Check if the email service is configured and running.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-04T15:30:00.000Z",
  "smtp": {
    "configured": true,
    "host": "sandbox.smtp.mailtrap.io",
    "port": "2525"
  }
}
```

## Support
For issues or questions, check the backend terminal logs for detailed error messages.
