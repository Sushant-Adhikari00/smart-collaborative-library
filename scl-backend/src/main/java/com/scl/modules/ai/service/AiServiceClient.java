package com.scl.modules.ai.service;

import com.scl.modules.ai.dto.AiChatRequest;
import com.scl.modules.ai.dto.AiChatResponse;
import com.scl.modules.ai.dto.AiProcessResponse;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;

@Service
public class AiServiceClient {

    private final WebClient aiWebClient;

    public AiServiceClient(WebClient aiWebClient) {
        this.aiWebClient = aiWebClient;
    }

    public AiProcessResponse processDocumentByUrl(String fileUrl) {
        return aiWebClient.post()
                .uri("/ai/process-url")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(java.util.Map.of("url", fileUrl))
                .retrieve()
                .bodyToMono(AiProcessResponse.class)
                .block(); // Blocking because we are calling from standard synchronous Spring MVC
    }

    public AiChatResponse chat(String question) {
        AiChatRequest request = new AiChatRequest();
        request.setQuestion(question);

        return aiWebClient.post()
                .uri("/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AiChatResponse.class)
                .block();
    }
}
