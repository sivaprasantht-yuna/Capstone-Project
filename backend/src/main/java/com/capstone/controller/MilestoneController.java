package com.capstone.controller;

import com.capstone.model.*;
import com.capstone.repository.*;
import com.capstone.service.MilestoneService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/milestones")
@RequiredArgsConstructor
@Tag(name = "Milestones", description = "Milestone management, submissions, and evaluations")
public class MilestoneController {

    private final MilestoneService milestoneService;
    private final UserRepository userRepository;

    @GetMapping("/team/{teamId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Milestone>> getMilestonesForTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(milestoneService.getMilestonesForTeam(teamId));
    }

    @PostMapping("/{milestoneId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Submission> submitMilestone(
            @PathVariable Long milestoneId,
            @RequestParam(required = false) String remarks,
            @RequestParam(required = false) String githubUrl,
            @RequestParam(required = false) MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) throws Exception {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(milestoneService.submitMilestone(milestoneId, user.getId(), remarks, githubUrl, file));
    }

    @PostMapping("/{milestoneId}/evaluate")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<Evaluation> evaluateMilestone(
            @PathVariable Long milestoneId,
            @RequestBody EvaluationRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        User mentor = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(milestoneService.evaluateMilestone(
                milestoneId, mentor.getId(), req.getMarks(), req.getFeedback(), req.getFeedbackData()));
    }

    @Data
    static class EvaluationRequest {
        private Double marks;
        private String feedback;
        private Map<String, Object> feedbackData;
    }
}
