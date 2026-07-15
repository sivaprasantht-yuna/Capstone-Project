package com.capstone.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type")
    private NotificationType notificationType;

    @Column(name = "reference_id")
    private Long referenceId;   // e.g. teamId, milestoneId for deep-linking

    @Column(name = "reference_type", length = 50)
    private String referenceType; // "TEAM", "MILESTONE", "MENTORSHIP"

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum NotificationType {
        TEAM_INVITE, MENTOR_REQUEST, MENTOR_ACCEPTED, MENTOR_REJECTED,
        MILESTONE_DUE, MILESTONE_REVIEWED, GRADE_PUBLISHED,
        CHAT_MESSAGE, AT_RISK_FLAG, CERTIFICATE_READY,
        IDEA_APPROVED, IDEA_REJECTED, SYSTEM
    }
}
