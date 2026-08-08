# Smart Collaborative Library (SCL) - Frontend Documentation & Guide

## 1. Overview & Tech Stack
The **Frontend Module** (`scl-frontend/scl`) is a modern React single-page application built with Vite. It provides an intuitive, responsive user interface for document sharing, AI interaction, real-time collaboration, and workspace management.

### **Core Technologies & Libraries**
- **Framework & Build Tool**: React 19, Vite (Fast HMR & build bundling)
- **Routing**: `react-router` v7 (Client-side routing & protected route guards)
- **Styling & UI**: TailwindCSS v3, DaisyUI v4 (Utility-first CSS & components with theme switching: retro/coffee)
- **Icons & UI Feedback**: `lucide-react` (Modern icons), `react-hot-toast` (Toast notifications)
- **HTTP Client**: Axios (Configured with request/response interceptors for JWT auth & 401 automatic token refresh/logout)
- **Real-Time Communication**: `@stomp/stompjs` + `sockjs-client` (STOMP over WebSocket for real-time group chat & live updates)

---

## 2. Directory & File Mapping

Below is the detailed breakdown of every single file in the Frontend project and its specific responsibilities.

### **Root & Configuration Files**
- [package.json](file:///c:/final_year_project/scl-frontend/scl/package.json): Defines project metadata, npm dependencies (React 19, Axios, STOMP, Lucide, DaisyUI), and scripts (`dev`, `build`, `lint`, `preview`).
- [vite.config.js](file:///c:/final_year_project/scl-frontend/scl/vite.config.js): Vite configuration enabling the React plugin and dev server port/proxy settings.
- [tailwind.config.js](file:///c:/final_year_project/scl-frontend/scl/tailwind.config.js): Configures Tailwind CSS content paths and DaisyUI themes (`retro`, `coffee`).
- [postcss.config.js](file:///c:/final_year_project/scl-frontend/scl/postcss.config.js): PostCSS pipeline with TailwindCSS and Autoprefixer.
- [eslint.config.js](file:///c:/final_year_project/scl-frontend/scl/eslint.config.js): ESLint rules for code quality and React Hooks validation.
- [index.html](file:///c:/final_year_project/scl-frontend/scl/index.html): HTML entry point loading Google fonts and `src/main.jsx`.

---

### **Core Application Files (`src/`)**
- [main.jsx](file:///c:/final_year_project/scl-frontend/scl/src/main.jsx): React entry file that renders `<App />` inside `React.StrictMode` into `#root`.
- [App.jsx](file:///c:/final_year_project/scl-frontend/scl/src/App.jsx): Root component containing layout structure, theme management, search query state, `<AuthProvider>`, and top-level URL routes (`/`, `/login`, `/signup`, `/create`, `/collaboration`, `/admin`, etc.) with `ProtectedRoute` and `ProtectedAdminRoute` wrappers.
- [App.css](file:///c:/final_year_project/scl-frontend/scl/src/App.css): Custom CSS utility classes, animations (fade-in), scrollbar styling, and theme overrides.
- [index.css](file:///c:/final_year_project/scl-frontend/scl/src/index.css): Imports Tailwind directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`).

---

### **State & Context (`src/context/`)**
- [authContext.jsx](file:///c:/final_year_project/scl-frontend/scl/src/context/authContext.jsx): Provides global authentication state (`user`, `setUser`, `logout`). Synchronously hydrates user state from `localStorage` to avoid flash-of-unauthenticated states.

---

### **Services & HTTP (`src/services/` & `src/lib/`)**
- [lib/axios.js](file:///c:/final_year_project/scl-frontend/scl/src/lib/axios.js): Configures Axios instance pointing to `http://localhost:8080/api/v1`. Adds `Authorization: Bearer <token>` to requests and intercepts 401 errors to clear credentials and redirect to `/login`.
- [services/api.js](file:///c:/final_year_project/scl-frontend/scl/src/services/api.js): Re-exports the configured Axios instance for global usage.
- [services/collaborationApi.js](file:///c:/final_year_project/scl-frontend/scl/src/services/collaborationApi.js): API module handling backend calls for:
  - Collaboration Dashboards & Groups (`getDashboard`, `getGroups`, `createGroup`, `joinGroup`, `leaveGroup`).
  - Group Members & Role updates (`updateMemberRole`, `removeMember`).
  - Resources & Document Resources (`getGroupResources`, `uploadResource`, `toggleResourceVerification`, `toggleResourcePin`).
  - Comments & Teacher Announcements.
  - User Notifications.
  - Document Ratings & Comments (`documentApi`).
- [services/websocket.js](file:///c:/final_year_project/scl-frontend/scl/src/services/websocket.js): Managed STOMP WebSocket client singleton configured with SockJS fallback (`/ws?token=...`) for real-time channels.

---

### **Custom Hooks (`src/hooks/`)**
- [useGroupChat.js](file:///c:/final_year_project/scl-frontend/scl/src/hooks/useGroupChat.js): Custom hook managing WebSocket subscription to `/topic/chat/{roomId}` and fetching historical messages from `/api/v1/chat/rooms/{roomId}/messages`. Handles sending messages via STOMP publish or REST fallback.

---

### **Pages (`src/pages/`)**
- [HomePage.jsx](file:///c:/final_year_project/scl-frontend/scl/src/pages/HomePage.jsx): Main landing page displaying published library documents, search filters, category selectors ("Lecture Notes", "Research Papers", etc.), and document lists with AI keyword matching.
- [LoginPage.jsx](file:///c:/final_year_project/scl-frontend/scl/src/pages/LoginPage.jsx): Authenticates users via email/password, stores JWT token and user profile into `localStorage` and `AuthContext`.
- [SignUpPage.jsx](file:///c:/final_year_project/scl-frontend/scl/src/pages/SignUpPage.jsx): Registration form for new student/teacher accounts.
- [CreatePage.jsx](file:///c:/final_year_project/scl-frontend/scl/src/pages/CreatePage.jsx): Upload page allowing users to submit new documents (PDF, DOCX, TXT) with category, tags, and visibility settings.
- [UpdateNotePage.jsx](file:///c:/final_year_project/scl-frontend/scl/src/pages/UpdateNotePage.jsx): Form for editing document title, description, category, and access metadata.
- [AdminPage.jsx](file:///c:/final_year_project/scl-frontend/scl/src/pages/AdminPage.jsx): Dashboard for administrators to manage users, roles, view system statistics, and review flagged content.
- [ContactUs.jsx](file:///c:/final_year_project/scl-frontend/scl/src/pages/ContactUs.jsx): Public page with support contact form.
- [RequestReset.jsx](file:///c:/final_year_project/scl-frontend/scl/src/pages/RequestReset.jsx): Page for requesting password reset link via email.
- [ResetPage.jsx](file:///c:/final_year_project/scl-frontend/scl/src/pages/ResetPage.jsx): Password reset confirmation page.
- [Dashboard/CollaborationDashboard.jsx](file:///c:/final_year_project/scl-frontend/scl/src/pages/Dashboard/CollaborationDashboard.jsx): Central hub for study groups, displaying joined groups, pending access requests, pinned announcements, and options to create/join groups with invite codes.
- [Collaboration/GroupWorkspacePage.jsx](file:///c:/final_year_project/scl-frontend/scl/src/pages/Collaboration/GroupWorkspacePage.jsx): Detailed study group workspace featuring multi-tab views:
  - **Shared Resources**
  - **Live Chat (WebSocket)**
  - **Discussions / Forum**
  - **Teacher Announcements**
  - **Shared AI Chat Assistant**
  - **Member Management**
- [Search/Search.jsx](file:///c:/final_year_project/scl-frontend/scl/src/pages/Search/Search.jsx): Dedicated semantic search page for performing advanced document queries.

---

### **Components (`src/components/`)**

#### **Global Layout & Structure**
- [Navbar.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/Navbar.jsx): Top navigation bar with search input, theme toggle switch, notification bell badge, user profile menu, and quick navigation links.
- [Footer.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/Footer.jsx): Bottom page layout footer with copyright and link references.
- [ResourceCard.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/ResourceCard.jsx): Card component representing a document card on the home page with view, download, rate, AI summary preview, and action controls.
- [NoteCard.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/NoteCard.jsx): Comprehensive document view card rendering metadata, AI key points, category tags, author info, and modal trigger buttons.
- [NoteCardSkeleton.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/NoteCardSkeleton.jsx): Animated skeleton loader placeholder displayed while document lists are loading.
- [NotesNotFound.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/NotesNotFound.jsx): Empty state UI shown when search filters return zero documents.
- [RateLimitedUI.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/RateLimitedUI.jsx): Error boundary screen shown when HTTP 429 (Rate Limit Exceeded) is received from backend APIs.

#### **AI Features (`src/components/ai/`)**
- [PrivateAiChatDrawer.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/ai/PrivateAiChatDrawer.jsx): Slide-out chat interface for asking AI questions directly about a specific document (RAG-based response generation).

#### **Collaboration & Group Features (`src/components/collaboration/`)**
- [CollaborationWorkspaceModal.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/CollaborationWorkspaceModal.jsx): Workspace modal wrapper for group activities.
- [GroupChatRoom.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/GroupChatRoom.jsx): Real-time chat box UI utilizing `useGroupChat` for live messaging.
- [LiveChatTab.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/LiveChatTab.jsx): Tab container for group WebSocket chat.
- [DiscussionTab.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/DiscussionTab.jsx): Asynchronous forum thread discussion board for study groups.
- [GroupResourcesView.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/GroupResourcesView.jsx): Group file manager displaying uploaded course materials, verifying status, pinning, and downloading.
- [SharedResourcesTab.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/SharedResourcesTab.jsx): Tab interface displaying resources uploaded to the group.
- [ResourceDiscussionModal.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/ResourceDiscussionModal.jsx): Nested comment thread modal for discussing specific uploaded resources.
- [TeacherAnnouncementsView.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/TeacherAnnouncementsView.jsx): Announcement feed where teachers/admins publish high-priority updates.
- [SharedAiTab.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/SharedAiTab.jsx): Group AI chat tab where all group members share RAG queries against group documents.
- [MembersTab.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/MembersTab.jsx): Group roster page displaying active members, roles (Leader, Member, Teacher), and administration controls.
- [GroupMembersModal.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/GroupMembersModal.jsx): Quick modal list of group members.
- [OwnerNotificationsModal.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/OwnerNotificationsModal.jsx): Group owner panel to approve or reject pending member access requests.
- [RequestAccessModal.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/collaboration/RequestAccessModal.jsx): Dialog for requesting access to restricted study groups.

#### **Viewer Components (`src/components/viewer/`)**
- [PdfViewer.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/viewer/PdfViewer.jsx): PDF file preview renderer embedded in modals.
- [ResourceViewerModal.jsx](file:///c:/final_year_project/scl-frontend/scl/src/components/viewer/ResourceViewerModal.jsx): Modal window supporting interactive preview of PDF files, text notes, and external document links.

---

## 3. How Data & Workflows Flow
1. **User Auth Flow**: Login/Signup -> Backend `/api/v1/auth/login` -> JWT token stored in `localStorage` -> `authContext` state updated -> Axios automatically attaches `Bearer <token>` to all subsequent HTTP requests.
2. **Document Browsing & Search Flow**: User types in search bar -> `HomePage.jsx` filters locally or queries backend -> Renders `ResourceCard.jsx` / `NoteCard.jsx`.
3. **AI Drawer Flow**: User clicks "Ask AI" on a document -> `PrivateAiChatDrawer.jsx` opens -> Posts question to backend RAG endpoint -> Renders Markdown response with source citations.
4. **Group Real-Time Chat Flow**: User enters `GroupWorkspacePage.jsx` -> `useGroupChat` initializes SockJS/STOMP connection -> Subscribes to `/topic/chat/{roomId}` -> Messages sent/received in real time without refreshing.
