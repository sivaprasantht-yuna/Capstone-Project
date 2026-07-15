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
@RequestMapping("/teams")
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
        return ResponseEntity.ok(teamService.createTeam(req.getTeamName(), req.getProjectId(), leader.getId()));
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

    @PatchMapping("/{teamId}/invite/respond")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TeamMember> respondToInvite(
            @PathVariable Long teamId,
            @RequestParam boolean accept,
            @AuthenticationPrincipal UserDetails userDetails) {

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
    static class CreateTeamRequest {
        private String teamName;
        private Long projectId;
    }
}
