package com.capstone.service;

import com.capstone.dto.user.UpdateProfileRequest;
import com.capstone.dto.user.UserProfileResponse;
import com.capstone.model.*;
import com.capstone.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;
    private final TeamMemberRepository teamMemberRepository;

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        StudentProfile profile = studentProfileRepository.findById(userId).orElse(null);
        List<UserSkill> userSkills = userSkillRepository.findByUserIdWithSkill(userId);

        List<String> skillNames = userSkills.stream()
                .map(us -> us.getSkill().getSkillName())
                .collect(Collectors.toList());

        String teamRole = "Student";
        String domain = "Robotics & Automation"; // default fallback domain

        List<TeamMember> teamMemberships = teamMemberRepository.findByUserId(userId);
        if (!teamMemberships.isEmpty()) {
            TeamMember tm = teamMemberships.get(0);
            if (tm.getRoleInTeam() != null && !tm.getRoleInTeam().isBlank()) {
                teamRole = tm.getRoleInTeam();
            }
            if (tm.getTeam() != null && tm.getTeam().getProject() != null) {
                if (tm.getTeam().getProject().getDomain() != null) {
                    domain = tm.getTeam().getProject().getDomain();
                }
            }
        }

        return UserProfileResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .department(user.getDepartment() != null ? user.getDepartment() : "Mechatronics Engineering")
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .rollNumber(profile != null && profile.getRollNumber() != null ? profile.getRollNumber() : "21MTR1234")
                .yearOfStudy(profile != null ? profile.getYearOfStudy() : 3)
                .bio(profile != null && profile.getBio() != null ? profile.getBio() : "Passionate about robotics and automation. Love building intelligent machines and solving real-world problems through technology. Always eager to learn and collaborate.")
                .domain(domain)
                .contactNo("+91 98765 43210")
                .teamRole(teamRole)
                .linkedinLink(profile != null && profile.getLinkedinLink() != null ? profile.getLinkedinLink() : "https://linkedin.com/in/sivaprasanth")
                .githubLink(profile != null && profile.getGithubLink() != null ? profile.getGithubLink() : "https://github.com/sivaprasanth")
                .skills(skillNames.isEmpty() ? List.of("C / C++", "Python", "ROS 2", "Arduino", "Embedded Systems", "PCB Design", "CAD (SolidWorks)", "Control Systems", "MATLAB") : skillNames)
                .build();
    }

    @Transactional
    public UserProfileResponse updateUserProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getDepartment() != null && !request.getDepartment().isBlank()) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        userRepository.save(user);

        StudentProfile profile = studentProfileRepository.findById(userId).orElseGet(() -> {
            StudentProfile newProfile = StudentProfile.builder().user(user).build();
            return studentProfileRepository.save(newProfile);
        });

        if (request.getRollNumber() != null) {
            profile.setRollNumber(request.getRollNumber());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getLinkedinLink() != null) {
            profile.setLinkedinLink(request.getLinkedinLink());
        }
        if (request.getGithubLink() != null) {
            profile.setGithubLink(request.getGithubLink());
        }
        studentProfileRepository.save(profile);

        // Sync Skills if provided
        if (request.getSkills() != null) {
            List<UserSkill> existing = userSkillRepository.findByUserId(userId);
            userSkillRepository.deleteAll(existing);

            for (String skillName : request.getSkills()) {
                String trimmed = skillName.trim();
                if (trimmed.isEmpty()) continue;

                Skill skill = skillRepository.findBySkillNameIgnoreCase(trimmed)
                        .orElseGet(() -> skillRepository.save(Skill.builder()
                                .skillName(trimmed)
                                .category("General")
                                .build()));

                UserSkill userSkill = UserSkill.builder()
                        .user(user)
                        .skill(skill)
                        .proficiencyLevel(3)
                        .build();
                userSkillRepository.save(userSkill);
            }
        }

        return getUserProfile(userId);
    }
}
