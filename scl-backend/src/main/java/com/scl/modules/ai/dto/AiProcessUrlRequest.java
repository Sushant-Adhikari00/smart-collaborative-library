package com.scl.modules.ai.dto;

import lombok.Data;

@Data
public class AiProcessUrlRequest {
    /** Supabase public (or signed) URL of the file to process and index into FAISS. */
    private String fileUrl;
}
