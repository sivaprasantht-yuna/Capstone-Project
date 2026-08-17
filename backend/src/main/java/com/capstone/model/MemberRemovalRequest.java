package com.capstone.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "member_removal_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MemberRemovalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Team team;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "target_member_id", nullable = false)
    private User targetMember;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RemovalRequestStatus status = RemovalRequestStatus.PENDING;

    /** Snapshot of student's contribution at time of request */
    @Column(name = "contribution_summary", columnDefinition = "TEXT")
    private String contributionSummary;

    @Column(name = "mentor_comment", columnDefinition = "TEXT")
    private String mentorComment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @CreationTimestamp
    @Column(name = "requested_at", updatable = false)
    private LocalDateTime requestedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public enum RemovalRequestStatus {
        PENDING, APPROVED, REJECTED
    }
}
