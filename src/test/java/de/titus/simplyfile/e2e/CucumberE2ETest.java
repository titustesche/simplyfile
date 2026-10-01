package de.titus.simplyfile.e2e;

import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

/**
 * Runs the Gherkin scenarios in {@code src/test/resources/features} against the
 * running application. Glue and plugins are configured in {@code junit-platform.properties}.
 * <p>
 * Skip them with {@code mvn test -Dtest='!CucumberE2ETest'}, select scenarios with
 * {@code -Dcucumber.filter.tags="@api"}.
 */
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
public class CucumberE2ETest {
}
