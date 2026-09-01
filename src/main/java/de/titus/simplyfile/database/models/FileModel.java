package de.titus.simplyfile.database.models;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "files")
public class FileModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;
    private String sha256;
    private String path;
    private String type;
    private Long size;

    public FileModel() {   }

    public FileModel(
            String name,
            String sha256,
            String path,
            String type,
            Long size
    ) {
        this.name = name;
        this.sha256 = sha256;
        this.path = path;
        this.type = type;
        this.size = size;
    }

    //region Getters

    public UUID getId() { return id; }

    public String getName() { return name; }

    public String getSha256() { return sha256; }

    public String getPath() { return path; }

    public String getType() { return type; }

    public Long getSize() { return size; }

    //endregion
    //region Setters

    public String setPath(String path) { return this.path = path; }

    public String setType(String type) { return this.type = type; }

    public Long setSize(Long size) { return this.size = size; }

    public String setName(String name) { return this.name = name; }

    public String setSha256(String sha256) { return this.sha256 = sha256; }

    //endregion
}
