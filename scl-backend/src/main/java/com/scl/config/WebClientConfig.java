package com.scl.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${ai-service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .exchangeStrategies(ExchangeStrategies.builder()
                        .codecs(config -> config
                                .defaultCodecs()
                                .maxInMemorySize(50 * 1024 * 1024)) // 50MB
                        .build())
                .build();
    }

    @Bean
    public WebClient aiWebClient(WebClient.Builder webClientBuilder) {
        return webClientBuilder
                .baseUrl(aiServiceUrl)
                .exchangeStrategies(ExchangeStrategies.builder()
                        .codecs(config -> config
                                .defaultCodecs()
                                .maxInMemorySize(50 * 1024 * 1024)) // 50MB
                        .build())
                .build();
    }
}
