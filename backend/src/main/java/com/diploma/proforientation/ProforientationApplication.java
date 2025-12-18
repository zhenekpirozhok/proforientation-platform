package com.diploma.proforientation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
@EntityScan("com.diploma.proforientation.model")
public class ProforientationApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProforientationApplication.class, args);
	}

}
