package com.scl.scl_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SclBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(SclBackendApplication.class, args);
	}

}
