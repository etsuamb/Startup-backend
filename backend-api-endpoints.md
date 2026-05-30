# Backend API Endpoints

Extracted from Express route definitions mounted in `backend/index.js`.

Total endpoints: 321

## /api/admin

| Method | Endpoint | Route file |
|---|---|---|
| GET | `/api/admin/audit-logs` | adminRoutes.js |
| GET | `/api/admin/audit-logs/export` | adminRoutes.js |
| GET | `/api/admin/chat-moderation/logs` | adminRoutes.js |
| GET | `/api/admin/chat-moderation/stats` | adminRoutes.js |
| POST | `/api/admin/chat-moderation/users/:userId/suspend` | adminRoutes.js |
| POST | `/api/admin/chat-moderation/users/:userId/unsuspend` | adminRoutes.js |
| POST | `/api/admin/chat-moderation/users/:userId/warn` | adminRoutes.js |
| GET | `/api/admin/chat-moderation/violations` | adminRoutes.js |
| GET | `/api/admin/content/flags` | adminRoutes.js |
| PATCH | `/api/admin/content/flags/:id` | adminRoutes.js |
| POST | `/api/admin/content/projects/:projectId/flag` | adminRoutes.js |
| GET | `/api/admin/dashboard/analytics/engagement` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/analytics/funding` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/analytics/startups` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/analytics/system` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/chat/conversations` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/chat/conversations/:id/messages` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/chat/conversations/:id/video/status` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/documents` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/documents/:id` | adminDashboardRoutes.js |
| PATCH | `/api/admin/dashboard/documents/:id/verification` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/events` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/events/:id` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/funding` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/funding/:id` | adminDashboardRoutes.js |
| PATCH | `/api/admin/dashboard/funding/:id/approval` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/investors` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/investors/:id` | adminDashboardRoutes.js |
| PATCH | `/api/admin/dashboard/investors/:id/approval` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/mentors` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/mentors/:id` | adminDashboardRoutes.js |
| PATCH | `/api/admin/dashboard/mentors/:id/approval` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/monitoring/login-attempts` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/monitoring/security-events` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/monitoring/summary` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/startups` | adminDashboardRoutes.js |
| GET | `/api/admin/dashboard/startups/:id` | adminDashboardRoutes.js |
| PATCH | `/api/admin/dashboard/startups/:id/status` | adminDashboardRoutes.js |
| DELETE | `/api/admin/documents/:documentId` | adminRoutes.js |
| GET | `/api/admin/documents/:documentId` | adminRoutes.js |
| GET | `/api/admin/investment-disputes` | adminRoutes.js |
| POST | `/api/admin/investment-disputes` | adminRoutes.js |
| PATCH | `/api/admin/investment-disputes/:id` | adminRoutes.js |
| GET | `/api/admin/investment-requests` | adminRoutes.js |
| PUT | `/api/admin/investment-requests/:id/status` | adminRoutes.js |
| POST | `/api/admin/investment-requests/:id/verify-legitimacy` | adminRoutes.js |
| GET | `/api/admin/investments` | adminRoutes.js |
| POST | `/api/admin/investments/:id/verify-legitimacy` | adminRoutes.js |
| PUT | `/api/admin/investors/:investorId/approve` | adminRoutes.js |
| PUT | `/api/admin/investors/:investorId/unapprove` | adminRoutes.js |
| GET | `/api/admin/maintenance/backup` | adminRoutes.js |
| POST | `/api/admin/maintenance/backup` | adminRoutes.js |
| POST | `/api/admin/maintenance/clear-audit-logs` | adminRoutes.js |
| GET | `/api/admin/maintenance/error-logs` | adminRoutes.js |
| POST | `/api/admin/maintenance/error-logs` | adminRoutes.js |
| GET | `/api/admin/maintenance/status` | adminRoutes.js |
| GET | `/api/admin/mentor-documents/:documentId` | adminRoutes.js |
| PUT | `/api/admin/mentors/:mentorId/approve` | adminRoutes.js |
| PUT | `/api/admin/mentors/:mentorId/unapprove` | adminRoutes.js |
| GET | `/api/admin/mentorship/overview` | adminRoutes.js |
| GET | `/api/admin/mentorship/payments` | adminRoutes.js |
| GET | `/api/admin/mentorship/reports` | adminRoutes.js |
| GET | `/api/admin/mentorship/requests` | adminRoutes.js |
| GET | `/api/admin/mentorship/resources` | adminRoutes.js |
| DELETE | `/api/admin/mentorship/resources/:id` | adminRoutes.js |
| GET | `/api/admin/mentorship/sessions` | adminRoutes.js |
| GET | `/api/admin/monitoring/fraud-summary` | adminRoutes.js |
| GET | `/api/admin/payments` | adminRoutes.js |
| GET | `/api/admin/payments/:paymentId` | adminRoutes.js |
| POST | `/api/admin/payments/:paymentId/chargeback` | adminRoutes.js |
| POST | `/api/admin/payments/:paymentId/flag` | adminRoutes.js |
| POST | `/api/admin/payments/:paymentId/refund` | adminRoutes.js |
| GET | `/api/admin/payments/stats` | adminRoutes.js |
| GET | `/api/admin/payments/suspicious` | adminRoutes.js |
| GET | `/api/admin/platform/categories` | adminRoutes.js |
| POST | `/api/admin/platform/categories` | adminRoutes.js |
| DELETE | `/api/admin/platform/categories/:id` | adminRoutes.js |
| PATCH | `/api/admin/platform/categories/:id` | adminRoutes.js |
| GET | `/api/admin/platform/settings` | adminRoutes.js |
| PUT | `/api/admin/platform/settings` | adminRoutes.js |
| GET | `/api/admin/projects` | adminRoutes.js |
| DELETE | `/api/admin/projects/:projectId` | adminRoutes.js |
| PUT | `/api/admin/projects/:projectId/restore` | adminRoutes.js |
| PUT | `/api/admin/projects/:projectId/status` | adminRoutes.js |
| GET | `/api/admin/reports/export` | adminRoutes.js |
| GET | `/api/admin/reports/financial` | adminRoutes.js |
| GET | `/api/admin/reports/kpi` | adminRoutes.js |
| GET | `/api/admin/reports/overview` | adminRoutes.js |
| POST | `/api/admin/reports/schedule` | adminRoutes.js |
| GET | `/api/admin/reports/usage` | adminRoutes.js |
| GET | `/api/admin/startups` | adminRoutes.js |
| PUT | `/api/admin/startups/:startupId/approve` | adminRoutes.js |
| PUT | `/api/admin/startups/:startupId/remove` | adminRoutes.js |
| PUT | `/api/admin/startups/:startupId/unapprove` | adminRoutes.js |
| GET | `/api/admin/users` | adminRoutes.js |
| DELETE | `/api/admin/users/:userId` | adminRoutes.js |
| GET | `/api/admin/users/:userId` | adminRoutes.js |
| GET | `/api/admin/users/:userId/audit-logs` | adminRoutes.js |
| POST | `/api/admin/users/:userId/restore` | adminRoutes.js |
| POST | `/api/admin/users/:userId/suspend` | adminRoutes.js |
| POST | `/api/admin/users/:userId/unsuspend` | adminRoutes.js |
| POST | `/api/admin/users/:userId/verify-email` | adminRoutes.js |
| PUT | `/api/admin/users/approve/:userId` | adminRoutes.js |
| GET | `/api/admin/users/pending` | adminRoutes.js |
| GET | `/api/admin/users/pending/:userId` | adminRoutes.js |
| PUT | `/api/admin/users/reject/:userId` | adminRoutes.js |

## /api/ai-mentor

| Method | Endpoint | Route file |
|---|---|---|
| POST | `/api/ai-mentor/chat` | aiMentorRoutes.js |
| GET | `/api/ai-mentor/messages/:sessionId` | aiMentorRoutes.js |
| GET | `/api/ai-mentor/sessions` | aiMentorRoutes.js |

## /api/auth

| Method | Endpoint | Route file |
|---|---|---|
| POST | `/api/auth/2fa/disable` | authRoutes.js |
| POST | `/api/auth/2fa/enable` | authRoutes.js |
| POST | `/api/auth/2fa/send-enable-otp` | authRoutes.js |
| GET | `/api/auth/2fa/setup` | authRoutes.js |
| GET | `/api/auth/2fa/status` | authRoutes.js |
| PUT | `/api/auth/admin/change-password` | authRoutes.js |
| PUT | `/api/auth/approve/:userId` | authRoutes.js |
| POST | `/api/auth/forgot-password` | authRoutes.js |
| POST | `/api/auth/google` | authRoutes.js |
| POST | `/api/auth/google/complete-role` | authRoutes.js |
| POST | `/api/auth/login` | authRoutes.js |
| POST | `/api/auth/login/verify-2fa` | authRoutes.js |
| POST | `/api/auth/logout` | authRoutes.js |
| GET | `/api/auth/me` | authRoutes.js |
| PUT | `/api/auth/me` | authRoutes.js |
| POST | `/api/auth/refresh` | authRoutes.js |
| POST | `/api/auth/register` | authRoutes.js |
| POST | `/api/auth/resend-verification` | authRoutes.js |
| POST | `/api/auth/reset-password` | authRoutes.js |
| DELETE | `/api/auth/sessions` | authRoutes.js |
| GET | `/api/auth/sessions` | authRoutes.js |
| DELETE | `/api/auth/sessions/:token` | authRoutes.js |
| POST | `/api/auth/validate-email` | authRoutes.js |
| GET | `/api/auth/verify-email` | authRoutes.js |
| POST | `/api/auth/verify-email` | authRoutes.js |

## /api/chat

| Method | Endpoint | Route file |
|---|---|---|
| GET | `/api/chat/conversations` | chatRoutes.js |
| POST | `/api/chat/conversations` | chatRoutes.js |
| POST | `/api/chat/conversations/:id/files` | chatRoutes.js |
| GET | `/api/chat/conversations/:id/files/:messageId` | chatRoutes.js |
| GET | `/api/chat/conversations/:id/messages` | chatRoutes.js |
| POST | `/api/chat/conversations/:id/messages` | chatRoutes.js |
| POST | `/api/chat/conversations/:id/video/end` | chatRoutes.js |
| POST | `/api/chat/conversations/:id/video/join` | chatRoutes.js |
| POST | `/api/chat/conversations/:id/video/screen-share` | chatRoutes.js |
| POST | `/api/chat/conversations/:id/video/start` | chatRoutes.js |
| GET | `/api/chat/conversations/:id/video/status` | chatRoutes.js |
| GET | `/api/chat/notifications` | chatRoutes.js |

## /api/contact

| Method | Endpoint | Route file |
|---|---|---|
| POST | `/api/contact` | miscRoutes.js |

## /api/investments

| Method | Endpoint | Route file |
|---|---|---|
| PATCH | `/api/investments/:requestId` | investmentRoutes.js |
| POST | `/api/investments/request` | investmentRoutes.js |
| GET | `/api/investments/requests` | investmentRoutes.js |

## /api/investors

| Method | Endpoint | Route file |
|---|---|---|
| GET | `/api/investors/chat/conversations` | investorRoutes.js |
| GET | `/api/investors/chat/startups/:startupId/messages` | investorRoutes.js |
| POST | `/api/investors/chat/startups/:startupId/send` | investorRoutes.js |
| GET | `/api/investors/funding-offers` | investorRoutes.js |
| POST | `/api/investors/funding-offers` | investorRoutes.js |
| PATCH | `/api/investors/funding-offers/:offerId/accept` | investorRoutes.js |
| PATCH | `/api/investors/funding-offers/:offerId/withdraw` | investorRoutes.js |
| GET | `/api/investors/meetings` | investorRoutes.js |
| POST | `/api/investors/meetings` | investorRoutes.js |
| PATCH | `/api/investors/meetings/:meetingId` | investorRoutes.js |
| GET | `/api/investors/mentor-ratings` | investorRoutes.js |
| GET | `/api/investors/portfolio` | investorRoutes.js |
| GET | `/api/investors/profile` | investorRoutes.js |
| POST | `/api/investors/profile` | investorRoutes.js |
| GET | `/api/investors/ratings` | investorRoutes.js |
| GET | `/api/investors/recommendations` | investorRoutes.js |
| GET | `/api/investors/settings` | investorRoutes.js |
| PUT | `/api/investors/settings` | investorRoutes.js |
| PATCH | `/api/investors/settings/password` | investorRoutes.js |
| GET | `/api/investors/startups` | investorRoutes.js |
| GET | `/api/investors/startups/:startupId` | investorRoutes.js |
| POST | `/api/investors/startups/:startupId/feedback` | investorRoutes.js |
| GET | `/api/investors/startups/search` | investorRoutes.js |

## /api/mentors

| Method | Endpoint | Route file |
|---|---|---|
| GET | `/api/mentors/:mentorId` | mentorRoutes.js |
| GET | `/api/mentors/all` | mentorRoutes.js |
| GET | `/api/mentors/chat/startups/:startupId/messages` | mentorRoutes.js |
| POST | `/api/mentors/chat/startups/:startupId/send` | mentorRoutes.js |
| GET | `/api/mentors/dashboard` | mentorRoutes.js |
| GET | `/api/mentors/mentor-chat/conversations` | mentorChatRoutes.js |
| POST | `/api/mentors/mentor-chat/conversations` | mentorChatRoutes.js |
| POST | `/api/mentors/mentor-chat/conversations/:id/files` | mentorChatRoutes.js |
| GET | `/api/mentors/mentor-chat/conversations/:id/files/:messageId` | mentorChatRoutes.js |
| GET | `/api/mentors/mentor-chat/conversations/:id/messages` | mentorChatRoutes.js |
| POST | `/api/mentors/mentor-chat/conversations/:id/messages` | mentorChatRoutes.js |
| POST | `/api/mentors/mentor-chat/conversations/:id/video/end` | mentorChatRoutes.js |
| POST | `/api/mentors/mentor-chat/conversations/:id/video/join` | mentorChatRoutes.js |
| POST | `/api/mentors/mentor-chat/conversations/:id/video/screen-share` | mentorChatRoutes.js |
| POST | `/api/mentors/mentor-chat/conversations/:id/video/start` | mentorChatRoutes.js |
| GET | `/api/mentors/mentor-chat/conversations/:id/video/status` | mentorChatRoutes.js |
| GET | `/api/mentors/mentor-chat/notifications` | mentorChatRoutes.js |
| GET | `/api/mentors/mentorship-requests` | mentorRoutes.js |
| PUT | `/api/mentors/mentorship-requests/:requestId/accept` | mentorRoutes.js |
| PUT | `/api/mentors/mentorship-requests/:requestId/reject` | mentorRoutes.js |
| GET | `/api/mentors/mentorships` | mentorRoutes.js |
| GET | `/api/mentors/my-startups` | mentorRoutes.js |
| GET | `/api/mentors/profile` | mentorRoutes.js |
| PUT | `/api/mentors/profile` | mentorRoutes.js |
| POST | `/api/mentors/proposals` | mentorRoutes.js |
| GET | `/api/mentors/startups` | mentorRoutes.js |
| GET | `/api/mentors/startups/:startupId` | mentorRoutes.js |

## /api/mentorship

| Method | Endpoint | Route file |
|---|---|---|
| GET | `/api/mentorship/chat/conversation/:otherUserId` | mentorshipRoutes.js |
| POST | `/api/mentorship/chat/messages` | mentorshipRoutes.js |
| GET | `/api/mentorship/history` | mentorshipRoutes.js |
| GET | `/api/mentorship/my-requests` | mentorshipRoutes.js |
| GET | `/api/mentorship/payments` | mentorshipRoutes.js |
| POST | `/api/mentorship/payments` | mentorshipRoutes.js |
| GET | `/api/mentorship/reports` | mentorshipRoutes.js |
| POST | `/api/mentorship/reports` | mentorshipRoutes.js |
| POST | `/api/mentorship/reports/generate-missing` | mentorshipRoutes.js |
| POST | `/api/mentorship/request` | mentorshipRoutes.js |
| PUT | `/api/mentorship/requests/:requestId/respond` | mentorshipRoutes.js |
| GET | `/api/mentorship/requests/incoming` | mentorshipRoutes.js |
| GET | `/api/mentorship/resources` | mentorshipRoutes.js |
| POST | `/api/mentorship/resources` | mentorshipRoutes.js |
| POST | `/api/mentorship/session` | mentorshipRoutes.js |
| GET | `/api/mentorship/sessions` | mentorshipRoutes.js |
| POST | `/api/mentorship/sessions` | mentorshipRoutes.js |
| GET | `/api/mentorship/sessions/:sessionId` | mentorshipRoutes.js |
| PUT | `/api/mentorship/sessions/:sessionId` | mentorshipRoutes.js |

## /api/messages

| Method | Endpoint | Route file |
|---|---|---|
| GET | `/api/messages` | messageRoutes.js |
| POST | `/api/messages` | messageRoutes.js |

## /api/notifications

| Method | Endpoint | Route file |
|---|---|---|
| GET | `/api/notifications` | notificationRoutes.js |
| PATCH | `/api/notifications/:id` | notificationRoutes.js |
| PUT | `/api/notifications/:id` | notificationRoutes.js |
| PUT | `/api/notifications/mark-all-read` | notificationRoutes.js |
| GET | `/api/notifications/settings` | notificationRoutes.js |
| PUT | `/api/notifications/settings` | notificationRoutes.js |
| GET | `/api/notifications/unread-count` | notificationRoutes.js |

## /api/payments

| Method | Endpoint | Route file |
|---|---|---|
| POST | `/api/payments/chapa/hosted` | paymentRoutes.js |
| POST | `/api/payments/chapa/initialize` | paymentRoutes.js |
| POST | `/api/payments/chapa/mentorship-hosted` | paymentRoutes.js |
| GET | `/api/payments/chapa/verify/:txRef` | paymentRoutes.js |
| GET | `/api/payments/investment-items` | paymentRoutes.js |
| GET | `/api/payments/mentorship-items` | paymentRoutes.js |
| POST | `/api/payments/webhooks/chapa` | paymentRoutes.js |

## /api/platform

| Method | Endpoint | Route file |
|---|---|---|
| GET | `/api/platform/categories` | miscRoutes.js |
| POST | `/api/platform/categories/suggest` | miscRoutes.js |

## /api/projects

| Method | Endpoint | Route file |
|---|---|---|
| DELETE | `/api/projects/:projectId` | projectRoutes.js |
| PUT | `/api/projects/:projectId` | projectRoutes.js |
| GET | `/api/projects/all` | projectRoutes.js |
| POST | `/api/projects/create` | projectRoutes.js |
| GET | `/api/projects/my` | projectRoutes.js |

## /api/ratings

| Method | Endpoint | Route file |
|---|---|---|
| POST | `/api/ratings` | ratingRoutes.js |
| DELETE | `/api/ratings/:reviewId` | ratingRoutes.js |
| GET | `/api/ratings/check-eligibility/:mentorId` | ratingRoutes.js |
| GET | `/api/ratings/mentor/:mentorId` | ratingRoutes.js |
| GET | `/api/ratings/mentor/:mentorId/summary` | ratingRoutes.js |
| GET | `/api/ratings/my-ratings` | ratingRoutes.js |
| GET | `/api/ratings/received` | ratingRoutes.js |

## /api/startup-dashboard

| Method | Endpoint | Route file |
|---|---|---|
| GET | `/api/startup-dashboard/activity` | startupDashboardRoutes.js |
| GET | `/api/startup-dashboard/documents` | startupDashboardRoutes.js |
| GET | `/api/startup-dashboard/events` | startupDashboardRoutes.js |
| GET | `/api/startup-dashboard/feedback` | startupDashboardRoutes.js |
| GET | `/api/startup-dashboard/funding` | startupDashboardRoutes.js |
| GET | `/api/startup-dashboard/info` | startupDashboardRoutes.js |
| GET | `/api/startup-dashboard/mentor-updates` | startupDashboardRoutes.js |
| GET | `/api/startup-dashboard/progress` | startupDashboardRoutes.js |
| POST | `/api/startup-dashboard/quick-actions` | startupDashboardRoutes.js |
| GET | `/api/startup-dashboard/status` | startupDashboardRoutes.js |

## /api/startups

| Method | Endpoint | Route file |
|---|---|---|
| GET | `/api/startups/chat/investors/:investorId/messages` | startupRoutesComplete.js |
| POST | `/api/startups/chat/investors/:investorId/send` | startupRoutesComplete.js |
| GET | `/api/startups/dashboard/activity` | startupRoutes.js |
| GET | `/api/startups/dashboard/documents-status` | startupRoutes.js |
| GET | `/api/startups/dashboard/events` | startupRoutes.js |
| GET | `/api/startups/dashboard/feedback` | startupRoutes.js |
| GET | `/api/startups/dashboard/funding-summary` | startupRoutes.js |
| GET | `/api/startups/dashboard/info` | startupRoutes.js |
| GET | `/api/startups/dashboard/mentor-updates` | startupRoutes.js |
| GET | `/api/startups/dashboard/project-progress` | startupRoutes.js |
| POST | `/api/startups/dashboard/quick-actions` | startupRoutes.js |
| GET | `/api/startups/dashboard/status` | startupRoutes.js |
| POST | `/api/startups/discover/:profileId/favorite` | discoverRoutes.js |
| GET | `/api/startups/discover/investors` | discoverRoutes.js |
| GET | `/api/startups/discover/investors/:investorId` | discoverRoutes.js |
| POST | `/api/startups/discover/investors/:investorId/apply` | discoverRoutes.js |
| POST | `/api/startups/discover/investors/:investorId/interest` | discoverRoutes.js |
| GET | `/api/startups/discover/mentors` | discoverRoutes.js |
| GET | `/api/startups/discover/mentors/:mentorId` | discoverRoutes.js |
| POST | `/api/startups/discover/mentors/:mentorId/apply` | discoverRoutes.js |
| POST | `/api/startups/discover/mentors/:mentorId/request` | discoverRoutes.js |
| GET | `/api/startups/documents` | startupRoutes.js, startupRoutesComplete.js |
| POST | `/api/startups/documents` | startupRoutesComplete.js |
| DELETE | `/api/startups/documents/:documentId` | startupRoutesComplete.js |
| GET | `/api/startups/documents/:documentId/file` | startupRoutesComplete.js |
| GET | `/api/startups/featured` | startupRoutes.js |
| POST | `/api/startups/investment-requests` | startupRoutesComplete.js |
| GET | `/api/startups/investors/search` | startupRoutesComplete.js |
| GET | `/api/startups/me` | startupRoutes.js |
| GET | `/api/startups/mentor-chat/conversations` | mentorChatRoutes.js |
| POST | `/api/startups/mentor-chat/conversations` | mentorChatRoutes.js |
| POST | `/api/startups/mentor-chat/conversations/:id/files` | mentorChatRoutes.js |
| GET | `/api/startups/mentor-chat/conversations/:id/files/:messageId` | mentorChatRoutes.js |
| GET | `/api/startups/mentor-chat/conversations/:id/messages` | mentorChatRoutes.js |
| POST | `/api/startups/mentor-chat/conversations/:id/messages` | mentorChatRoutes.js |
| POST | `/api/startups/mentor-chat/conversations/:id/video/end` | mentorChatRoutes.js |
| POST | `/api/startups/mentor-chat/conversations/:id/video/join` | mentorChatRoutes.js |
| POST | `/api/startups/mentor-chat/conversations/:id/video/screen-share` | mentorChatRoutes.js |
| POST | `/api/startups/mentor-chat/conversations/:id/video/start` | mentorChatRoutes.js |
| GET | `/api/startups/mentor-chat/conversations/:id/video/status` | mentorChatRoutes.js |
| GET | `/api/startups/mentor-chat/notifications` | mentorChatRoutes.js |
| GET | `/api/startups/mentors/search` | startupRoutesComplete.js |
| POST | `/api/startups/mentorship-requests` | startupRoutesComplete.js |
| GET | `/api/startups/offers` | startupRoutes.js |
| GET | `/api/startups/offers/:offerType/:offerId` | startupRoutes.js |
| PATCH | `/api/startups/offers/:offerType/:offerId` | startupRoutes.js |
| POST | `/api/startups/profile` | startupRoutes.js |
| PUT | `/api/startups/profile` | startupRoutes.js |
| GET | `/api/startups/projects` | startupRoutesComplete.js |
| POST | `/api/startups/projects` | startupRoutesComplete.js |
| GET | `/api/startups/projects/:projectId` | startupRoutesComplete.js |
| PUT | `/api/startups/projects/:projectId` | startupRoutesComplete.js |
| POST | `/api/startups/projects/:projectId/publish` | startupRoutesComplete.js |
| GET | `/api/startups/recommendations/investors` | startupRoutesComplete.js |
| GET | `/api/startups/recommendations/mentors` | startupRoutesComplete.js |
| GET | `/api/startups/search` | startupRoutes.js |
| GET | `/api/startups/sessions` | startupRoutes.js |
| POST | `/api/startups/sessions` | startupRoutes.js |
| PATCH | `/api/startups/sessions/:sessionId` | startupRoutes.js |

## /api/test

| Method | Endpoint | Route file |
|---|---|---|
| GET | `/api/test/dashboard` | testRoutes.js |
| GET | `/api/test/startup-only` | testRoutes.js |

## /uploads/*

| Method | Endpoint | Route file |
|---|---|---|
| STATIC | `/uploads/*` | index.js |

