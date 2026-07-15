package com.capstone.service;

import com.capstone.model.FacultyProfile;
import com.capstone.model.UserSkill;
import com.capstone.repository.FacultyProfileRepository;
import com.capstone.repository.UserRepository;
import com.capstone.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Proxy service that calls the Python FastAPI matching microservice.
 * Responsible for:
 *   1. Building skill-vector payloads from the DB
 *   2. Calling FastAPI endpoints
 *   3. Caching results in Redis
 *   4. Applying workload-balancer pre-filter for mentors
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingService {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final FacultyProfileRepository facultyProfileRepository;
    private final RestTemplate restTemplate;

    @Value("${app.matching-service.base-url}")
    private String matchingServiceBaseUrl;

    /**
     * Returns top N teammate suggestions for a student (excluding same-department students).
     * Caches result in Redis for 1 hour.
     */
    @Cacheable(value = "teammate-matches", key = "#userId")
    public List<Map<String, Object>> getTeammateMatches(Long userId, int topN) {
        List<UserSkill> requesterSkills = userSkillRepository.findByUserIdWithSkill(userId);

        // Get all other students with their skills
        List<Long> candidateIds = userRepository.findAllStudentsExcept(userId)
                .stream()
                .map(u -> u.getId())
                .collect(Collectors.toList());

        List<UserSkill> allSkills = userSkillRepository.findByUserIdIn(candidateIds);

        // Build payload
        Map<String, Object> payload = new HashMap<>();
        payload.put("requester_id", userId);
        payload.put("requester_skills", buildSkillVector(requesterSkills));
        payload.put("candidates", buildCandidateSkillMap(allSkills, candidateIds));
        payload.put("top_n", topN);

        return callMatchingService("/match/teammates", payload);
    }

    /**
     * Returns top N faculty mentor suggestions for a team.
     * Pre-filters by workload: only sends faculty who haven't exceeded max_team_capacity.
     */
    @Cacheable(value = "mentor-matches", key = "#teamId")
    public List<Map<String, Object>> getMentorMatches(Long teamId, List<Long> teamMemberIds, int topN) {
        // Workload balancer: only eligible faculty
        List<FacultyProfile> availableFaculty = facultyProfileRepository.findAvailableFaculty();
        List<Long> eligibleFacultyIds = availableFaculty.stream()
                .map(FacultyProfile::getUserId)
                .collect(Collectors.toList());

        if (eligibleFacultyIds.isEmpty()) {
            log.warn("No available faculty mentors found (all at capacity or unavailable)");
            return Collections.emptyList();
        }

        // Aggregate team skill vector from all members
        List<UserSkill> teamSkills = userSkillRepository.findByUserIdIn(teamMemberIds);
        List<UserSkill> facultySkills = userSkillRepository.findByUserIdIn(eligibleFacultyIds);

        Map<String, Object> payload = new HashMap<>();
        payload.put("team_id", teamId);
        payload.put("team_skills", buildSkillVector(teamSkills));
        payload.put("candidates", buildCandidateSkillMap(facultySkills, eligibleFacultyIds));
        payload.put("faculty_loads", buildLoadMap(availableFaculty));
        payload.put("top_n", topN);

        return callMatchingService("/match/mentors", payload);
    }

    /**
     * Checks a new project idea against existing approved ideas for similarity.
     */
    public Map<String, Object> checkIdeaSimilarity(String newIdeaText, List<String> existingIdeas) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("new_idea", newIdeaText);
        payload.put("existing_ideas", existingIdeas);

        List<Map<String, Object>> results = callMatchingService("/match/idea-similarity", payload);
        return results.isEmpty() ? Map.of("max_similarity", 0.0, "is_duplicate", false)
                                 : results.get(0);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /** Converts a list of UserSkill into { skillName: proficiencyLevel } */
    private Map<String, Integer> buildSkillVector(List<UserSkill> skills) {
        return skills.stream().collect(Collectors.toMap(
                us -> us.getSkill().getSkillName(),
                UserSkill::getProficiencyLevel,
                Integer::max  // take max if duplicate skill (shouldn't happen)
        ));
    }

    /** Groups skills by userId into { userId -> skillVector } */
    private Map<String, Map<String, Integer>> buildCandidateSkillMap(
            List<UserSkill> allSkills, List<Long> ids) {
        Map<String, Map<String, Integer>> result = new HashMap<>();
        for (Long id : ids) {
            result.put(id.toString(), new HashMap<>());
        }
        for (UserSkill us : allSkills) {
            String key = us.getUser().getId().toString();
            result.computeIfAbsent(key, k -> new HashMap<>())
                  .put(us.getSkill().getSkillName(), us.getProficiencyLevel());
        }
        return result;
    }

    private Map<String, Integer> buildLoadMap(List<FacultyProfile> profiles) {
        return profiles.stream().collect(Collectors.toMap(
                fp -> fp.getUserId().toString(),
                FacultyProfile::getCurrentTeamCount
        ));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> callMatchingService(String path, Map<String, Object> payload) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    matchingServiceBaseUrl + path,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.error("Matching service call failed [{}]: {}", path, e.getMessage());
            return Collections.emptyList();
        }
    }

    @CacheEvict(value = {"teammate-matches", "mentor-matches"}, allEntries = true)
    public void evictMatchCaches() {
        log.info("Match caches evicted");
    }
}
