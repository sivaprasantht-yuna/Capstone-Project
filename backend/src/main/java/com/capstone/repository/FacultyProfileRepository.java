package com.capstone.repository;

import com.capstone.model.FacultyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FacultyProfileRepository extends JpaRepository<FacultyProfile, Long> {
    @Query("SELECT fp FROM FacultyProfile fp WHERE fp.availabilityStatus != 'UNAVAILABLE' AND fp.currentTeamCount < fp.maxTeamCapacity")
    List<FacultyProfile> findAvailableFaculty();
}
