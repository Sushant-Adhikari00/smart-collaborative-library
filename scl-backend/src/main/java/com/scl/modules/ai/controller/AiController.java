package com.scl.modules.ai.controller;

import com.scl.modules.ai.dto.AiChatRequest;
import com.scl.modules.ai.dto.AiChatResponse;
import com.scl.modules.ai.dto.AiProcessUrlRequest;
import com.scl.modules.ai.dto.AiProcessResponse;
import com.scl.modules.ai.service.AiServiceClient;
import com.scl.modules.collaboration.repository.DocumentResourceRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "AI", description = "AI-powered document Q&A and indexing endpoints")
public class AiController {

    private final AiServiceClient aiServiceClient;
    private final DocumentResourceRepository documentResourceRepository;

    public AiController(AiServiceClient aiServiceClient,
                        DocumentResourceRepository documentResourceRepository) {
        this.aiServiceClient = aiServiceClient;
        this.documentResourceRepository = documentResourceRepository;
    }

    /**
     * Chat with the AI about already-indexed documents.
     * Documents must be processed first (happens automatically on upload).
     */
    @Operation(summary = "Chat with AI (RAG)", description = "Ask a question about documents that have been uploaded and indexed.")
    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        AiChatResponse response = aiServiceClient.chat(request.getQuestion(), request.getDocumentId());
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
        AiProcessResponse response = aiServiceClient.processDocumentByUrl(request.getFileUrl(), request.getDocumentId());
        return ResponseEntity.ok(response);
    }

    /**
     * Workspace-aware chat: queries the main document AND all shared resource files
     * uploaded by collaborators. Used exclusively by the Shared AI tab.
     */
    @Operation(
        summary = "Shared AI workspace chat",
        description = "Queries the main document plus all shared resources indexed for this document workspace."
    )
    @PostMapping("/chat/workspace")
    public ResponseEntity<AiChatResponse> chatWorkspace(@RequestBody AiChatRequest request) {
        // Build the list of all FAISS document IDs for this workspace:
        // 1. The main document itself
        List<String> documentIds = new ArrayList<>();
        if (request.getDocumentId() != null) {
            documentIds.add(request.getDocumentId());
        }

        // 2. All shared resources uploaded to this document workspace
        //    They are indexed in FAISS as "doc-res-{resourceId}"
        try {
            Long docId = Long.parseLong(request.getDocumentId());
            documentResourceRepository
                .findByDocumentIdOrderByUploadedAtDesc(docId)
                .forEach(res -> documentIds.add("doc-res-" + res.getId()));
        } catch (NumberFormatException ignored) {
            // documentId may not be numeric in some flows — just use it as-is
        }

        AiChatResponse response = aiServiceClient.chatMulti(request.getQuestion(), documentIds);
        return ResponseEntity.ok(response);
    }
}
