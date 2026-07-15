package com.capstone.notification;

import com.capstone.model.Notification.NotificationType;

/**
 * ═══════════════════════════════════════════════════════════════════
 * DESIGN PATTERN: Creational — Builder Pattern
 * ═══════════════════════════════════════════════════════════════════
 *
 * PROBLEM:
 *   NotificationService.sendNotification() accepted 5 positional
 *   parameters, making call-sites fragile and hard to read:
 *
 *   notificationService.sendNotification(userId, message, type, refId, refType);
 *
 * SOLUTION:
 *   A fluent Builder that constructs a NotificationRequest object.
 *   Call sites now read like sentences:
 *
 *   NotificationRequest.to(userId)
 *       .message("You've been invited!")
 *       .type(NotificationType.TEAM_INVITE)
 *       .reference(teamId, "TEAM")
 *       .build();
 *
 * PARTICIPANTS:
 *   - Builder: NotificationRequest (inner static Builder class)
 *   - Product: NotificationRequest
 *   - Director: Service classes (TeamService, MentorshipService, etc.)
 * ═══════════════════════════════════════════════════════════════════
 */
public class NotificationRequest {

    private final Long       recipientId;
    private final String     message;
    private final NotificationType type;
    private final Long       referenceId;
    private final String     referenceType;

    private NotificationRequest(Builder builder) {
        this.recipientId   = builder.recipientId;
        this.message       = builder.message;
        this.type          = builder.type;
        this.referenceId   = builder.referenceId;
        this.referenceType = builder.referenceType;
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public Long getRecipientId()   { return recipientId; }
    public String getMessage()     { return message; }
    public NotificationType getType() { return type; }
    public Long getReferenceId()   { return referenceId; }
    public String getReferenceType() { return referenceType; }

    // ── Entry point ───────────────────────────────────────────────────────────

    /** Factory method — starts the builder chain: NotificationRequest.to(userId) */
    public static Builder to(Long recipientId) {
        return new Builder(recipientId);
    }

    // ── Builder ───────────────────────────────────────────────────────────────

    public static class Builder {

        private final Long recipientId;
        private String     message;
        private NotificationType type = NotificationType.SYSTEM;
        private Long       referenceId;
        private String     referenceType;

        private Builder(Long recipientId) {
            if (recipientId == null) {
                throw new IllegalArgumentException("recipientId must not be null");
            }
            this.recipientId = recipientId;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public Builder type(NotificationType type) {
            this.type = type;
            return this;
        }

        /** Convenience method to set both referenceId and referenceType together */
        public Builder reference(Long referenceId, String referenceType) {
            this.referenceId   = referenceId;
            this.referenceType = referenceType;
            return this;
        }

        public NotificationRequest build() {
            if (message == null || message.isBlank()) {
                throw new IllegalStateException("Notification message must not be empty");
            }
            return new NotificationRequest(this);
        }
    }
}
