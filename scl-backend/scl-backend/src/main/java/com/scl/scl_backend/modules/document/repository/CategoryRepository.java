package com.scl.scl_backend.modules.document.repository;

import com.scl.scl_backend.modules.document.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

}
