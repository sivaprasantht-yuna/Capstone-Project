package com.capstone.repository;

import com.capstone.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    Optional<Team> findByProjectId(Long projectId);

    List<Team> findByStatus(Team.TeamStatus status);

    @Query("SELECT t FROM Team t JOIN t.members m WHERE m.user.id = :userId AND m.inviteStatus = 'ACCEPTED'")
    List<Team> findTeamsByMemberId(Long userId);

    @Query("SELECT t FROM Team t JOIN t.mentorships ms WHERE ms.faculty.id = :facultyId AND ms.status = 'ACCEPTED'")
    List<Team> findTeamsByMentorId(Long facultyId);

    @Query("SELECT t FROM Team t WHERE t.status = 'ACTIVE' AND " +
           "(t.lastActivityAt < :threshold OR t.lastActivityAt IS NULL)")
    List<Team> findInactiveTeams(LocalDateTime threshold);

    @Query("SELECT t FROM Team t WHERE t.isAtRisk = true")
    List<Team> findAtRiskTeams();

    @Query("SELECT t FROM Team t ORDER BY t.totalScore DESC")
    List<Team> findAllOrderByScore();

    @Query("SELECT COUNT(t) FROM Team t WHERE t.status = :status")
    long countByStatus(Team.TeamStatus status);
}
