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
                    .block();
            String publicUrl = supabaseUrl + "/storage/v1/object/public/"
                    + bucket + "/" + uniqueFilename;

            log.info("Uploaded to Supabase: {}", publicUrl);
            return publicUrl;

        } catch (Exception e) {
            log.error("Supabase upload failed: {}", e.getMessage());
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
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
