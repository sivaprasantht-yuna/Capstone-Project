package com.capstone.repository;

import com.capstone.model.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    Optional<Evaluation> findByMilestoneId(Long milestoneId);

    @Query("SELECT AVG(e.totalMarks) FROM Evaluation e WHERE e.milestone.team.id = :teamId AND e.isPublished = true")
    Double findAverageScoreForTeam(Long teamId);
}
