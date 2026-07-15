package com.capstone.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "mentorships")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Mentorship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "faculty_id", nullable = false)
    private User faculty;

    /**
     * Cosine similarity score (0.0–1.0) computed by Python matching service.
     * Stored so it can be shown on the UI to justify the recommendation.
     */
    @Column(name = "match_score")
    private Double matchScore;

    /** JSON array of skills that overlapped between team and faculty. */
    @Column(name = "matching_skills", columnDefinition = "TEXT")
    private String matchingSkillsJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MentorshipStatus status = MentorshipStatus.PENDING;

    /** Team's rating for mentor helpfulness (1–5) */
    @Column(name = "team_rating_for_mentor")
    private Integer teamRatingForMentor;

    /** Mentor's rating for team engagement (1–5) */
    @Column(name = "mentor_rating_for_team")
    private Integer mentorRatingForTeam;

    @CreationTimestamp
    @Column(name = "requested_at", updatable = false)
    private LocalDateTime requestedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum MentorshipStatus {
        PENDING, ACCEPTED, REJECTED, COMPLETED
    }
}
