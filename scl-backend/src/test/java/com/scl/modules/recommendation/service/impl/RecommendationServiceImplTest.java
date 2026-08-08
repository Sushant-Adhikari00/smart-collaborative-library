package com.scl.modules.recommendation.service.impl;

import com.scl.common.ApiResponse;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.document.dto.DocumentResponse;
import com.scl.modules.document.entity.Category;
import com.scl.modules.document.entity.Document;
import com.scl.modules.document.entity.DocumentRating;
import com.scl.modules.document.entity.DocumentStatus;
import com.scl.modules.document.repository.DocumentCommentRepository;
import com.scl.modules.document.repository.DocumentRatingRepository;
import com.scl.modules.document.repository.DocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RecommendationServiceImplTest {

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DocumentRatingRepository documentRatingRepository;
    @Mock
    private DocumentCommentRepository documentCommentRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RecommendationServiceImpl recommendationService;

    private List<Document> mockDocuments;
    private User mockUser;
    private Category catScience;
    private Category catMath;

    @BeforeEach
    void setUp() {
        catScience = new Category();
        catScience.setId(1L);
        catScience.setName("Science");

        catMath = new Category();
        catMath.setId(2L);
        catMath.setName("Math");

        mockUser = new User();
        mockUser.setId(100L);
        mockUser.setEmail("test@student.com");
        mockUser.setFullName("Test Student");

        Document doc1 = new Document();
        doc1.setId(1);
        doc1.setTitle("Intro to Physics");
        doc1.setCategory(catScience);
        doc1.setUploadedBy("Professor Newton");
        doc1.setStatus(DocumentStatus.ACTIVE);

        Document doc2 = new Document();
        doc2.setId(2);
        doc2.setTitle("Advanced Calculus");
        doc2.setCategory(catMath);
        doc2.setUploadedBy("Professor Euler");
        doc2.setStatus(DocumentStatus.ACTIVE);

        Document doc3 = new Document();
        doc3.setId(3);
        doc3.setTitle("Organic Chemistry");
        doc3.setCategory(catScience);
        doc3.setUploadedBy("test@student.com"); // Uploaded by the user
        doc3.setStatus(DocumentStatus.ACTIVE);

        mockDocuments = Arrays.asList(doc1, doc2, doc3);
    }

    @Test
    void testGetRecommendationsForGuest() {
        when(documentRepository.findByStatus(DocumentStatus.ACTIVE)).thenReturn(mockDocuments);
        when(documentRatingRepository.getAverageRatingByDocumentId(1L)).thenReturn(4.5);
        when(documentRatingRepository.getAverageRatingByDocumentId(2L)).thenReturn(3.8);
        when(documentRatingRepository.getAverageRatingByDocumentId(3L)).thenReturn(4.9);

        ApiResponse<?> apiResponse = recommendationService.getRecommendations(null);

        assertTrue(apiResponse.isSuccess());
        List<DocumentResponse> recs = (List<DocumentResponse>) apiResponse.getData();
        
        // Output size should contain doc3 because guest email doesn't match uploader
        assertEquals(3, recs.size());
        
        // Doc3 should be first as it has 4.9 average rating
        assertEquals("Organic Chemistry", recs.get(0).getTitle());
        assertEquals("Intro to Physics", recs.get(1).getTitle());
    }

    @Test
    void testGetRecommendationsForLoggedInUserFiltersOwnUploads() {
        when(documentRepository.findByStatus(DocumentStatus.ACTIVE)).thenReturn(mockDocuments);
        when(userRepository.findByEmail("test@student.com")).thenReturn(Optional.of(mockUser));
        when(documentRatingRepository.getAverageRatingByDocumentId(1L)).thenReturn(4.0);
        when(documentRatingRepository.getAverageRatingByDocumentId(2L)).thenReturn(3.0);
        
        // Mock preferences: user has uploaded files in "Science" category (doc3 is Science)
        when(documentRepository.findByUploadedBy("test@student.com")).thenReturn(Collections.singletonList(mockDocuments.get(2)));

        ApiResponse<?> apiResponse = recommendationService.getRecommendations("test@student.com");

        assertTrue(apiResponse.isSuccess());
        List<DocumentResponse> recs = (List<DocumentResponse>) apiResponse.getData();

        // Own uploads (doc3) must be filtered out
        assertEquals(2, recs.size());
        assertFalse(recs.stream().anyMatch(d -> d.getTitle().equals("Organic Chemistry")));
    }
}
