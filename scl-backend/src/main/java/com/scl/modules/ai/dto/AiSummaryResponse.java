package com.scl.modules.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class AiSummaryResponse {
    private String summary;
    private List<String> key_points;
    private List<String> keywords;
}
