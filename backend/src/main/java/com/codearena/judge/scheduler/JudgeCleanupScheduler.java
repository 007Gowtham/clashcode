package com.codearena.judge.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Comparator;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

@Slf4j
@Component
public class JudgeCleanupScheduler {

    private static final long ONE_HOUR_MS = 3600_000L;

    /**
     * Deletes leftover judge folders and containers older than 1 hour.
     * Guards against disk leaks if the server was restarted or crashed mid-run.
     */
    @Scheduled(fixedRate = 3600_000, initialDelay = 60_000)
    public void cleanupLeftovers() {
        log.info("Running scheduled judge cleanup for artifacts older than 1 hour...");
        cleanupTempFolders();
        cleanupDockerContainers();
    }

    private void cleanupTempFolders() {
        try {
            Path tmpDir = Paths.get(System.getProperty("java.io.tmpdir"));
            long cutoffTime = System.currentTimeMillis() - ONE_HOUR_MS;

            try (Stream<Path> stream = Files.list(tmpDir)) {
                stream.filter(p -> p.getFileName().toString().startsWith("clashcode-judge-"))
                        .filter(p -> {
                            try {
                                return Files.getLastModifiedTime(p).toMillis() < cutoffTime;
                            } catch (IOException e) {
                                return false;
                            }
                        })
                        .forEach(this::deleteRecursively);
            }
        } catch (Exception e) {
            log.warn("Error during scheduled judge directory cleanup", e);
        }
    }

    private void cleanupDockerContainers() {
        try {
            // Prune stopped clashcode judge containers older than 1 hour
            Process process = new ProcessBuilder(
                    "docker", "container", "prune",
                    "--filter", "label=clashcode-judge=true",
                    "--filter", "until=1h",
                    "-f"
            ).start();

            boolean finished = process.waitFor(10, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
            }
        } catch (Exception e) {
            log.debug("Docker container prune was not executed or Docker unavailable: {}", e.getMessage());
        }
    }

    private void deleteRecursively(Path dir) {
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
            log.info("Deleted orphaned judge directory: {}", dir);
        } catch (Exception e) {
            log.warn("Failed to delete orphaned judge directory: {}", dir, e);
        }
    }
}

