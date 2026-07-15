package com.capstone.repository;

import com.capstone.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByTeamIdOrderByCreatedAtDesc(Long teamId);

    Optional<Event> findTopByTeamIdOrderByCreatedAtDesc(Long teamId);

    @Query("SELECT e FROM Event e WHERE e.team.id = :teamId AND e.createdAt >= :since")
    List<Event> findRecentByTeamId(Long teamId, LocalDateTime since);

    @Query("SELECT DISTINCT e.team.id FROM Event e WHERE e.team IS NOT NULL GROUP BY e.team.id HAVING MAX(e.createdAt) < :threshold")
    List<Long> findTeamIdsWithNoActivitySince(LocalDateTime threshold);
}
