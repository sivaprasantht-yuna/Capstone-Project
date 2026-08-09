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
import com.capstone.service.DocumentSanitizerService;

import com.capstone.service.CloudinaryService;
import com.capstone.service.MatchingService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project idea repository — CRUD, upvote, filter")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final DocumentSanitizerService sanitizerService;
    private final CloudinaryService cloudinaryService;
    private final MatchingService matchingService;

    @GetMapping
    public ResponseEntity<List<Project>> getAllApprovedProjects(
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String status) {

        if (domain != null) return ResponseEntity.ok(projectRepository.findByDomain(domain));
        if (status != null) return ResponseEntity.ok(
                projectRepository.findByStatus(Project.ProjectStatus.valueOf(status.toUpperCase())));
        return ResponseEntity.ok(projectRepository.findByOrderByUpvoteCountDesc());
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Project>> getMyProjects(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(projectRepository.findByPostedById(user.getId()));
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

        // Calculate similarity score against existing ideas
        List<String> existingIdeaTexts = projectRepository.findAll().stream()
                .map(p -> p.getTitle() + ": " + p.getDescription())
                .toList();

        Map<String, Object> simResult = matchingService.checkIdeaSimilarity(
                req.getTitle() + ": " + req.getDescription(), existingIdeaTexts);

        Double maxSim = simResult.get("max_similarity") instanceof Number ?
                ((Number) simResult.get("max_similarity")).doubleValue() : 0.0;
        Boolean isDup = simResult.get("is_duplicate") instanceof Boolean ?
                (Boolean) simResult.get("is_duplicate") : (maxSim > 0.7);

        Project project = Project.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .domain(req.getDomain())
                .techStack(req.getTechStack())
                .maxTeamSize(req.getMaxTeamSize() != null ? req.getMaxTeamSize() : 4)
                .postedBy(poster)
                .status(Project.ProjectStatus.OPEN)
                .isIndustryProposed(poster.getRole() == User.Role.INDUSTRY)
                .githubUrl(req.getGithubUrl())
                .pdfDocumentUrl(req.getPdfDocumentUrl())
                .projectOverviewDoc(req.getProjectOverviewDoc())
                .referenceSummary(req.getProjectOverviewDoc())
                .similarityScore(maxSim)
                .similarityFlag(isDup)
                .build();

        return ResponseEntity.ok(projectRepository.save(project));
    }

    @PostMapping("/process-pdf")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> processPdfDocument(@RequestParam("file") MultipartFile file) {
        try {
            String pdfUrl = cloudinaryService.uploadFile(file, "project-docs");
            String overviewDoc = sanitizerService.callPythonSanitizer(file);
            return ResponseEntity.ok(Map.of(
                    "pdfUrl", pdfUrl,
                    "projectOverviewDoc", overviewDoc
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
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

    @PostMapping("/{projectId}/sanitize")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> convertToReferenceDocument(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file) {

        try {
            // 1. Forward to Python FastAPI and get AI response
            String cleanedMarkdown = sanitizerService.callPythonSanitizer(file);

            // 2. Fetch target project entity and update the field
            return projectRepository.findById(projectId)
                    .map(project -> {
                        project.setReferenceSummary(cleanedMarkdown);
                        project.setProjectOverviewDoc(cleanedMarkdown);
                        projectRepository.save(project);
                        return ResponseEntity.ok(Map.of(
                                "message", "Project converted to reference document successfully",
                                "document", cleanedMarkdown
                        ));
                    })
                    .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @Data
    static class ProjectRequest {
        private String title;
        private String description;
        private String domain;
        private String techStack;
        private Integer maxTeamSize;
        private String githubUrl;
        private String pdfDocumentUrl;
        private String projectOverviewDoc;
    }

    @Data
    static class StatusUpdateRequest {
        private String status;
    }
}
