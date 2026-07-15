package com.capstone.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "milestones")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Milestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MilestoneStatus status = MilestoneStatus.PENDING;

    /** Points awarded to team on on-time completion */
    @Column(name = "points_reward")
    @Builder.Default
    private Integer pointsReward = 10;

    /** Order of this milestone in the timeline (1=Review1, 2=Review2, 3=Final) */
    @Column(name = "sequence_order")
    private Integer sequenceOrder;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @OneToMany(mappedBy = "milestone", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Submission> submissions = new ArrayList<>();

    @OneToOne(mappedBy = "milestone", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Evaluation evaluation;

    public enum MilestoneStatus {
        PENDING, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, OVERDUE
    }
}
