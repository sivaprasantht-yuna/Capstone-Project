package com.capstone.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_contributions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"team_id", "student_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentContribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Team team;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "contribution_percentage")
    @Builder.Default
    private Double contributionPercentage = 0.0;

    @Column(name = "tasks_completed")
    @Builder.Default
    private Integer tasksCompleted = 0;

    @Column(name = "tasks_total")
    @Builder.Default
    private Integer tasksTotal = 0;

    @Column(name = "milestones_contributed")
    @Builder.Default
    private Integer milestonesContributed = 0;

    /** Tracks whether student is still active or a former member */
    @Enumerated(EnumType.STRING)
    @Column(name = "membership_status")
    @Builder.Default
    private MembershipStatus membershipStatus = MembershipStatus.ACTIVE;

    @UpdateTimestamp
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    public enum MembershipStatus {
        ACTIVE, FORMER
    }
}
