package com.scl.modules.collaboration.controller;

import com.scl.common.ApiResponse;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.collaboration.dto.CollaborationRequestDto;
import com.scl.modules.collaboration.dto.CollaborationRequestResponse;
import com.scl.modules.collaboration.entity.CollaborationRequest;
import com.scl.modules.collaboration.entity.CollaborationRequestStatus;
import com.scl.modules.collaboration.entity.NotificationType;
import com.scl.modules.collaboration.repository.CollaborationRequestRepository;
import com.scl.modules.collaboration.service.NotificationService;
import com.scl.modules.document.entity.Document;
import com.scl.modules.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping({"/api/v1/collaboration", "/api/collaboration"})
@RequiredArgsConstructor
public class CollaborationRequestController {

    private static final int MAX_REQUESTS_PER_DOC = 2;

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final NotificationService notificationService;
    private final CollaborationRequestRepository requestRepository;

    // ─── SEND REQUEST ──────────────────────────────────────────────────────────

    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<CollaborationRequestResponse>> sendRequest(
            @RequestBody CollaborationRequestDto requestDto,
            Authentication authentication) {

        User requester = getAuthenticatedUser(authentication);
        Long docId = requestDto.getDocumentId();

        if (docId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Document ID is required."));
        }

        // Enforce max 2 requests per document per user
        long existingCount = requestRepository.countByDocumentIdAndRequesterId(docId, requester.getId());
        if (existingCount >= MAX_REQUESTS_PER_DOC) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("You have reached the maximum collaboration request limit (2/2)."));
        }

        // Prevent duplicate PENDING request
        boolean hasPending = requestRepository.existsByDocumentIdAndRequesterIdAndStatus(
                docId, requester.getId(), CollaborationRequestStatus.PENDING);
        if (hasPending) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("You already have a pending request for this document."));
        }

        // Resolve document info
        String docTitle = "Academic Document";
        String ownerEmail = null;
        Long ownerId = null;

        Optional<Document> docOpt = documentRepository.findById(docId);
        if (docOpt.isPresent()) {
            Document doc = docOpt.get();
            docTitle = doc.getTitle();
            ownerEmail = doc.getUploadedBy();
        }

        // Resolve owner
        User owner = null;
        if (ownerEmail != null) {
            owner = userRepository.findByEmail(ownerEmail).orElse(null);
            if (owner != null) ownerId = owner.getId();
        }

        // Prevent requesting access to own document
        if (owner != null && owner.getId().equals(requester.getId())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("You cannot request access to your own document."));
        }

        // Build and persist the collaboration request
        String customMessage = (requestDto.getMessage() != null && !requestDto.getMessage().isBlank())
                ? requestDto.getMessage()
                : requester.getFullName() + " requested to join the collaboration workspace for \"" + docTitle + "\".";

        CollaborationRequest saved = requestRepository.save(
                CollaborationRequest.builder()
                        .requesterId(requester.getId())
                        .requesterName(requester.getFullName() != null ? requester.getFullName() : requester.getEmail())
                        .requesterEmail(requester.getEmail())
                        .documentId(docId)
                        .documentTitle(docTitle)
                        .ownerId(ownerId)
                        .ownerEmail(ownerEmail)
                        .message(customMessage)
                        .status(CollaborationRequestStatus.PENDING)
                        .build()
        );

        // Notify the document owner with the request ID embedded in targetUrl
        if (owner != null) {
            notificationService.sendNotification(
                    owner,
                    "New Collaboration Request",
                    customMessage,
                    NotificationType.COLLABORATION_REQUEST,
                    "/collaboration/requests/" + saved.getId()
            );
        } else {
            log.warn("Could not find owner for document {} (uploadedBy: {}). Notification not sent.", docId, ownerEmail);
        }

        return ResponseEntity.ok(ApiResponse.success(
                "Collaboration request sent successfully",
                toResponse(saved)
        ));
    }

    // ─── GET REQUEST COUNT ─────────────────────────────────────────────────────

    @GetMapping("/requests/count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRequestCount(
            @RequestParam("documentId") Long documentId,
            Authentication authentication) {
        User requester = getAuthenticatedUser(authentication);
        long count = requestRepository.countByDocumentIdAndRequesterId(documentId, requester.getId());
        return ResponseEntity.ok(ApiResponse.success("Request count retrieved", Map.of("count", count)));
    }

    // ─── GET PENDING REQUESTS (for owner) ─────────────────────────────────────

    @GetMapping("/requests/pending")
    public ResponseEntity<ApiResponse<List<CollaborationRequestResponse>>> getPendingRequests(
            Authentication authentication) {
        User owner = getAuthenticatedUser(authentication);
        List<CollaborationRequest> pending =
                requestRepository.findByOwnerIdAndStatus(owner.getId(), CollaborationRequestStatus.PENDING);
        List<CollaborationRequestResponse> responses = pending.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Pending collaboration requests retrieved", responses));
    }

    // ─── ACCEPT REQUEST ────────────────────────────────────────────────────────

    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<ApiResponse<CollaborationRequestResponse>> acceptRequest(
            @PathVariable Long requestId,
            Authentication authentication) {

        User owner = getAuthenticatedUser(authentication);
        CollaborationRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Collaboration request not found: " + requestId));

        // Security: only the document owner can accept
        if (!owner.getId().equals(req.getOwnerId())) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("You are not authorized to accept this request."));
        }

        if (req.getStatus() != CollaborationRequestStatus.PENDING) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("This request has already been " + req.getStatus().name().toLowerCase() + "."));
        }

        req.setStatus(CollaborationRequestStatus.ACCEPTED);
        requestRepository.save(req);

        // Notify the requester that their request was accepted
        userRepository.findByEmail(req.getRequesterEmail()).ifPresent(requester ->
                notificationService.sendNotification(
                        requester,
                        "Collaboration Request Accepted! 🎉",
                        "Your request to join the collaboration workspace for \"" + req.getDocumentTitle()
                                + "\" has been accepted by " + owner.getFullName() + ".",
                        NotificationType.COLLABORATION_ACCEPTED,
                        "/collaboration/doc/" + req.getDocumentId()
                )
        );

        log.info("Collaboration request {} accepted by owner {}", requestId, owner.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Collaboration request accepted", toResponse(req)));
    }

    // ─── REJECT REQUEST ────────────────────────────────────────────────────────

    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<ApiResponse<CollaborationRequestResponse>> rejectRequest(
            @PathVariable Long requestId,
            Authentication authentication) {

        User owner = getAuthenticatedUser(authentication);
        CollaborationRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Collaboration request not found: " + requestId));

        if (!owner.getId().equals(req.getOwnerId())) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("You are not authorized to reject this request."));
        }

        if (req.getStatus() != CollaborationRequestStatus.PENDING) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("This request has already been " + req.getStatus().name().toLowerCase() + "."));
        }

        req.setStatus(CollaborationRequestStatus.REJECTED);
        requestRepository.save(req);

        // Notify the requester
        userRepository.findByEmail(req.getRequesterEmail()).ifPresent(requester ->
                notificationService.sendNotification(
                        requester,
                        "Collaboration Request Update",
                        "Your request to join the collaboration workspace for \"" + req.getDocumentTitle()
                                + "\" was not approved at this time.",
                        NotificationType.COLLABORATION_REJECTED,
                        "/collaboration/doc/" + req.getDocumentId()
                )
        );

        log.info("Collaboration request {} rejected by owner {}", requestId, owner.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Collaboration request rejected", toResponse(req)));
    }

    // ─── CHECK MEMBER STATUS ───────────────────────────────────────────────────

    @GetMapping("/groups/check-member")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkMemberStatus(
            @RequestParam("documentId") Long documentId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        // A user is considered a "member" if any of their requests for this document were accepted
        boolean isMember = requestRepository.existsByDocumentIdAndRequesterIdAndStatus(
                documentId, user.getId(), CollaborationRequestStatus.ACCEPTED);
        return ResponseEntity.ok(ApiResponse.success("Member status retrieved", Map.of("isMember", isMember)));
    }

    // ─── GET DOCUMENT WORKSPACE MEMBERS ─────────────────────────────────────────

    @GetMapping("/documents/{documentId}/members")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDocumentMembers(
            @PathVariable Long documentId,
            Authentication authentication) {

        List<Map<String, Object>> membersList = new java.util.ArrayList<>();

        // 1. Fetch document and owner details
        Optional<Document> docOpt = documentRepository.findById(documentId);
        if (docOpt.isPresent()) {
            Document doc = docOpt.get();
            String ownerEmail = doc.getUploadedBy();
            User ownerUser = null;
            if (ownerEmail != null && !ownerEmail.isBlank()) {
                ownerUser = userRepository.findByEmail(ownerEmail).orElse(null);
            }

            membersList.add(Map.of(
                    "userId", ownerUser != null ? ownerUser.getId() : 0L,
                    "fullName", ownerUser != null && ownerUser.getFullName() != null ? ownerUser.getFullName() : (ownerEmail != null ? ownerEmail : "Resource Owner"),
                    "email", ownerEmail != null ? ownerEmail : "owner@scl.edu",
                    "groupRole", "OWNER",
                    "userRole", ownerUser != null ? ownerUser.getRole().name() : "TEACHER",
                    "status", "online"
            ));
        }

        // 2. Fetch accepted collaborators for this document
        List<CollaborationRequest> acceptedRequests =
                requestRepository.findByDocumentIdAndStatus(documentId, CollaborationRequestStatus.ACCEPTED);

        for (CollaborationRequest req : acceptedRequests) {
            User reqUser = userRepository.findByEmail(req.getRequesterEmail()).orElse(null);
            membersList.add(Map.of(
                    "userId", req.getRequesterId() != null ? req.getRequesterId() : 0L,
                    "fullName", req.getRequesterName() != null ? req.getRequesterName() : req.getRequesterEmail(),
                    "email", req.getRequesterEmail() != null ? req.getRequesterEmail() : "",
                    "groupRole", "MEMBER",
                    "userRole", reqUser != null ? reqUser.getRole().name() : "STUDENT",
                    "status", "online"
            ));
        }

        return ResponseEntity.ok(ApiResponse.success("Document workspace members fetched", membersList));
    }

    // ─── HELPERS ───────────────────────────────────────────────────────────────

    private CollaborationRequestResponse toResponse(CollaborationRequest req) {
        return CollaborationRequestResponse.builder()
                .id(req.getId())
                .requesterId(req.getRequesterId())
                .requesterName(req.getRequesterName())
                .requesterEmail(req.getRequesterEmail())
                .documentId(req.getDocumentId())
                .documentTitle(req.getDocumentTitle())
                .ownerId(req.getOwnerId())
                .ownerEmail(req.getOwnerEmail())
                .message(req.getMessage())
                .status(req.getStatus())
                .createdAt(req.getCreatedAt())
                .build();
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + authentication.getName()));
    }
}
