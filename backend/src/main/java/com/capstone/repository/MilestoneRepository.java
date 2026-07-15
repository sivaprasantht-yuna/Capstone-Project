package com.capstone.repository;

import com.capstone.model.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, Long> {

    List<Milestone> findByTeamIdOrderBySequenceOrder(Long teamId);

    @Query("SELECT m FROM Milestone m WHERE m.dueDate < :today AND m.status NOT IN ('APPROVED', 'SUBMITTED', 'UNDER_REVIEW')")
    List<Milestone> findOverdueMilestones(LocalDate today);

    @Query("SELECT m FROM Milestone m WHERE m.team.id = :teamId AND m.status = 'PENDING' AND m.dueDate >= :today ORDER BY m.dueDate ASC")
    List<Milestone> findUpcomingMilestonesForTeam(Long teamId, LocalDate today);
}
