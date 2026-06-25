package com.scl.scl_backend.modules.core.dto;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.UUID;

@Component
@Slf4j
public class SupabaseStorageUtil {

    // These 3 values come from application.yml
    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket}")
    private String bucket;

    // WebClient bean injected from WebClientConfig
    private final WebClient webClient;

    // Constructor injection — Spring finds the WebClient bean from WebClientConfig
    public SupabaseStorageUtil(WebClient webClient) {
        this.webClient = webClient;
    }

    // ─────────────────────────────────────────────────────────────────
    // UPLOAD — saves file to Supabase bucket, returns public URL
    // That public URL is what gets stored in Document.fileUrl column
    // ─────────────────────────────────────────────────────────────────
    public String storeFile(MultipartFile file) {
        try {
            // Step 1: generate a unique filename (uuid + original extension)
            // e.g. "lecture.pdf" → "8cf4d5a9-xxxx.pdf"
            String extension = getExtension(file.getOriginalFilename());
            String uniqueFilename = UUID.randomUUID() + extension;

            // Step 2: build the Supabase upload URL
            // format: {supabaseUrl}/storage/v1/object/{bucket}/{filename}
            String uploadUrl = supabaseUrl + "/storage/v1/object/"
                    + bucket + "/" + uniqueFilename;

            // Step 3: POST the file bytes to Supabase
            webClient.post()
                    .uri(uploadUrl)
                    .header("apikey", supabaseKey)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + supabaseKey)
                    .header(HttpHeaders.CONTENT_TYPE,
                            file.getContentType() != null
                                    ? file.getContentType()
                                    : "application/octet-stream")
                    .bodyValue(file.getBytes())
                    .retrieve()
                    .toBodilessEntity()
                    .block(); // block() = wait for response (synchronous)

            // Step 4: build and return the public URL
            // This is the URL anyone can use to view/download the file
            // format: {supabaseUrl}/storage/v1/object/public/{bucket}/{filename}
            String publicUrl = supabaseUrl + "/storage/v1/object/public/"
                    + bucket + "/" + uniqueFilename;

            log.info("Uploaded to Supabase: {}", publicUrl);
            return publicUrl;

        } catch (Exception e) {
            log.error("Supabase upload failed: {}", e.getMessage());
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // DELETE — removes file from Supabase bucket
    // Called when a Document is deleted from the system
    // ─────────────────────────────────────────────────────────────────
    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl == null || fileUrl.isBlank()) return;

            // Extract just the filename from the full URL
            // e.g. "https://xxx.supabase.co/.../8cf4d5a9.pdf" → "8cf4d5a9.pdf"
            String filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

            String deleteUrl = supabaseUrl + "/storage/v1/object/"
                    + bucket + "/" + filename;

            webClient.delete()
                    .uri(deleteUrl)
                    .header("apikey", supabaseKey)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + supabaseKey)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            log.info("Deleted from Supabase: {}", filename);

        } catch (Exception e) {
            // Log but don't throw — if file is already gone,
            // we still want the DB record to be deleted
            log.warn("Supabase delete failed: {}", e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // HELPER — extracts file extension from filename
    // "lecture.pdf" → ".pdf" | "notes" → ""
    // ─────────────────────────────────────────────────────────────────
    private String getExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        return "";
    }
}