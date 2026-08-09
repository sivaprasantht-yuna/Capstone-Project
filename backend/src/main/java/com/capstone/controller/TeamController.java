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

    @Data
    public static class CreateTeamRequest {
        private String teamName;
        private List<String> domains;
        private Integer maxTeamSize;
        private String requiredSkills; // JSON string from frontend
        private String projectFocus;
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
