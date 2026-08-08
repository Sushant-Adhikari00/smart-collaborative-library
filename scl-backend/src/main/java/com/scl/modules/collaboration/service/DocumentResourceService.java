package com.scl.modules.collaboration.service;

import com.scl.common.SupabaseStorageUtil;
import com.scl.modules.ai.dto.AiProcessResponse;
import com.scl.modules.ai.service.AiServiceClient;
import com.scl.modules.auth.entity.User;
import com.scl.modules.collaboration.dto.DocumentResourceResponse;
import com.scl.modules.collaboration.entity.CollaborationRequestStatus;
import com.scl.modules.collaboration.entity.DocumentResource;
import com.scl.modules.collaboration.repository.CollaborationRequestRepository;
import com.scl.modules.collaboration.repository.DocumentResourceRepository;
import com.scl.modules.document.entity.Document;
import com.scl.modules.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentResourceService {

    private final DocumentResourceRepository resourceRepository;
    private final DocumentRepository documentRepository;
    private final CollaborationRequestRepository requestRepository;
    private final SupabaseStorageUtil storageUtil;
    private final AiServiceClient aiServiceClient;

    @Transactional
    public DocumentResourceResponse uploadResource(Long documentId, String title, String description,
                                                   MultipartFile file, User uploader) {
        validateMembership(documentId, uploader);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File cannot be empty");
        }

        String fileUrl = storageUtil.storeFile(file);
        String fileName = file.getOriginalFilename();
        String fileType = SupabaseStorageUtil.resolveContentType(file);
        long fileSize = file.getSize();

        DocumentResource resource = DocumentResource.builder()
                .documentId(documentId)
                .uploader(uploader)
                .title(title != null && !title.isBlank() ? title : fileName)
                .description(description)
                .fileName(fileName)
                .fileUrl(fileUrl)
                .fileType(fileType)
                .fileSize(fileSize)
                .build();

        DocumentResource savedResource = resourceRepository.save(resource);

        // Process document with AI service asynchronously/inline
        try {
            AiProcessResponse aiResponse = aiServiceClient.processDocumentByUrl(fileUrl, "doc-res-" + savedResource.getId().toString());
            if (aiResponse != null) {
                if (aiResponse.getSummary() != null) {
                    savedResource.setAiSummary(aiResponse.getSummary().getSummary());
                    if (aiResponse.getSummary().getKey_points() != null) {
                        savedResource.setAiKeyPoints(String.join("\n", aiResponse.getSummary().getKey_points()));
                    }
                    if (aiResponse.getSummary().getKeywords() != null) {
                        savedResource.setAiKeywords(String.join(", ", aiResponse.getSummary().getKeywords()));
                    }
                }
                savedResource = resourceRepository.save(savedResource);
            }
        } catch (Exception e) {
            log.warn("AI processing failed for document resource {}: {}", savedResource.getId(), e.getMessage());
        }

        return mapToResponse(savedResource);
    }

    @Transactional(readOnly = true)
    public List<DocumentResourceResponse> getDocumentResources(Long documentId, User user) {
        validateMembership(documentId, user);

        return resourceRepository.findByDocumentIdOrderByUploadedAtDesc(documentId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteResource(Long documentId, Long resourceId, User user) {
        validateMembership(documentId, user);

        DocumentResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        if (!resource.getDocumentId().equals(documentId)) {
            throw new RuntimeException("Resource does not belong to document");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        boolean isUploader = resource.getUploader().getId().equals(user.getId());
        boolean isDocOwner = document.getUploadedBy().equalsIgnoreCase(user.getEmail());

        if (!isUploader && !isDocOwner) {
            throw new RuntimeException("Permission denied to delete resource");
        }

        storageUtil.deleteFile(resource.getFileUrl());
        resourceRepository.delete(resource);
    }

    public void validateMembership(Long documentId, User user) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        boolean isOwner = doc.getUploadedBy().equalsIgnoreCase(user.getEmail());
        boolean isCollaborator = requestRepository.existsByDocumentIdAndRequesterIdAndStatus(
                documentId, user.getId(), CollaborationRequestStatus.ACCEPTED);

        if (!isOwner && !isCollaborator) {
            throw new RuntimeException("User is not a member of document collaboration workspace " + documentId);
        }
    }

    private DocumentResourceResponse mapToResponse(DocumentResource resource) {
        return DocumentResourceResponse.builder()
                .id(resource.getId())
                .documentId(resource.getDocumentId())
                .uploaderId(resource.getUploader().getId())
                .uploaderName(resource.getUploader().getFullName())
                .uploaderRole(resource.getUploader().getRole().name())
                .title(resource.getTitle())
                .description(resource.getDescription())
                .fileName(resource.getFileName())
                .fileUrl(resource.getFileUrl())
                .fileType(resource.getFileType())
                .fileSize(resource.getFileSize())
                .aiSummary(resource.getAiSummary())
                .aiKeyPoints(resource.getAiKeyPoints())
                .aiKeywords(resource.getAiKeywords())
                .uploadedAt(resource.getUploadedAt())
                .build();
    }
}
