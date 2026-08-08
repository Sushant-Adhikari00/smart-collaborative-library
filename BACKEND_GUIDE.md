# Smart Collaborative Library (SCL) - Backend Documentation & Guide

## 1. Overview & Tech Stack
The **Backend Module** (`scl-backend`) is built with **Spring Boot 3** (Java 17/21). It serves as the primary REST API provider and real-time WebSocket server for the Smart Collaborative Library system. It manages authentication, document indexing, group management, role-based access control, search routing, and proxying requests to the Python AI service.

### **Core Technologies & Libraries**
- **Framework**: Spring Boot 3, Java 17+
- **Database & ORM**: PostgreSQL, Spring Data JPA / Hibernate
- **Security**: Spring Security + JJWT (JSON Web Token authentication and stateful/stateless authorization)
- **Real-Time Communication**: Spring WebSocket + STOMP Broker with JWT Handshake Interceptor
- **HTTP Client for Inter-Service Communication**: Spring `WebClient` (for asynchronous, non-blocking calls to the Python AI Service)
- **Documentation**: Springdoc OpenAPI / Swagger UI
- **Build Tool**: Apache Maven (`pom.xml`)

---

## 2. Directory & File Mapping

Below is the detailed breakdown of every key package and file in the Backend project.

### **Root & Configuration Files**
- [pom.xml](file:///c:/final_year_project/scl-backend/pom.xml): Maven configuration file specifying dependencies for Spring Boot Starter Web, Security, JPA, WebSocket, PostgreSQL, WebFlux (WebClient), JJWT, and OpenAPI.
- [application.properties / .env](file:///c:/final_year_project/scl-backend/.env): Environment setup for database connections (`jdbc:postgresql://...`), JWT secret key, storage upload paths, and AI service base URL.
- [Dockerfile](file:///c:/final_year_project/scl-backend/Dockerfile): Container build definition for staging/production deployment.

---

### **System Configuration (`com.scl.config`)**
- [SecurityConfig.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/config/SecurityConfig.java): Main Spring Security configuration defining stateless session management, CORS policies, public endpoints (`/api/v1/auth/**`, `/ws/**`, `/swagger-ui/**`), and `JwtAuthFilter` registration.
- [CorsConfig.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/config/CorsConfig.java): Configures cross-origin resource sharing for the React frontend (`http://localhost:5173`).
- [JwtConfig.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/config/JwtConfig.java): Reads JWT secret and expiration settings from environment properties.
- [WebSocketConfig.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/config/WebSocketConfig.java): Configures STOMP endpoints (`/ws`) with SockJS support and message broker destinations (`/topic`, `/app`).
- [JwtHandshakeInterceptor.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/config/JwtHandshakeInterceptor.java): Validates and extracts JWT token during initial WebSocket handshake.
- [WebSocketSecurityConfig.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/config/WebSocketSecurityConfig.java): Secures WebSocket channel messages based on authentication tokens.
- [WebClientConfig.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/config/WebClientConfig.java): Configures WebClient bean for communicating with `scl-ai-service`.
- [WebMvcConfig.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/config/WebMvcConfig.java): Resource mapping for uploaded document files stored locally.
- [AsyncConfig.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/config/AsyncConfig.java): Enables background processing thread pools for asynchronous tasks.
- [OpenApiConfig.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/config/OpenApiConfig.java): Swagger OpenAPI documentation configuration.
- [AppConfig.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/config/AppConfig.java): Defines general application beans (Password Encoders, Model Mappers).

---

### **Security Layer (`com.scl.security`)**
- [JwtAuthFilter.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/security/JwtAuthFilter.java): Per-request security filter that parses `Authorization: Bearer <token>`, verifies signature, and populates `SecurityContextHolder`.
- [JwtTokenProvider.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/security/JwtTokenProvider.java): Utility for generating, validating, and reading claims from JWT access tokens and refresh tokens.
- [UserDetailsServiceImpl.java](file:///c:/final_year_project/scl-backend/src/main/java/com/scl/security/UserDetailsServiceImpl.java): Implements `UserDetailsService` to load user entities by email for Spring Security.

---

### **Business Modules (`com.scl.modules`)**

#### **1. Auth Module (`com.scl.modules.auth`)**
- **`controller/AuthController.java`**: Handles `/api/v1/auth/register`, `/login`, `/refresh-token`, `/forgot-password`, `/reset-password`.
- **`service/AuthService.java`**: Manages user registration, credential validation, token generation, and password hashing (BCrypt).
- **`entity/User.java`**: JPA Entity for users (id, name, email, password, role: USER/TEACHER/ADMIN).

#### **2. Document Module (`com.scl.modules.document`)**
- **`controller/DocumentController.java`**: REST endpoints for uploading documents, fetching public documents, editing metadata, downloading files, and deleting documents.
- **`controller/DocumentFeedbackController.java`**: Manages document-level star ratings and discussion comments.
- **`service/DocumentService.java`**: Handles file storage on disk, database entity creation, triggering AI processing pipeline (summary, keyword extraction, vector indexing).
- **`entity/Document.java`**: JPA Entity containing document metadata, file paths, AI generated key points, and AI summary.

#### **3. Collaboration Module (`com.scl.modules.collaboration`)**
- **`controller/CollaborationDashboardController.java`**: API providing aggregated dashboard stats for study groups, user's joined groups, and notifications.
- **`controller/CollaborationGroupController.java`**: Group lifecycle endpoints (create group, get group details, edit group, delete group, join via invite code, leave group).
- **`controller/CollaborationRequestController.java`**: Handles study group membership join requests and leader approval/rejection workflows.
- **`controller/GroupResourceController.java`**: Group resource file storage, verification toggle (by teacher/leader), and pinning.
- **`controller/ResourceCommentController.java`**: Comments and threaded discussion responses under shared group resources.
- **`controller/TeacherAnnouncementController.java`**: Allows teachers to create and list announcements for group members.
- **`controller/NotificationController.java`**: Fetches and marks user notifications read.

#### **4. Chat Module (`com.scl.modules.chat`)**
- **`controller/ChatRestController.java`**: REST endpoint to fetch paginated historical chat messages (`/api/v1/chat/rooms/{roomId}/messages`).
- **`controller/ChatWebSocketController.java`**: STOMP controller listening on `/app/chat.send` and broadcasting incoming chat messages to `/topic/chat/{roomId}`.
- **`service/ChatService.java`**: Persists chat messages to PostgreSQL and manages room authorization.

#### **5. AI Integration Module (`com.scl.modules.ai`)**
- **`controller/AiController.java`**: Handles document Q&A, chat queries, and document summarization requests by forwarding requests to `scl-ai-service` via `WebClient`.
- **`service/AiService.java`**: Asynchronous service wrapper communicating with FastAPI endpoints (`/process-document`, `/rag/query`, `/summarize`).

#### **6. Search Module (`com.scl.modules.search`)**
- **`controller/SearchController.java`**: Handles keyword and hybrid semantic search across uploaded documents and resources.

#### **7. Admin Module (`com.scl.modules.admin`)**
- **`controller/AdminController.java`**: Admin-only REST endpoints for user management, role modification, content moderation, and metrics inspection.

---

## 3. Core Backend Workflows
1. **Document Upload & AI Sync Pipeline**:
   Frontend upload -> `DocumentController` -> `DocumentService` stores file to disk -> Async call via `WebClient` to `scl-ai-service` (`/process-document`) -> Receives AI summary & keywords -> Updates `Document` entity in PostgreSQL.
2. **Real-time STOMP Chat Pipeline**:
   Frontend connects via SockJS (`/ws`) -> `JwtHandshakeInterceptor` validates token -> User sends message to `/app/chat.send` -> `ChatWebSocketController` validates access -> `ChatService` saves message to DB -> STOMP Broker broadcasts message to all clients subscribed to `/topic/chat/{roomId}`.
