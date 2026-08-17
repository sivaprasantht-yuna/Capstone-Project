package com.capstone.repository;

import com.capstone.model.TeamDismantleRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeamDismantleRequestRepository extends JpaRepository<TeamDismantleRequest, Long> {
    List<TeamDismantleRequest> findByTeamIdOrderByRequestedAtDesc(Long teamId);
    Optional<TeamDismantleRequest> findByTeamIdAndStatus(Long teamId, TeamDismantleRequest.DismantleRequestStatus status);
    boolean existsByTeamIdAndStatus(Long teamId, TeamDismantleRequest.DismantleRequestStatus status);
    List<TeamDismantleRequest> findByStatusOrderByRequestedAtAsc(TeamDismantleRequest.DismantleRequestStatus status);
}
