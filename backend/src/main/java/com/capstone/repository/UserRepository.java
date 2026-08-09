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

    /**
     * Returns all STUDENT users who are NOT an ACCEPTED member of any team,
     * excluding the given userId (the current leader).
     */
    @Query("SELECT u FROM User u WHERE u.role = 'STUDENT' AND u.id != :excludeId " +
           "AND u.id NOT IN (SELECT tm.user.id FROM TeamMember tm WHERE tm.inviteStatus = com.capstone.model.TeamMember.InviteStatus.ACCEPTED)")
    List<User> findStudentsWithoutTeam(Long excludeId);

    @Query("SELECT u FROM User u WHERE u.role = 'FACULTY' AND u.isActive = true")
    List<User> findAllActiveFaculty();
}
