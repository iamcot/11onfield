package com.elevenof.backoffice.repository;

import com.elevenof.backoffice.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByUserid(String userid);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByUserid(String userid);

    Page<User> findByRoleIn(List<User.Role> roles, Pageable pageable);
}
