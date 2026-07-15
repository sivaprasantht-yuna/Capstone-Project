package com.capstone.repository;

import com.capstone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(User.Role role);

    List<User> findByDepartmentAndRole(String department, User.Role role);

    @Query("SELECT u FROM User u WHERE u.role = 'STUDENT' AND u.id != :excludeId")
    List<User> findAllStudentsExcept(Long excludeId);

    @Query("SELECT u FROM User u WHERE u.role = 'FACULTY' AND u.isActive = true")
    List<User> findAllActiveFaculty();
}
