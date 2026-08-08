package com.scl.modules.recommendation.service.impl;

import com.scl.common.ApiResponse;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.document.dto.DocumentResponse;
import com.scl.modules.document.entity.Document;
import com.scl.modules.document.entity.DocumentStatus;
import com.scl.modules.document.repository.DocumentCommentRepository;
import com.scl.modules.document.repository.DocumentRatingRepository;
import com.scl.modules.document.repository.DocumentRepository;
import com.scl.modules.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationServiceImpl.class);

    private final DocumentRepository documentRepository;
    private final DocumentRatingRepository documentRatingRepository;
    private final DocumentCommentRepository documentCommentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<?> getRecommendations(String userEmail) {
        try {
            // 1. Fetch all active documents
            List<Document> allDocs = documentRepository.findByStatus(DocumentStatus.ACTIVE);
            if (allDocs.isEmpty()) {
                return ApiResponse.success("No active documents found to recommend", Collections.emptyList());
            }

            Set<Long> preferredCategoryIds = new HashSet<>();
            String currentUsernameOrEmail = userEmail;

            // 2. Identify personalized category preferences if user is logged in
            if (userEmail != null && !userEmail.isBlank() && !userEmail.equalsIgnoreCase("anonymousUser")) {
                Optional<User> userOpt = userRepository.findByEmail(userEmail);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    currentUsernameOrEmail = user.getFullName(); // UploadedBy check can be name, email, etc.

                    // Get categories of documents rated 3+ stars by this user
                    // (Join-free calculation to prevent performance issues)
                    documentRatingRepository.findAll().stream()
                            .filter(r -> r.getUser().getId().equals(user.getId()) && r.getRating() >= 3)
                            .map(r -> r.getDocument().getCategory())
                            .filter(Objects::nonNull)
                            .map(c -> c.getId())
                            .forEach(preferredCategoryIds::add);

                    // Get categories of documents uploaded by this user
                    documentRepository.findByUploadedBy(userEmail).stream()
                            .map(d -> d.getCategory())
                            .filter(Objects::nonNull)
                            .map(c -> c.getId())
                            .forEach(preferredCategoryIds::add);

                    if (user.getFullName() != null) {
                        documentRepository.findByUploadedBy(user.getFullName()).stream()
                                .map(d -> d.getCategory())
                                .filter(Objects::nonNull)
                                .map(c -> c.getId())
                                .forEach(preferredCategoryIds::add);
                    }
                }
            }

            final String finalUser = currentUsernameOrEmail;

            // 3. Score all documents based on average rating + category affinity
            List<Map.Entry<Document, Double>> scoredDocs = new ArrayList<>();
            for (Document doc : allDocs) {
                // Skip documents uploaded by the user themselves to recommend fresh content
                if (finalUser != null && (doc.getUploadedBy().equalsIgnoreCase(finalUser) || doc.getUploadedBy().equalsIgnoreCase(userEmail))) {
                    continue;
                }

                Double avgRating = documentRatingRepository.getAverageRatingByDocumentId(doc.getId().longValue());
                if (avgRating == null || avgRating == 0.0) {
                    avgRating = 3.0; // Default rating for unrated items
                }

                double score = avgRating;

                // Category affinity boost (+1.5 points)
                if (doc.getCategory() != null && preferredCategoryIds.contains(doc.getCategory().getId())) {
                    score += 1.5;
                }

                scoredDocs.add(new AbstractMap.SimpleEntry<>(doc, score));
            }

            // Fallback: if user has uploaded/rated everything, include their own uploads to populate results
            if (scoredDocs.isEmpty()) {
                for (Document doc : allDocs) {
                    Double avgRating = documentRatingRepository.getAverageRatingByDocumentId(doc.getId().longValue());
                    double score = (avgRating != null && avgRating > 0.0) ? avgRating : 3.0;
                    scoredDocs.add(new AbstractMap.SimpleEntry<>(doc, score));
                }
            }

            // 4. Sort documents by score descending and take the top 5
            List<DocumentResponse> recommended = scoredDocs.stream()
                    .sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()))
                    .limit(5)
                    .map(Map.Entry::getKey)
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());

            logger.info("Found {} recommendation(s) for user: {}", recommended.size(), userEmail);
            return ApiResponse.success("Recommendations fetched successfully", recommended);

        } catch (Exception e) {
            logger.error("Error generating recommendations: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to generate recommendations: " + e.getMessage());
        }
    }

    private DocumentResponse mapToResponse(Document document) {
        DocumentResponse response = new DocumentResponse();
        response.setId(document.getId() != null ? document.getId().longValue() : null);
        response.setTitle(document.getTitle());
        response.setDescription(document.getDescription());
        response.setFileName(document.getFileName());
        response.setFileUrl(document.getFileUrl());
        response.setFileType(document.getFileType());
        response.setFileSize(document.getFileSize());
        response.setUploadDate(document.getUploadDate());
        response.setUploadedBy(document.getUploadedBy());
        response.setCategoryName(document.getCategory() != null ? document.getCategory().getName() : null);
        response.setStatus(document.getStatus() != null ? document.getStatus().name() : null);
        
        response.setAiSummary(document.getAiSummary());
        response.setExtractedText(document.getExtractedText());
        response.setChunksCount(document.getChunksCount());
        response.setAiKeyPoints(document.getAiKeyPoints());
        response.setAiKeywords(document.getAiKeywords());
        
        if (document.getId() != null) {
            response.setCommentCount(documentCommentRepository.countByDocumentId(document.getId().longValue()));
        } else {
            response.setCommentCount(0L);
        }
        
        return response;
    }
}
