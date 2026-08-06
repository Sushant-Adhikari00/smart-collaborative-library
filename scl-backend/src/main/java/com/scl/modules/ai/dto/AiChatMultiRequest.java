package com.scl.modules.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class AiChatMultiRequest {
    private String question;
    /** Main document ID + all shared resource FAISS IDs (e.g. "42", "doc-res-3", "doc-res-7") */
    private List<String> documentIds;
}
