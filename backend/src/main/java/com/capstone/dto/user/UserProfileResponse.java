package com.capstone.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String department;
    private String avatarUrl;
    private LocalDateTime createdAt;

    // Student specific fields
    private String rollNumber;
    private Integer yearOfStudy;
    private String bio;
    private String domain;
    private String contactNo;
    private String teamRole;
    private String linkedinLink;
    private String githubLink;

    // Skills
    private List<String> skills;
}
