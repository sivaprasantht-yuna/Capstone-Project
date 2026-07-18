package com.capstone.repository;

import com.capstone.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByStatus(Project.ProjectStatus status);

    List<Project> findByDomain(String domain);

    List<Project> findByPostedById(Long userId);

    List<Project> findByStatusIn(List<Project.ProjectStatus> statuses);

    @Query("SELECT p FROM Project p WHERE p.status = 'APPROVED' ORDER BY p.upvoteCount DESC")
    List<Project> findApprovedOrderByUpvotes();

    @Query("SELECT p FROM Project p ORDER BY p.upvoteCount DESC")
    List<Project> findAllOrderByUpvotesDesc();

    @Query("SELECT DISTINCT p.domain FROM Project p WHERE p.domain IS NOT NULL")
    List<String> findAllDistinctDomains();

    @Modifying
    @Query("UPDATE Project p SET p.upvoteCount = p.upvoteCount + 1 WHERE p.id = :id")
    void incrementUpvote(Long id);

    @Query("SELECT COUNT(p) FROM Project p WHERE p.status = :status")
    long countByStatus(Project.ProjectStatus status);
}
