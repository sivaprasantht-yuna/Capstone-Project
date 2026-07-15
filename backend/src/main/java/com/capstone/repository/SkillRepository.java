package com.capstone.repository;

import com.capstone.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findBySkillNameIgnoreCase(String skillName);
    List<Skill> findByCategory(String category);
}
