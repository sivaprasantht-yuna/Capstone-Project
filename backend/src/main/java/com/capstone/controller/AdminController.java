package com.capstone.controller;

import com.capstone.model.Team;
import com.capstone.repository.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin analytics and oversight dashboard")
public class AdminController {

    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final FacultyProfileRepository facultyProfileRepository;

    /**
     * Returns all KPI data for the admin overview dashboard in one call.
     */
    @GetMapping("/analytics/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        Map<String, Object> stats = new HashMap<>();

        // Total counts
        stats.put("totalStudents",  userRepository.findByRole(com.capstone.model.User.Role.STUDENT).size());
        stats.put("totalFaculty",   userRepository.findByRole(com.capstone.model.User.Role.FACULTY).size());
        stats.put("totalProjects",  projectRepository.count());
        stats.put("totalTeams",     teamRepository.count());
        stats.put("activeTeams",    teamRepository.countByStatus(Team.TeamStatus.ACTIVE));
        stats.put("completedTeams", teamRepository.countByStatus(Team.TeamStatus.COMPLETED));
        stats.put("atRiskTeams",    teamRepository.findAtRiskTeams().size());

        // Domain distribution for pie chart
        List<String> domains = projectRepository.findAllDistinctDomains();
        Map<String, Long> domainCounts = domains.stream().collect(Collectors.toMap(
                d -> d,
                d -> projectRepository.findByDomain(d).stream()
                        .filter(p -> p.getStatus() == com.capstone.model.Project.ProjectStatus.IN_PROGRESS
                                  || p.getStatus() == com.capstone.model.Project.ProjectStatus.APPROVED)
                        .count()
        ));
        stats.put("domainDistribution", domainCounts);

        // Mentor load distribution for bar chart
        List<Map<String, Object>> mentorLoad = facultyProfileRepository.findAll().stream().map(fp -> {
            Map<String, Object> m = new HashMap<>();
            m.put("facultyId", fp.getUserId());
            m.put("name", fp.getUser() != null ? fp.getUser().getName() : "Faculty " + fp.getUserId());
            m.put("currentLoad", fp.getCurrentTeamCount());
            m.put("maxCapacity", fp.getMaxTeamCapacity());
            m.put("utilizationPct", fp.getMaxTeamCapacity() > 0 ?
                    (fp.getCurrentTeamCount() * 100.0 / fp.getMaxTeamCapacity()) : 0);
            return m;
        }).collect(Collectors.toList());
        stats.put("mentorLoadDistribution", mentorLoad);

        // Department participation
        Map<String, Long> deptParticipation = userRepository.findByRole(com.capstone.model.User.Role.STUDENT)
                .stream()
                .filter(u -> u.getDepartment() != null)
                .collect(Collectors.groupingBy(u -> u.getDepartment(), Collectors.counting()));
        stats.put("departmentParticipation", deptParticipation);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/teams")
    public ResponseEntity<?> getAllTeams() {
        return ResponseEntity.ok(teamRepository.findAll());
    }

    @GetMapping("/at-risk-teams")
    public ResponseEntity<?> getAtRiskTeams() {
        return ResponseEntity.ok(teamRepository.findAtRiskTeams());
    }
}
