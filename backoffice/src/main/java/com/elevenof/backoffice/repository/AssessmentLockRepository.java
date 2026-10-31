package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.AssessmentLock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AssessmentLockRepository extends JpaRepository<AssessmentLock, Long> {

    Optional<AssessmentLock> findFirstByStepIdAndUnlockedAtIsNull(Long stepId);
}
