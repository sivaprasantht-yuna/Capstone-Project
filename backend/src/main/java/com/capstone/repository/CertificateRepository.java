package com.capstone.repository;

import com.capstone.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findByTeamId(Long teamId);
    Optional<Certificate> findByCertificateNumber(String certificateNumber);
}
