package com.capstone.controller;

import com.capstone.model.*;
import com.capstone.repository.UserRepository;
import com.capstone.service.MentorshipService;
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
@RequestMapping("/api/v1/mentorships")
@RequiredArgsConstructor
@Tag(name = "Mentorships", description = "Mentor request, accept/reject, and rating endpoints")
public class MentorshipController {

    private final MentorshipService mentorshipService;
    private final UserRepository userRepository;

    @PostMapping("/request")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Mentorship> requestMentor(@RequestBody MentorRequestBody body) {
        return ResponseEntity.ok(mentorshipService.requestMentor(
                body.getTeamId(), body.getFacultyId(),
                body.getMatchScore(), body.getMatchingSkillsJson()));
    }

    @PatchMapping("/{mentorshipId}/respond")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<Mentorship> respond(
            @PathVariable Long mentorshipId,
            @RequestParam boolean accept,
            @AuthenticationPrincipal UserDetails userDetails) {

        User faculty = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(mentorshipService.respondToRequest(mentorshipId, faculty.getId(), accept));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<Mentorship>> getPendingRequests(
            @AuthenticationPrincipal UserDetails userDetails) {

        User faculty = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(mentorshipService.getPendingRequestsForFaculty(faculty.getId()));
    }

    @GetMapping("/active")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<Mentorship>> getActiveMentorships(
            @AuthenticationPrincipal UserDetails userDetails) {

        User faculty = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(mentorshipService.getActiveMentorshipsForFaculty(faculty.getId()));
    }

    @PostMapping("/{mentorshipId}/rate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Mentorship> submitRating(
            @PathVariable Long mentorshipId,
            @RequestBody RatingBody body,
            @AuthenticationPrincipal UserDetails userDetails) {

        User rater = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isTeamRating = rater.getRole() == User.Role.STUDENT;
        return ResponseEntity.ok(mentorshipService.submitRating(mentorshipId, rater.getId(), body.getRating(), isTeamRating));
    }

    @Data static class MentorRequestBody {
        private Long teamId;
        private Long facultyId;
        private Double matchScore;
        private String matchingSkillsJson;
    }
    @Data static class RatingBody { private Integer rating; }
}
