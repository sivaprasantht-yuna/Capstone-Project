package com.capstone.controller;

import com.capstone.matching.MatchingFacade;
import com.capstone.model.User;
import com.capstone.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ═══════════════════════════════════════════════════════════════════
 * DESIGN PATTERN: Structural — Facade Pattern (Client side)
 * ═══════════════════════════════════════════════════════════════════
 *
 * This controller is the CLIENT in the Facade pattern.
 * It only calls MatchingFacade — it no longer knows about
 * TeamMemberRepository, ProjectRepository, or member-ID assembly.
 *
 * All complexity is hidden behind {@link MatchingFacade}.
 * ═══════════════════════════════════════════════════════════════════
 */
@RestController
@RequestMapping("/matching")
@RequiredArgsConstructor
@Tag(name = "Matching", description = "AI-powered teammate and mentor matching via Python microservice")
@SecurityRequirement(name = "bearerAuth")
public class MatchingController {

    // ── Facade: single dependency, hides all subsystems ──────────────────────
    private final MatchingFacade  matchingFacade;
    private final UserRepository  userRepository;

    @GetMapping("/teammates")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get top N teammate suggestions using cosine skill-vector similarity")
    public ResponseEntity<List<Map<String, Object>>> getTeammateMatches(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "5") int topN) {

        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ── Facade call: one line replaces multi-step orchestration ───────────
        return ResponseEntity.ok(matchingFacade.findTeammatesFor(currentUser.getId(), topN));
    }

    @GetMapping("/mentors/{teamId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY', 'ADMIN')")
    @Operation(summary = "Get top N mentor recommendations for a team, ranked by expertise + workload")
    public ResponseEntity<List<Map<String, Object>>> getMentorMatches(
            @PathVariable Long teamId,
            @RequestParam(defaultValue = "3") int topN) {

        // ── Facade call: member-ID lookup is now hidden inside the facade ─────
        return ResponseEntity.ok(matchingFacade.findMentorsFor(teamId, topN));
    }

    @PostMapping("/idea-similarity")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @Operation(summary = "Check if a new project idea is similar to existing approved ones (plagiarism detection)")
    public ResponseEntity<Map<String, Object>> checkIdeaSimilarity(
            @RequestBody Map<String, Object> body) {

        String newIdea = (String) body.get("text");
        // ── Facade call: existing idea collection is now hidden inside facade ──
        return ResponseEntity.ok(matchingFacade.checkIdeaUniqueness(newIdea));
    }
}

