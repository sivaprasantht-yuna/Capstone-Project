package com.capstone.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "team_members")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Team team;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "role_in_team", length = 100)
    private String roleInTeam;  // e.g. "Team Lead", "Frontend Dev", "Data Analyst"

    // ─── Invitation state (original flow) ────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "invite_status", nullable = false)
    @Builder.Default
    private InviteStatus inviteStatus = InviteStatus.PENDING;

    @Column(name = "invite_message", columnDefinition = "TEXT")
    private String inviteMessage; // optional message from team leader

    // ─── Membership lifecycle state (post-join) ─────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "membership_status")
    @Builder.Default
    private MembershipStatus membershipStatus = MembershipStatus.ACTIVE;

    @Column(name = "removal_reason", columnDefinition = "TEXT")
    private String removalReason;

    @Column(name = "removed_at")
    private LocalDateTime removedAt;

    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;

    public enum InviteStatus {
        PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED
    }

    public enum MembershipStatus {
        ACTIVE,             // currently in the team
        REMOVAL_REQUESTED,  // leader has requested removal (awaiting mentor)
        REMOVED,            // formally removed from team
        LEFT,               // voluntarily left
        FORMER_MEMBER       // historical record
    }
}
