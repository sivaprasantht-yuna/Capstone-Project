package com.capstone.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String name;
    private String rollNumber;
    private String department;
    private String domain;
    private String bio;
    private String contactNo;
    private String avatarUrl;
    private String linkedinLink;
    private String githubLink;
    private List<String> skills;
}
