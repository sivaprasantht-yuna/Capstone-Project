package com.capstone.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String domain;    // e.g. "IoT", "ML/AI", "Web", "Embedded Systems"

    @Column(name = "tech_stack", length = 500)
    private String techStack; // comma-separated

    @Column(name = "max_team_size")
    @Builder.Default
    private Integer maxTeamSize = 4;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.OPEN;

    @Column(name = "is_industry_proposed")
    @Builder.Default
    private Boolean isIndustryProposed = false;

    @Column(name = "upvote_count")
    @Builder.Default
    private Integer upvoteCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "posted_by", nullable = false)
    private User postedBy;

    @OneToOne(mappedBy = "project", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Team team;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Idea similarity score set by matching service on submission
    @Column(name = "similarity_score")
    private Double similarityScore;

    @Column(name = "similarity_flag")
    @Builder.Default
    private Boolean similarityFlag = false;

    @Column(name = "reference_summary", columnDefinition = "TEXT")
    private String referenceSummary;

    public enum ProjectStatus {
        OPEN,           // posted, awaiting admin approval
        PENDING_REVIEW, // submitted to admin for approval
        APPROVED,       // admin approved, open for team formation
        IN_PROGRESS,    // team formed + mentor matched
        COMPLETED,      // project finished + evaluated
        REJECTED        // admin rejected
    }
}
