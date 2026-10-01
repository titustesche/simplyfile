package de.titus.simplyfile.e2e;

import io.cucumber.spring.CucumberContextConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.nio.file.Path;

/**
 * Starts the whole application on a random port for the scenarios, backed by an
 * in-memory database and a temporary storage directory.
 */
@CucumberContextConfiguration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("e2e")
public class CucumberSpringConfiguration {

    static final Path STORAGE = TempDirectories.create("simplyfile-e2e-storage");

    @DynamicPropertySource
    static void storageProperties(DynamicPropertyRegistry registry) {
        registry.add("storage.path", STORAGE::toString);
    }
}
