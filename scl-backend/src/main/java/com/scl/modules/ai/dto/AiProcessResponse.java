package com.scl.modules.ai.dto;

import lombok.Data;

@Data
public class AiProcessResponse {
    private String text;
    private AiSummaryResponse summary;
    private String type;
    private Integer chunks_count;
}
