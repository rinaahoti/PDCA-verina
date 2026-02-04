// Notification Service for Email API Integration

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface EmailRecipient {
    userId: string;
    userName: string;
    email: string;
}

export interface ActionDetails {
    title: string;
    topicTitle?: string;
    description?: string;
    dueDate?: string;
    teamsMeeting?: string;
    teamsMeetingLink?: string;
    owner?: string;
}

export interface EmailNotificationRequest {
    recipients: EmailRecipient[];
    subject?: string;
    body?: string;
    actionDetails?: ActionDetails;
}

export interface EmailResult {
    recipient: string;
    userName: string;
    success: boolean;
    messageId?: string;
    error?: string;
}

export interface EmailNotificationResponse {
    success: boolean;
    message: string;
    results: EmailResult[];
    summary: {
        total: number;
        successful: number;
        failed: number;
    };
}

class NotificationService {
    /**
     * Send email notifications to assigned persons
     */
    async sendActionAssignmentEmails(
        request: EmailNotificationRequest
    ): Promise<EmailNotificationResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send email notifications');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Email notification error:', error);
            throw error;
        }
    }

    /**
     * Check if the notification service is available
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`);
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
}

export const notificationService = new NotificationService();
