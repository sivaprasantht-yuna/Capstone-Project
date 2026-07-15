package com.capstone.repository;

import com.capstone.model.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {

    List<UserSkill> findByUserId(Long userId);

    void deleteByUserIdAndSkillId(Long userId, Long skillId);

    @Query("SELECT us FROM UserSkill us JOIN FETCH us.skill WHERE us.user.id = :userId")
    List<UserSkill> findByUserIdWithSkill(Long userId);

    @Query("SELECT us FROM UserSkill us JOIN FETCH us.skill WHERE us.user.id IN :userIds")
    List<UserSkill> findByUserIdIn(List<Long> userIds);
}
