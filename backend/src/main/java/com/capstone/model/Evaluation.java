package com.capstone.model;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "evaluations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id", nullable = false)
    private Milestone milestone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @Column(name = "total_marks")
    private Double totalMarks;

    @Column(name = "max_marks")
    @Builder.Default
    private Double maxMarks = 100.0;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    /**
     * JSONB rubric scores: e.g.
     * { "innovation": 18, "technical": 22, "documentation": 15, "presentation": 20 }
     * Stored as flexible JSON so rubric can evolve per semester.
     */
    @Type(JsonType.class)
    @Column(name = "feedback_data", columnDefinition = "jsonb")
    private Map<String, Object> feedbackData;

    @Column(name = "is_published")
    @Builder.Default
    private Boolean isPublished = false;

    @CreationTimestamp
    @Column(name = "evaluated_at", updatable = false)
    private LocalDateTime evaluatedAt;
}
