package de.titus.simplyfile.e2e;

import org.springframework.util.FileSystemUtils;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

final class TempDirectories {

    private TempDirectories() { }

    /** Temporary directory that is removed again when the test JVM exits. */
    static Path create(String prefix) {
        try {
            Path directory = Files.createTempDirectory(prefix);
            Runtime.getRuntime().addShutdownHook(new Thread(() -> FileSystemUtils.deleteRecursively(directory.toFile())));
            return directory;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    static List<Path> list(Path directory) {
        try (Stream<Path> files = Files.list(directory)) {
            return files.toList();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    static void clear(Path directory) {
        for (Path file : list(directory)) {
            try {
                Files.delete(file);
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        }
    }
}
