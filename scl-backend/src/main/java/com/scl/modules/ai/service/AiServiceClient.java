package com.scl.modules.ai.service;

import com.scl.modules.ai.dto.AiChatRequest;
import com.scl.modules.ai.dto.AiChatResponse;
import com.scl.modules.ai.dto.AiProcessResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;

@Slf4j
@Service
public class AiServiceClient {

    private final WebClient aiWebClient;

    public AiServiceClient(WebClient aiWebClient) {
        this.aiWebClient = aiWebClient;
    }

    public AiProcessResponse processDocumentByUrl(String fileUrl, String documentId) {
        try {
            return aiWebClient.post()
                    .uri("/ai/process-url")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(java.util.Map.of(
                        "url", fileUrl,
                        "document_id", documentId
                    ))
                    .retrieve()
                    .bodyToMono(AiProcessResponse.class)
                    .block();
        } catch (WebClientRequestException e) {
            log.error("AI service is unreachable at process-url. Is the AI service running on port 8000? Error: {}", e.getMessage());
            throw new RuntimeException("AI service is currently unavailable. Please make sure the AI service is running.", e);
        } catch (WebClientResponseException e) {
            log.error("AI service returned error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("AI service error: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Unexpected error calling AI service process-url: {}", e.getMessage());
            throw new RuntimeException("Failed to communicate with AI service: " + e.getMessage(), e);
        }
    }

    public AiChatResponse chat(String question, String documentId) {
        try {
            return aiWebClient.post()
                    .uri("/ai/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(java.util.Map.of(
                        "question", question,
                        "document_id", documentId
                    ))
                    .retrieve()
                    .bodyToMono(AiChatResponse.class)
                    .block();
        } catch (WebClientRequestException e) {
            log.error("AI service is unreachable at chat. Is the AI service running on port 8000? Error: {}", e.getMessage());
            throw new RuntimeException("AI service is currently unavailable. Please make sure the AI service is running.", e);
        } catch (WebClientResponseException e) {
            log.error("AI service returned error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("AI service error: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Unexpected error calling AI service chat: {}", e.getMessage());
            throw new RuntimeException("Failed to communicate with AI service: " + e.getMessage(), e);
        }
    }

    public AiChatResponse chatMulti(String question, List<String> documentIds) {
        try {
            return aiWebClient.post()
                    .uri("/ai/chat-multi")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(java.util.Map.of(
                        "question", question,
                        "document_ids", documentIds
                    ))
                    .retrieve()
                    .bodyToMono(AiChatResponse.class)
                    .block();
        } catch (WebClientRequestException e) {
            log.error("AI service is unreachable at chat-multi. Is the AI service running on port 8000? Error: {}", e.getMessage());
            throw new RuntimeException("AI service is currently unavailable. Please make sure the AI service is running.", e);
        } catch (WebClientResponseException e) {
            log.error("AI service returned error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("AI service error: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Unexpected error calling AI service chat-multi: {}", e.getMessage());
            throw new RuntimeException("Failed to communicate with AI service: " + e.getMessage(), e);
        }
    }
}
