package com.capstone.matching;

import com.capstone.model.TeamMember;
import com.capstone.repository.ProjectRepository;
import com.capstone.repository.TeamMemberRepository;
import com.capstone.service.MatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ═══════════════════════════════════════════════════════════════════
 * DESIGN PATTERN: Structural — Facade Pattern
 * ═══════════════════════════════════════════════════════════════════
 *
 * PROBLEM:
 *   MatchingController was reaching into multiple repositories
 *   (TeamMemberRepository, ProjectRepository) to assemble the context
 *   needed before calling MatchingService. This leaks business logic
 *   into the controller layer.
 *
 * SOLUTION:
 *   MatchingFacade provides a simple, unified interface for all
 *   matching operations. The controller only calls the facade;
 *   all orchestration (fetching member IDs, collecting existing ideas,
 *   deciding topN defaults) is hidden behind the facade.
 *
 * PARTICIPANTS:
 *   - Facade:     MatchingFacade        (this class)
 *   - Subsystems: MatchingService       (Python microservice proxy)
 *                 TeamMemberRepository  (member lookup)
 *                 ProjectRepository     (idea gathering)
 *   - Client:     MatchingController    (only talks to this facade)
 * ═══════════════════════════════════════════════════════════════════
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MatchingFacade {

    // ── Subsystems hidden behind this facade ──────────────────────────────────
    private final MatchingService      matchingService;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository    projectRepository;

    private static final int DEFAULT_TEAMMATE_TOP_N = 5;
    private static final int DEFAULT_MENTOR_TOP_N   = 3;

    /**
     * Find top teammate suggestions for a student.
     * The facade supplies the default topN so the controller doesn't need to.
     */
    public List<Map<String, Object>> findTeammatesFor(Long userId) {
        return findTeammatesFor(userId, DEFAULT_TEAMMATE_TOP_N);
    }

    public List<Map<String, Object>> findTeammatesFor(Long userId, int topN) {
        log.debug("[Facade] Resolving teammate matches for userId={}", userId);
        return matchingService.getTeammateMatches(userId, topN);
    }

    /**
     * Find top mentor recommendations for a team.
     * The facade fetches team member IDs from the DB — the controller
     * no longer needs to know about TeamMemberRepository.
     */
    public List<Map<String, Object>> findMentorsFor(Long teamId) {
        return findMentorsFor(teamId, DEFAULT_MENTOR_TOP_N);
    }

    public List<Map<String, Object>> findMentorsFor(Long teamId, int topN) {
        log.debug("[Facade] Resolving mentor matches for teamId={}", teamId);

        // ── Subsystem 1: fetch accepted member IDs (hidden from controller) ──
        List<Long> memberIds = teamMemberRepository
                .findByTeamIdAndInviteStatus(teamId, TeamMember.InviteStatus.ACCEPTED)
                .stream()
                .map(m -> m.getUser().getId())
                .collect(Collectors.toList());

        if (memberIds.isEmpty()) {
            log.warn("[Facade] No accepted members found for teamId={}; returning empty", teamId);
            return Collections.emptyList();
        }

        // ── Subsystem 2: delegate to matching microservice proxy ─────────────
        return matchingService.getMentorMatches(teamId, memberIds, topN);
    }

    /**
     * Check uniqueness of a new project idea against all approved projects.
     * The facade collects existing project descriptions so the controller
     * doesn't need to know about ProjectRepository.
     *
     * @param newIdeaText the candidate project description
     * @return similarity result map from the Python service
     */
    public Map<String, Object> checkIdeaUniqueness(String newIdeaText) {
        log.debug("[Facade] Checking idea uniqueness for submitted text");

        // ── Subsystem 1: collect approved idea texts (hidden from controller) ─
        List<String> existingIdeas = projectRepository.findAll().stream()
                .map(p -> p.getTitle() + ". " + p.getDescription())
                .collect(Collectors.toList());

        // ── Subsystem 2: delegate similarity check to matching service ────────
        return matchingService.checkIdeaSimilarity(newIdeaText, existingIdeas);
    }
}
