package com.capstone.repository;

import com.capstone.model.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamIdAndInviteStatus(Long teamId, TeamMember.InviteStatus status);
    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);
    boolean existsByTeamIdAndUserId(Long teamId, Long userId);
    List<TeamMember> findByUserId(Long userId);
    List<TeamMember> findByTeamIdAndMembershipStatus(Long teamId, TeamMember.MembershipStatus status);
    List<TeamMember> findByUserIdAndMembershipStatusIn(Long userId, List<TeamMember.MembershipStatus> statuses);
    List<TeamMember> findByUserIdAndInviteStatus(Long userId, TeamMember.InviteStatus inviteStatus);
    long countByTeamIdAndInviteStatus(Long teamId, TeamMember.InviteStatus status);
}

