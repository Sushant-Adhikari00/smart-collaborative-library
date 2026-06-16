package com.scl.scl_backend.modules.core.dto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Handles saving uploaded files to local disk and building a URL/path
 * that can be stored in Document.fileUrl.
 *
 * Swap this out later for an S3Client-based implementation without
 * touching DocumentServiceImpl's business logic — only the storage call changes.
 */
@Component
public class FileStorageUtil {

    // Configure this in application.yml:
    // app:
    //   upload:
    //     dir: uploads/documents
    @Value("${app.upload.dir:uploads/documents}")
    private String uploadDir;

    /**
     * Saves the file to disk with a unique name (UUID prefix) to avoid collisions
     * if two users upload files with the same original name.
     *
     * @return the relative path/URL stored in the Document entity
     */
    public String storeFile(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath); // creates folder if it doesn't exist

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            // Unique name: avoids overwriting files with same name from different users
            String storedFilename = UUID.randomUUID() + extension;

            Path targetPath = uploadPath.resolve(storedFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Returned value is what gets saved in Document.fileUrl.
            // Later this becomes a download endpoint: /api/v1/documents/files/{storedFilename}
            return "/files/" + storedFilename;

        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
    }

    /**
     * Deletes a stored file given the relative path returned by storeFile().
     * Called when a Document is deleted.
     */
    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl == null || fileUrl.isBlank()) return;

            String storedFilename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(storedFilename);
            Files.deleteIfExists(filePath);

        } catch (IOException e) {
            // Don't throw — if the file is already gone, deleting the DB record should still succeed
            throw new RuntimeException("Failed to delete file: " + e.getMessage(), e);
        }
    }
}
