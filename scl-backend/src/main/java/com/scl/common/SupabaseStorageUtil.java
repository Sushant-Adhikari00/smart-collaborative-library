package com.scl.common;

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


    private final WebClient webClient;

    public SupabaseStorageUtil(WebClient webClient) {
        this.webClient = webClient;
    }

    public String storeFile(MultipartFile file) {
        try {
            String extension = getExtension(file.getOriginalFilename());
            String uniqueFilename = UUID.randomUUID() + extension;

            String uploadUrl = supabaseUrl + "/storage/v1/object/"
                    + bucket + "/" + uniqueFilename;

            String contentType = resolveContentType(file);

            webClient.post()
                    .uri(uploadUrl)
                    .header("apikey", supabaseKey)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + supabaseKey)
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .bodyValue(file.getBytes())
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            String publicUrl = supabaseUrl + "/storage/v1/object/public/"
                    + bucket + "/" + uniqueFilename;

            log.info("Uploaded to Supabase [Content-Type: {}]: {}", contentType, publicUrl);
            return publicUrl;

        } catch (Exception e) {
            log.error("Supabase upload failed: {}", e.getMessage());
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
    }

    public static String resolveContentType(MultipartFile file) {
        if (file == null) {
            return "application/octet-stream";
        }
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();

        if (contentType != null && !contentType.isBlank()
                && !"application/json".equalsIgnoreCase(contentType)
                && !"application/octet-stream".equalsIgnoreCase(contentType)) {
            return contentType;
        }

        if (filename != null && filename.contains(".")) {
            String lower = filename.toLowerCase();
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".pdf")) return "application/pdf";
            if (lower.endsWith(".gif")) return "image/gif";
            if (lower.endsWith(".webp")) return "image/webp";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".mp4")) return "video/mp4";
            if (lower.endsWith(".txt")) return "text/plain";
            if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            if (lower.endsWith(".doc")) return "application/msword";
            if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
            if (lower.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            if (lower.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
            if (lower.endsWith(".csv")) return "text/csv";
        }

        return (contentType != null && !contentType.isBlank()) ? contentType : "application/octet-stream";
    }

    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl == null || fileUrl.isBlank()) return;

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

            log.warn("Supabase delete failed: {}", e.getMessage());
        }
    }


    private String getExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        return "";
    }
}
