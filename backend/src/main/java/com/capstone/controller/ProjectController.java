package com.capstone.controller;

import com.capstone.model.Project;
import com.capstone.repository.ProjectRepository;
import com.capstone.repository.UserRepository;
import com.capstone.model.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.capstone.service.DocumentSanitizerClient;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project idea repository — CRUD, upvote, filter")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final DocumentSanitizerClient documentSanitizerClient;

    @GetMapping
    public ResponseEntity<List<Project>> getAllApprovedProjects(
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String status) {

        if (domain != null) return ResponseEntity.ok(projectRepository.findByDomain(domain));
        if (status != null) return ResponseEntity.ok(
                projectRepository.findByStatus(Project.ProjectStatus.valueOf(status.toUpperCase())));
        return ResponseEntity.ok(projectRepository.findApprovedOrderByUpvotes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProject(@PathVariable Long id) {
        return projectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/domains")
    public ResponseEntity<List<String>> getAllDomains() {
        return ResponseEntity.ok(projectRepository.findAllDistinctDomains());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY', 'INDUSTRY', 'ADMIN')")
    @Transactional
    public ResponseEntity<Project> createProject(
            @RequestBody ProjectRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        User poster = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = Project.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .domain(req.getDomain())
                .techStack(req.getTechStack())
                .maxTeamSize(req.getMaxTeamSize() != null ? req.getMaxTeamSize() : 4)
                .postedBy(poster)
                .status(Project.ProjectStatus.OPEN)
                .isIndustryProposed(poster.getRole() == User.Role.INDUSTRY)
                .build();

        return ResponseEntity.ok(projectRepository.save(project));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Transactional
    public ResponseEntity<Project> updateProjectStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest req) {

        return projectRepository.findById(id).map(p -> {
            p.setStatus(Project.ProjectStatus.valueOf(req.getStatus().toUpperCase()));
            return ResponseEntity.ok(projectRepository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/upvote")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Void> upvote(@PathVariable Long id) {
        projectRepository.incrementUpvote(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reference-document")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Project> uploadReferenceDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        return projectRepository.findById(id).map(p -> {
            String summary = documentSanitizerClient.processPdfDocument(file);
            p.setReferenceSummary(summary);
            return ResponseEntity.ok(projectRepository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Data
    static class ProjectRequest {
        private String title;
        private String description;
        private String domain;
        private String techStack;
        private Integer maxTeamSize;
    }

    @Data
    static class StatusUpdateRequest {
        private String status;
    }
}
