package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.DataGroup;
import com.elevenof.backoffice.model.VisibilityPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VisibilityPolicyRepository extends JpaRepository<VisibilityPolicy, Long> {

    List<VisibilityPolicy> findByCompetitionId(Long competitionId);

    Optional<VisibilityPolicy> findByCompetitionIdAndStageIdAndDataGroup(Long competitionId, Long stageId, DataGroup dataGroup);

    Optional<VisibilityPolicy> findByCompetitionIdAndStageIdIsNullAndDataGroup(Long competitionId, DataGroup dataGroup);
}
