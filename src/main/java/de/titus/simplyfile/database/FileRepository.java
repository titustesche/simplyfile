package de.titus.simplyfile.database;

import de.titus.simplyfile.database.models.FileModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FileRepository extends JpaRepository<FileModel, UUID> {
}
