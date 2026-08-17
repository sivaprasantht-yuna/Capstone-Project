package com.capstone.repository;

import com.capstone.model.MemberRemovalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRemovalRequestRepository extends JpaRepository<MemberRemovalRequest, Long> {
    List<MemberRemovalRequest> findByTeamIdOrderByRequestedAtDesc(Long teamId);
    List<MemberRemovalRequest> findByTeamIdAndStatus(Long teamId, MemberRemovalRequest.RemovalRequestStatus status);
    Optional<MemberRemovalRequest> findByTeamIdAndTargetMemberIdAndStatus(
            Long teamId, Long targetMemberId, MemberRemovalRequest.RemovalRequestStatus status);
    boolean existsByTeamIdAndTargetMemberIdAndStatus(
            Long teamId, Long targetMemberId, MemberRemovalRequest.RemovalRequestStatus status);
    List<MemberRemovalRequest> findByStatusOrderByRequestedAtAsc(MemberRemovalRequest.RemovalRequestStatus status);
}
