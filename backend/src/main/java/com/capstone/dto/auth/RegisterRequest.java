package com.capstone.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank @Size(max = 100)
    private String name;

    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 8, max = 100)
    private String password;

    @NotBlank
    private String role;            // STUDENT | FACULTY | ADMIN | INDUSTRY

    private String department;
    private Integer yearOfStudy;    // students
    private String designation;     // faculty
}
