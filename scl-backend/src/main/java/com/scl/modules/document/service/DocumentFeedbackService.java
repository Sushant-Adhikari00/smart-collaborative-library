package com.scl.modules.document.service;

import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.document.dto.*;
import com.scl.modules.document.entity.Document;
import com.scl.modules.document.entity.DocumentComment;
import com.scl.modules.document.entity.DocumentRating;
import com.scl.modules.document.repository.DocumentCommentRepository;
import com.scl.modules.document.repository.DocumentRatingRepository;
import com.scl.modules.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentFeedbackService {

    private final DocumentRepository documentRepository;
    private final DocumentCommentRepository commentRepository;
    private final DocumentRatingRepository ratingRepository;

    // ─── COMMENTS ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DocumentCommentResponse> getComments(Long documentId) {
        if (!documentRepository.existsById(documentId)) {
            return Collections.emptyList();
        }
        return commentRepository
                .findByDocumentIdAndParentCommentIsNullOrderByCreatedAtAsc(documentId)
                .stream()
                .map(this::mapComment)
                .collect(Collectors.toList());
    }

    @Transactional
    public DocumentCommentResponse addComment(Long documentId, AddDocumentCommentRequest request, User author) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

        DocumentComment parent = null;
        if (request.getParentCommentId() != null) {
            parent = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
        }

        DocumentComment comment = DocumentComment.builder()
                .document(document)
                .author(author)
                .parentComment(parent)
                .content(request.getContent())
                .build();

        return mapComment(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, User user) {
        DocumentComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Permission denied to delete this comment");
        }
        commentRepository.delete(comment);
    }

    // ─── RATINGS ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DocumentRatingResponse getRating(Long documentId, User user) {
        Double avg = ratingRepository.getAverageRatingByDocumentId(documentId);
        long count = ratingRepository.countByDocumentId(documentId);
        Integer userRating = user != null
                ? ratingRepository.findByDocumentIdAndUserId(documentId, user.getId())
                        .map(DocumentRating::getRating).orElse(null)
                : null;
        return DocumentRatingResponse.builder()
                .documentId(documentId)
                .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalRatings(count)
                .userRating(userRating)
                .build();
    }

    @Transactional
    public DocumentRatingResponse rateDocument(Long documentId, int stars, User user) {
        if (stars < 1 || stars > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

        DocumentRating rating = ratingRepository.findByDocumentIdAndUserId(documentId, user.getId())
                .orElse(DocumentRating.builder()
                        .document(document)
                        .user(user)
                        .build());
        rating.setRating(stars);
        ratingRepository.save(rating);

        return getRating(documentId, user);
    }

    // ─── MAPPING ──────────────────────────────────────────────────────────────

    private DocumentCommentResponse mapComment(DocumentComment c) {
        List<DocumentCommentResponse> replies = c.getReplies() != null
                ? c.getReplies().stream().map(this::mapComment).collect(Collectors.toList())
                : Collections.emptyList();

        return DocumentCommentResponse.builder()
                .id(c.getId())
                .documentId(c.getDocument() != null ? c.getDocument().getId().longValue() : null)
                .authorId(c.getAuthor() != null ? c.getAuthor().getId() : null)
                .authorName(c.getAuthor() != null ? c.getAuthor().getFullName() : "Anonymous")
                .authorProfilePicture(c.getAuthor() != null ? c.getAuthor().getProfilePicture() : null)
                .content(c.getContent())
                .parentCommentId(c.getParentComment() != null ? c.getParentComment().getId() : null)
                .replies(replies)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
