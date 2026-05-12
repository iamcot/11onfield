package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.Configuration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfigurationRepository extends JpaRepository<Configuration, Long> {
    Optional<Configuration> findByKey(String key);
    boolean existsByKey(String key);
}
