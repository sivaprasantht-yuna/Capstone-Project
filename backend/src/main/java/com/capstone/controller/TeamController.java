package com.capstone.controller;

import com.capstone.model.*;
import com.capstone.repository.UserRepository;
import com.capstone.service.TeamService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
@Tag(name = "Teams", description = "Team formation, invites, and workspace management")
public class TeamController {

    private final TeamService teamService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Team> createTeam(
            @RequestBody CreateTeamRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        User leader = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(teamService.createTeamWithProject(req, leader));
    }

    @GetMapping("/open")
    public ResponseEntity<List<OpenTeamDto>> getOpenTeams() {
        return ResponseEntity.ok(teamService.getOpenTeams());
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Team>> getMyTeams(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(teamService.getTeamsForUser(user.getId()));
    }

    @GetMapping("/{teamId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Team> getTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamService.getTeamById(teamId));
    }

    @GetMapping("/available-students")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAvailableStudents(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(teamService.getAvailableStudents(user.getId()));
    }

    @GetMapping("/students/{studentId}/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getStudentProfile(@PathVariable Long studentId) {
        return ResponseEntity.ok(teamService.getStudentProfile(studentId));
    }

    @GetMapping("/{teamId}/join-requests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getJoinRequests(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamService.getPendingRequests(teamId));
    }

    @PostMapping("/{teamId}/join-request")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> requestToJoin(
            @PathVariable Long teamId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(teamService.requestToJoin(teamId, user.getId()));
    }

    @PostMapping("/{teamId}/invite/{inviteeId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TeamMember> inviteMember(
            @PathVariable Long teamId,
            @PathVariable Long inviteeId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User inviter = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(teamService.inviteMember(teamId, inviteeId, inviter.getId()));
    }

    @PatchMapping("/{teamId}/join-requests/{applicantId}/respond")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TeamMember> respondToJoinRequest(
            @PathVariable Long teamId,
            @PathVariable Long applicantId,
            @RequestParam boolean accept) {
        return ResponseEntity.ok(teamService.respondToJoinRequest(teamId, applicantId, accept));
    }

    @PatchMapping("/{teamId}/invite/respond")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TeamMember> respondToInvite(
            @PathVariable Long teamId,
            @RequestParam(required = false) Long applicantId,
            @RequestParam boolean accept,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (applicantId != null) {
            return ResponseEntity.ok(teamService.respondToJoinRequest(teamId, applicantId, accept));
        }

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(teamService.respondToInvite(teamId, user.getId(), accept));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<Team>> getLeaderboard() {
        return ResponseEntity.ok(teamService.getLeaderboard());
    }

    @GetMapping("/at-risk")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<List<Team>> getAtRiskTeams() {
        return ResponseEntity.ok(teamService.getAtRiskTeams());
    }

    // ─── Dismantle Team (direct, pre-mentor) ──────────────────────────────────

    @PostMapping("/{teamId}/dismantle")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Team> dismantleTeam(
            @PathVariable Long teamId,
            @RequestBody ReasonRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(teamService.dismantleTeamDirect(teamId, user.getId(), req.getReason()));
    }

    // ─── Dismantle Request (post-mentor) ──────────────────────────────────────

    @PostMapping("/{teamId}/dismantle-request")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TeamDismantleRequest> requestDismantle(
            @PathVariable Long teamId,
            @RequestBody ReasonRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(teamService.requestTeamDismantle(teamId, user.getId(), req.getReason()));
    }

    @PostMapping("/{teamId}/dismantle-request/{requestId}/approve")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<Team> approveDismantleRequest(
            @PathVariable Long teamId,
            @PathVariable Long requestId,
            @RequestBody(required = false) CommentRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User mentor = getUser(userDetails);
        return ResponseEntity.ok(teamService.approveDismantleRequest(requestId, mentor.getId(),
                req != null ? req.getComment() : null));
    }

    @PostMapping("/{teamId}/dismantle-request/{requestId}/reject")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<TeamDismantleRequest> rejectDismantleRequest(
            @PathVariable Long teamId,
            @PathVariable Long requestId,
            @RequestBody(required = false) CommentRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User mentor = getUser(userDetails);
        return ResponseEntity.ok(teamService.rejectDismantleRequest(requestId, mentor.getId(),
                req != null ? req.getComment() : null));
    }

    @GetMapping("/{teamId}/dismantle-requests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TeamDismantleRequest>> getDismantleRequests(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamService.getDismantleRequestsForTeam(teamId));
    }

    // ─── Member Removal (direct, pre-mentor) ──────────────────────────────────

    @DeleteMapping("/{teamId}/members/{memberId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TeamMember> removeMember(
            @PathVariable Long teamId,
            @PathVariable Long memberId,
            @RequestBody ReasonRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(teamService.removeMemberDirect(teamId, memberId, user.getId(), req.getReason()));
    }

    // ─── Removal Request (post-mentor) ────────────────────────────────────────

    @PostMapping("/{teamId}/members/{memberId}/removal-request")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<MemberRemovalRequest> requestRemoval(
            @PathVariable Long teamId,
            @PathVariable Long memberId,
            @RequestBody ReasonRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(teamService.requestMemberRemoval(teamId, memberId, user.getId(), req.getReason()));
    }

    @PostMapping("/{teamId}/removal-request/{requestId}/approve")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<TeamMember> approveRemoval(
            @PathVariable Long teamId,
            @PathVariable Long requestId,
            @RequestBody(required = false) CommentRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User mentor = getUser(userDetails);
        return ResponseEntity.ok(teamService.approveRemovalRequest(requestId, mentor.getId(),
                req != null ? req.getComment() : null));
    }

    @PostMapping("/{teamId}/removal-request/{requestId}/reject")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<MemberRemovalRequest> rejectRemoval(
            @PathVariable Long teamId,
            @PathVariable Long requestId,
            @RequestBody(required = false) CommentRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User mentor = getUser(userDetails);
        return ResponseEntity.ok(teamService.rejectRemovalRequest(requestId, mentor.getId(),
                req != null ? req.getComment() : null));
    }

    @GetMapping("/{teamId}/removal-requests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MemberRemovalRequest>> getRemovalRequests(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamService.getRemovalRequestsForTeam(teamId));
    }

    // ─── Invitation management ────────────────────────────────────────────────

    @DeleteMapping("/{teamId}/invitations/{inviteeId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> cancelInvitation(
            @PathVariable Long teamId,
            @PathVariable Long inviteeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        teamService.cancelInvitation(teamId, inviteeId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{teamId}/invite-with-message")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TeamMember> inviteWithMessage(
            @PathVariable Long teamId,
            @RequestBody InviteRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(teamService.inviteMemberWithMessage(
                teamId, req.getInviteeId(), user.getId(), req.getMessage()));
    }

    // ─── Mentor governance dashboard ──────────────────────────────────────────

    @GetMapping("/pending-actions")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<java.util.Map<String, Object>> getPendingActions() {
        return ResponseEntity.ok(java.util.Map.of(
                "dismantleRequests", teamService.getPendingDismantleRequests(),
                "removalRequests", teamService.getPendingRemovalRequests()
        ));
    }

    // ─── Inner helper ─────────────────────────────────────────────────────────

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Data
    public static class CreateTeamRequest {
        private String teamName;
        private List<String> domains;
        private Integer maxTeamSize;
        private Integer minTeamSize;
        private String requiredSkills; // JSON string from frontend
        private String projectFocus;
    }

    @Data
    public static class ReasonRequest {
        private String reason;
    }

    @Data
    public static class CommentRequest {
        private String comment;
    }

    @Data
    public static class InviteRequest {
        private Long inviteeId;
        private String message;
    }

    @Data
    @lombok.Builder
    public static class OpenTeamDto {
        private String id;
        private String teamName;
        private String leaderName;
        private List<String> domains;
        private List<String> requiredSkills;
        private Integer currentMemberCount;
        private Integer maxTeamCount;
        private String projectFocus;
    }
}

