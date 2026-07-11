package com.scl.modules.ai.controller;

import com.scl.modules.ai.dto.AiChatRequest;
import com.scl.modules.ai.dto.AiChatResponse;
import com.scl.modules.ai.dto.AiProcessUrlRequest;
import com.scl.modules.ai.dto.AiProcessResponse;
import com.scl.modules.ai.service.AiServiceClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "AI", description = "AI-powered document Q&A and indexing endpoints")
public class AiController {

    private final AiServiceClient aiServiceClient;

    public AiController(AiServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    /**
     * Chat with the AI about already-indexed documents.
     * Documents must be processed first (happens automatically on upload).
     */
    @Operation(summary = "Chat with AI (RAG)", description = "Ask a question about documents that have been uploaded and indexed.")
    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        AiChatResponse response = aiServiceClient.chat(request.getQuestion());
        return ResponseEntity.ok(response);
    }

    /**
     * Manually re-process and re-index a document from its Supabase URL.
     * Use this if the FAISS index was cleared or the document was uploaded
     * before the AI service was running.
     */
    @Operation(
        summary = "Re-index a document from Supabase URL",
        description = "Downloads the file from the given Supabase URL, extracts text, embeds it, and stores it in FAISS so it can be queried via /chat."
    )
    @PostMapping("/process-url")
    public ResponseEntity<AiProcessResponse> processUrl(@RequestBody AiProcessUrlRequest request) {
        AiProcessResponse response = aiServiceClient.processDocumentByUrl(request.getFileUrl());
        return ResponseEntity.ok(response);
    }
}
