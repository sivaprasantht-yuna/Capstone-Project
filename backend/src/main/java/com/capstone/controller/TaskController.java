package com.capstone.controller;

import com.capstone.model.ProjectEvidence;
import com.capstone.model.StudentTask;
import com.capstone.model.User;
import com.capstone.repository.StudentTaskRepository;
import com.capstone.repository.ProjectEvidenceRepository;
import com.capstone.repository.UserRepository;
import com.capstone.service.TaskService;
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
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Student task management and evidence tracking")
public class TaskController {

    private final TaskService taskService;
    private final StudentTaskRepository taskRepository;
    private final ProjectEvidenceRepository evidenceRepository;
    private final UserRepository userRepository;

    @PostMapping("/{teamId}/tasks")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentTask> createTask(
            @PathVariable Long teamId,
            @RequestBody CreateTaskRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(taskService.createTask(
                teamId, req.getAssignedToId(), user.getId(),
                req.getTitle(), req.getDescription(), req.getDueDate(), req.getPointValue()));
    }

    @GetMapping("/{teamId}/tasks")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<StudentTask>> getTeamTasks(@PathVariable Long teamId) {
        return ResponseEntity.ok(taskRepository.findByTeamId(teamId));
    }

    @GetMapping("/{teamId}/tasks/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<StudentTask>> getMyTasks(
            @PathVariable Long teamId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(taskRepository.findByTeamIdAndAssignedToId(teamId, user.getId()));
    }

    @PatchMapping("/{teamId}/tasks/{taskId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentTask> updateTask(
            @PathVariable Long teamId,
            @PathVariable Long taskId,
            @RequestBody UpdateTaskRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(taskService.updateTaskStatus(taskId, user.getId(), req.getStatus(), req.getCompletionNote()));
    }

    @PostMapping("/{teamId}/tasks/{taskId}/evidence")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ProjectEvidence> addEvidence(
            @PathVariable Long teamId,
            @PathVariable Long taskId,
            @RequestBody AddEvidenceRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(taskService.addEvidence(
                taskId, user.getId(), teamId,
                req.getTitle(), req.getDescription(), req.getEvidenceType(), req.getFileUrl()));
    }

    @GetMapping("/{teamId}/tasks/{taskId}/evidence")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjectEvidence>> getTaskEvidence(
            @PathVariable Long teamId,
            @PathVariable Long taskId) {
        return ResponseEntity.ok(evidenceRepository.findByTaskId(taskId));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Data
    public static class CreateTaskRequest {
        private Long assignedToId;
        private String title;
        private String description;
        private String dueDate;
        private Integer pointValue;
    }

    @Data
    public static class UpdateTaskRequest {
        private String status;
        private String completionNote;
    }

    @Data
    public static class AddEvidenceRequest {
        private String title;
        private String description;
        private String evidenceType;
        private String fileUrl;
    }
}
