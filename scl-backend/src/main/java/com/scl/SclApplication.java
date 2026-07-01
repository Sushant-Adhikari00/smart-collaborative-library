package com.scl;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SclApplication {

	public static void main(String[] args) {
		SpringApplication.run(SclApplication.class, args);
	}

}
