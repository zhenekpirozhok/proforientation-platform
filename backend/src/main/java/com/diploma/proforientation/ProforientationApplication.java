package com.diploma.proforientation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class ProforientationApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProforientationApplication.class, args);
	}

}
