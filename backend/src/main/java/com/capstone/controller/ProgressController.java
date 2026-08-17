package com.capstone.controller;

import com.capstone.repository.UserRepository;
import com.capstone.service.ProgressService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/progress")
@RequiredArgsConstructor
@Tag(name = "Progress", description = "Team and student progress tracking")
public class ProgressController {

    private final ProgressService progressService;
    private final UserRepository userRepository;

    /**
     * Full team progress dashboard data.
     */
    @GetMapping("/team/{teamId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getTeamProgress(@PathVariable Long teamId) {
        return ResponseEntity.ok(progressService.getTeamProgress(teamId));
    }

    /**
     * Team event timeline.
     */
    @GetMapping("/team/{teamId}/timeline")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getTeamTimeline(@PathVariable Long teamId) {
        return ResponseEntity.ok(progressService.getTeamTimeline(teamId));
    }

    /**
     * Individual student progress within a specific team.
     */
    @GetMapping("/student/{studentId}/team/{teamId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getStudentProgress(
            @PathVariable Long studentId,
            @PathVariable Long teamId) {
        return ResponseEntity.ok(progressService.getStudentProgress(studentId, teamId));
    }

    /**
     * My own progress on current team (resolved from auth).
     */
    @GetMapping("/student/me/team/{teamId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getMyProgress(
            @PathVariable Long teamId,
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(progressService.getStudentProgress(user.getId(), teamId));
    }

    /**
     * Full project history for a student (all teams, current + former).
     */
    @GetMapping("/student/{studentId}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getStudentHistory(@PathVariable Long studentId) {
        return ResponseEntity.ok(progressService.getStudentProjectHistory(studentId));
    }

    /**
     * My own full project history.
     */
    @GetMapping("/student/me/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getMyHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(progressService.getStudentProjectHistory(user.getId()));
    }
}
