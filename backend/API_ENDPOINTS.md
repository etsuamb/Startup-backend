# StartupConnect Ethiopia - Complete API Endpoints Documentation

## Base URL
```
http://localhost:5000/api
```

---

## AUTH ENDPOINTS

### UC_1: Register User
- **POST** `/auth/register`
- **Body:** `{ first_name, last_name, email, password, role }`
- **Response:** `{ message, user: { user_id, email, role, is_approved } }`

### UC_2: Login User
- **POST** `/auth/login`
- **Body:** `{ email, password }`
- **Response:** `{ access_token, refresh_token, user }`

### UC_3: Refresh Access Token
- **POST** `/auth/refresh`
- **Body:** `{ refresh_token }`
- **Response:** `{ access_token }`

### UC_4: Logout (Revoke Token)
- **POST** `/auth/logout`
- **Headers:** `Authorization: Bearer {token}`
- **Response:** `{ message }`

---

## ADMIN ENDPOINTS

### UC_1: Admin Login & Authentication
- **POST** `/auth/admin-login`
- **Body:** `{ email, password }`
- **Response:** `{ access_token, refresh_token, admin }`

### UC_2: Approve User Accounts
- **PUT** `/admin/users/:userId/approve`
- **Auth:** Admin only
- **Body:** `{ }`
- **Response:** `{ user_id, email, is_approved, approved_at, approved_by }`

### UC_3: Reject User Accounts
- **PUT** `/admin/users/:userId/reject`
- **Auth:** Admin only
- **Body:** `{ reason? }`
- **Response:** `{ message }`

### UC_4: Remove/Disable User Account
- **DELETE** `/admin/users/:userId`
- **Auth:** Admin only
- **Body:** `{ reason? }`
- **Response:** `{ message }`

### UC_5: Search & Review User Profiles
- **GET** `/admin/users`
- **Auth:** Admin only
- **Query:** `{ role?, status?, search?, page, limit }`
- **Response:** `{ users: [], total, page, limit }`

### UC_5b: Get User Details
- **GET** `/admin/users/:userId`
- **Auth:** Admin only
- **Response:** `{ user_id, first_name, last_name, email, role, is_approved, created_at, ... }`

### UC_6: Monitor System Activities
- **GET** `/admin/audit-logs`
- **Auth:** Admin only
- **Query:** `{ actor?, action?, entity_type?, page, limit }`
- **Response:** `{ logs: [], total }`

### UC_7: Moderate Content & Posts
- **GET** `/admin/content-moderation`
- **Auth:** Admin only
- **Query:** `{ status?, type?, page, limit }`
- **Response:** `{ content: [] }`

- **PUT** `/admin/content/:contentId/approve`
- **Auth:** Admin only
- **Response:** `{ message }`

- **DELETE** `/admin/content/:contentId`
- **Auth:** Admin only
- **Response:** `{ message }`

### UC_8: Approve/Remove Startup Listings
- **GET** `/admin/startups/pending-approval`
- **Auth:** Admin only
- **Query:** `{ page, limit }`
- **Response:** `{ startups: [] }`

- **PUT** `/admin/startups/:startupId/approve`
- **Auth:** Admin only
- **Response:** `{ startup_id, status }`

- **PUT** `/admin/startups/:startupId/reject`
- **Auth:** Admin only
- **Body:** `{ reason? }`
- **Response:** `{ message }`

### UC_9: Oversee All Investments
- **GET** `/admin/investments`
- **Auth:** Admin only
- **Query:** `{ status?, startup_id?, investor_id?, page, limit }`
- **Response:** `{ investments: [], total }`

- **GET** `/admin/investment-requests`
- **Auth:** Admin only
- **Query:** `{ status?, page, limit }`
- **Response:** `{ requests: [], total }`

### UC_10: Review Payment Transactions
- **GET** `/admin/payments`
- **Auth:** Admin only
- **Query:** `{ status?, type?, page, limit }`
- **Response:** `{ payments: [], total }`

- **GET** `/admin/payments/:paymentId`
- **Auth:** Admin only
- **Response:** `{ payment details }`

### UC_11: Generate System Reports
- **GET** `/admin/reports/usage`
- **Auth:** Admin only
- **Query:** `{ start_date?, end_date? }`
- **Response:** `{ total_users, active_users, total_startups, ... }`

- **GET** `/admin/reports/investments`
- **Auth:** Admin only
- **Query:** `{ start_date?, end_date? }`
- **Response:** `{ total_invested, num_deals, avg_investment, ... }`

- **GET** `/admin/reports/mentorship`
- **Auth:** Admin only
- **Query:** `{ start_date?, end_date? }`
- **Response:** `{ total_sessions, total_mentors, ... }`

### UC_12: Perform System Maintenance
- **PUT** `/admin/settings`
- **Auth:** Admin only
- **Body:** `{ key, value }`
- **Response:** `{ message }`

- **POST** `/admin/seed-data`
- **Auth:** Admin only
- **Response:** `{ message }`

---

## INVESTOR ENDPOINTS

### UC_13: Investor Registration & Login
*(Same as Auth endpoints but with role: "Investor")*

### UC_13b: Create Investor Profile
- **POST** `/investors/profile`
- **Auth:** Investor only
- **Body:** `{ investor_type, organization_name, investment_budget, preferred_industry, investment_stage, country, portfolio_size }`
- **Response:** `{ investor_id, user_id, ... }`

### UC_14: View Startup List (Curated)
- **GET** `/investors/startups`
- **Auth:** Investor only
- **Query:** `{ page, limit, approved_only }`
- **Response:** `{ startups: [], total }`

### UC_15: Search & Filter Startups
- **GET** `/investors/startups/search`
- **Auth:** Investor only
- **Query:** `{ industry?, stage?, location?, funding_min?, funding_max?, search?, page, limit }`
- **Response:** `{ startups: [], total, filters }`

### UC_16: Receive AI Startup Recommendations
- **GET** `/investors/:investorId/recommendations`
- **Auth:** Investor only
- **Query:** `{ limit }`
- **Response:** `{ recommendations: [{ startup, score, reason }] }`

### UC_17: View Detailed Startup Profile
- **GET** `/investors/startups/:startupId`
- **Auth:** Investor only
- **Response:** `{ startup details with all documents }`

### UC_18: Send Funding Offer to Startup
- **POST** `/investors/funding-offers`
- **Auth:** Investor only
- **Body:** `{ startup_id, project_id?, amount, equity_percentage, terms, message }`
- **Response:** `{ offer_id, status, created_at }`

### UC_19: Accept/Reject Funding Requests
- **GET** `/investors/funding-requests`
- **Auth:** Investor only
- **Query:** `{ status?, page, limit }`
- **Response:** `{ requests: [] }`

- **PUT** `/investors/funding-requests/:requestId/accept`
- **Auth:** Investor only
- **Body:** `{ amount, equity_percentage?, terms? }`
- **Response:** `{ message, investment_id }`

- **PUT** `/investors/funding-requests/:requestId/reject`
- **Auth:** Investor only
- **Body:** `{ reason? }`
- **Response:** `{ message }`

### UC_20: Create Investment Portfolio
- **GET** `/investors/portfolio`
- **Auth:** Investor only
- **Response:** `{ startups: [], total_investments, total_value, performance }`

### UC_21: Cancel Investment Offer
- **DELETE** `/investors/offers/:offerId`
- **Auth:** Investor only
- **Response:** `{ message }`

### UC_22: Payment Handling for Investments
- **POST** `/investors/investments/:investmentId/pay`
- **Auth:** Investor only
- **Body:** `{ amount, payment_method }`
- **Response:** `{ payment_id, status }`

- **GET** `/investors/investments/:investmentId/status`
- **Auth:** Investor only
- **Response:** `{ payment_status, transaction details }`

### UC_23: Direct Chat With Startup
- **POST** `/investors/chat/startups/:startupId/send`
- **Auth:** Investor only
- **Body:** `{ message }`
- **Response:** `{ message_id, created_at }`

- **GET** `/investors/chat/startups/:startupId/messages`
- **Auth:** Investor only
- **Query:** `{ page, limit }`
- **Response:** `{ messages: [] }`

### UC_24: Join Video Meetings With Startup
- **POST** `/investors/meetings/startups/:startupId/schedule`
- **Auth:** Investor only
- **Body:** `{ scheduled_at, duration_minutes }`
- **Response:** `{ meeting_id, meeting_link }`

- **POST** `/investors/meetings/:meetingId/start`
- **Auth:** Investor only
- **Response:** `{ meeting_link, token }`

### UC_25: Provide Feedback to Startup
- **POST** `/investors/startups/:startupId/feedback`
- **Auth:** Investor only
- **Body:** `{ rating, comment }`
- **Response:** `{ feedback_id, created_at }`

### UC_26: View Investment Reports
- **GET** `/investors/reports/portfolio`
- **Auth:** Investor only
- **Response:** `{ portfolio_value, returns, performance_metrics }`

---

## STARTUP ENDPOINTS

### UC_27: Startup Registration & Login
*(Same as Auth endpoints but with role: "Startup")*

### UC_27b: Create Startup Profile
- **POST** `/startups/profile`
- **Auth:** Startup only
- **Body:** `{ startup_name, industry, description, business_stage, founded_year, team_size, location, website, funding_needed }`
- **Response:** `{ startup_id, user_id, ... }`

### UC_27c: Update Startup Profile
- **PUT** `/startups/profile`
- **Auth:** Startup only
- **Body:** `{ startup_name?, industry?, description?, ... }`
- **Response:** `{ startup_id, ... }`

### UC_27d: Get My Startup Profile
- **GET** `/startups/profile`
- **Auth:** Startup only
- **Response:** `{ startup details }`

### UC_28: Create Startup Project
- **POST** `/startups/projects`
- **Auth:** Startup only
- **Body:** `{ project_title, description, funding_goal, start_date?, end_date? }`
- **Response:** `{ project_id, startup_id, status, created_at }`

### UC_28b: Get My Projects
- **GET** `/startups/projects`
- **Auth:** Startup only
- **Response:** `{ projects: [] }`

### UC_28c: Get Project Details
- **GET** `/startups/projects/:projectId`
- **Auth:** Startup only
- **Response:** `{ project details }`

### UC_28d: Update Project
- **PUT** `/startups/projects/:projectId`
- **Auth:** Startup only
- **Body:** `{ project_title?, description?, funding_goal?, status? }`
- **Response:** `{ project_id, ... }`

### UC_29: Upload Project Documents
- **POST** `/startups/documents`
- **Auth:** Startup only
- **Form-data:** `{ project_id, file, description? }`
- **Response:** `{ document_id, file_path, created_at }`

- **GET** `/startups/documents`
- **Auth:** Startup only
- **Response:** `{ documents: [] }`

- **DELETE** `/startups/documents/:documentId`
- **Auth:** Startup only
- **Response:** `{ message }`

### UC_30: Update Project Progress
- **POST** `/startups/projects/:projectId/progress`
- **Auth:** Startup only
- **Body:** `{ description, milestone?, amount_raised? }`
- **Response:** `{ progress_id, created_at }`

- **GET** `/startups/projects/:projectId/progress`
- **Auth:** Startup only
- **Response:** `{ updates: [] }`

### UC_31: Search Investors & Mentors
- **GET** `/startups/investors/search`
- **Auth:** Startup only
- **Query:** `{ investment_range?, industry?, country?, search?, page, limit }`
- **Response:** `{ investors: [] }`

- **GET** `/startups/mentors/search`
- **Auth:** Startup only
- **Query:** `{ expertise?, experience?, country?, search?, page, limit }`
- **Response:** `{ mentors: [] }`

### UC_32: AI Investor/Mentor Recommendations
- **GET** `/startups/recommendations/investors`
- **Auth:** Startup only
- **Response:** `{ recommendations: [{ investor, score, reason }] }`

- **GET** `/startups/recommendations/mentors`
- **Auth:** Startup only
- **Response:** `{ recommendations: [{ mentor, score, reason }] }`

### UC_33: Apply for Investment
- **POST** `/startups/investment-requests`
- **Auth:** Startup only
- **Body:** `{ investor_id?, project_id, requested_amount, proposal_message }`
- **Response:** `{ request_id, status, created_at }`

- **GET** `/startups/investment-requests`
- **Auth:** Startup only
- **Response:** `{ requests: [] }`

### UC_34: Chat With Investors
- **POST** `/startups/chat/investors/:investorId/send`
- **Auth:** Startup only
- **Body:** `{ message }`
- **Response:** `{ message_id, created_at }`

- **GET** `/startups/chat/investors/:investorId/messages`
- **Auth:** Startup only
- **Query:** `{ page, limit }`
- **Response:** `{ messages: [] }`

### UC_35: Participate in Video Meetings
- **POST** `/startups/meetings/investors/:investorId/schedule`
- **Auth:** Startup only
- **Body:** `{ scheduled_at, duration_minutes }`
- **Response:** `{ meeting_id, meeting_link }`

- **POST** `/startups/meetings/:meetingId/start`
- **Auth:** Startup only
- **Response:** `{ meeting_link, token }`

### UC_36: Track Investment Payments
- **GET** `/startups/investments`
- **Auth:** Startup only
- **Response:** `{ investments: [] }`

- **GET** `/startups/investments/:investmentId/status`
- **Auth:** Startup only
- **Response:** `{ investment details, payment status }`

### UC_37: View Investor Feedback
- **GET** `/startups/feedback`
- **Auth:** Startup only
- **Response:** `{ feedback: [] }`

### UC_38: Request Mentorship
- **POST** `/startups/mentorship-requests`
- **Auth:** Startup only
- **Body:** `{ mentor_id, subject, message }`
- **Response:** `{ request_id, status, created_at }`

- **GET** `/startups/mentorship-requests`
- **Auth:** Startup only
- **Response:** `{ requests: [] }`

### UC_39: Accept Mentor Offer
- **PUT** `/startups/mentorship-requests/:requestId/accept`
- **Auth:** Startup only
- **Response:** `{ message, mentorship_request_id }`

### UC_40: Remove Mentor
- **DELETE** `/startups/mentorship/:mentorshipId`
- **Auth:** Startup only
- **Body:** `{ reason? }`
- **Response:** `{ message }`

### UC_41: Chat With Mentor
- **POST** `/startups/chat/mentors/:mentorId/send`
- **Auth:** Startup only
- **Body:** `{ message }`
- **Response:** `{ message_id }`

- **GET** `/startups/chat/mentors/:mentorId/messages`
- **Auth:** Startup only
- **Query:** `{ page, limit }`
- **Response:** `{ messages: [] }`

### UC_42: Join Mentor Video Sessions
- **POST** `/startups/meetings/mentors/:mentorId/schedule`
- **Auth:** Startup only
- **Body:** `{ scheduled_at, duration_minutes }`
- **Response:** `{ session_id, meeting_link }`

- **POST** `/startups/meetings/:sessionId/start`
- **Auth:** Startup only
- **Response:** `{ meeting_link, token }`

### UC_43: View Startup Status
- **GET** `/startups/status`
- **Auth:** Startup only
- **Response:** `{ status, profile_complete, applications_pending, active_investors, active_mentors }`

---

## MENTOR ENDPOINTS

### UC_44: Mentor Registration & Login
*(Same as Auth endpoints but with role: "Mentor")*

### UC_44b: Create Mentor Profile
- **POST** `/mentors/profile`
- **Auth:** Mentor only
- **Body:** `{ headline, expertise, years_experience, hourly_rate, country, bio, availability }`
- **Response:** `{ mentor_id, user_id, ... }`

### UC_44c: Update Mentor Profile
- **PUT** `/mentors/profile`
- **Auth:** Mentor only
- **Body:** `{ headline?, expertise?, ..., availability? }`
- **Response:** `{ mentor_id, ... }`

### UC_44d: Get My Mentor Profile
- **GET** `/mentors/profile`
- **Auth:** Mentor only
- **Response:** `{ mentor details }`

### UC_45: Accept or Reject Mentorship Request
- **GET** `/mentors/mentorship-requests`
- **Auth:** Mentor only
- **Query:** `{ status?, page, limit }`
- **Response:** `{ requests: [] }`

- **PUT** `/mentors/mentorship-requests/:requestId/accept`
- **Auth:** Mentor only
- **Body:** `{ duration_weeks?, rate? }`
- **Response:** `{ message, mentorship_id }`

- **PUT** `/mentors/mentorship-requests/:requestId/reject`
- **Auth:** Mentor only
- **Body:** `{ reason? }`
- **Response:** `{ message }`

### UC_46: Send Mentorship Proposal
- **POST** `/mentors/proposals`
- **Auth:** Mentor only
- **Body:** `{ startup_id, subject, message, duration_weeks?, hourly_rate? }`
- **Response:** `{ proposal_id, created_at }`

### UC_47: View Startup Profiles
- **GET** `/mentors/startups`
- **Auth:** Mentor only
- **Query:** `{ industry?, stage?, search?, page, limit }`
- **Response:** `{ startups: [] }`

- **GET** `/mentors/startups/:startupId`
- **Auth:** Mentor only
- **Response:** `{ startup details }`

### UC_48: Provide Learning Resources
- **POST** `/mentors/resources`
- **Auth:** Mentor only
- **Form-data:** `{ mentorship_id?, startup_id?, resource_title, resource_type, file?, external_url?, description }`
- **Response:** `{ resource_id, created_at }`

- **GET** `/mentors/resources`
- **Auth:** Mentor only
- **Response:** `{ resources: [] }`

### UC_49: Schedule Mentorship Sessions
- **POST** `/mentors/sessions`
- **Auth:** Mentor only
- **Body:** `{ mentorship_request_id, scheduled_at, duration_minutes }`
- **Response:** `{ session_id, meeting_link }`

- **GET** `/mentors/sessions`
- **Auth:** Mentor only
- **Query:** `{ status?, page, limit }`
- **Response:** `{ sessions: [] }`

- **PUT** `/mentors/sessions/:sessionId`
- **Auth:** Mentor only
- **Body:** `{ scheduled_at?, duration_minutes?, status? }`
- **Response:** `{ session_id, ... }`

### UC_50: Host Live Mentorship Video Session
- **POST** `/mentors/sessions/:sessionId/start`
- **Auth:** Mentor only
- **Response:** `{ meeting_link, token, session_id }`

- **POST** `/mentors/sessions/:sessionId/end`
- **Auth:** Mentor only
- **Body:** `{ notes? }`
- **Response:** `{ message, session_id }`

### UC_51: Chat With Startup
- **POST** `/mentors/chat/startups/:startupId/send`
- **Auth:** Mentor only
- **Body:** `{ message }`
- **Response:** `{ message_id }`

- **GET** `/mentors/chat/startups/:startupId/messages`
- **Auth:** Mentor only
- **Query:** `{ page, limit }`
- **Response:** `{ messages: [] }`

### UC_52: Share Materials During Session
- **POST** `/mentors/sessions/:sessionId/materials`
- **Auth:** Mentor only
- **Form-data:** `{ file, description? }`
- **Response:** `{ material_id, file_path }`

### UC_53: Submit Mentorship Reports
- **POST** `/mentors/reports`
- **Auth:** Mentor only
- **Body:** `{ mentorship_session_id, report_title, summary, action_items, next_steps, progress_rating, mentor_notes }`
- **Response:** `{ report_id, created_at }`

- **GET** `/mentors/reports`
- **Auth:** Mentor only
- **Query:** `{ page, limit }`
- **Response:** `{ reports: [] }`

### UC_54: View Mentorship History
- **GET** `/mentors/mentorships`
- **Auth:** Mentor only
- **Response:** `{ mentorships: [] }`

- **GET** `/mentors/mentorships/:mentorshipId`
- **Auth:** Mentor only
- **Response:** `{ mentorship details with sessions and reports }`

### UC_55: Receive Mentorship Payments
- **GET** `/mentors/payments`
- **Auth:** Mentor only
- **Query:** `{ status?, page, limit }`
- **Response:** `{ payments: [] }`

- **POST** `/mentors/payments/:paymentId/request-withdrawal`
- **Auth:** Mentor only
- **Response:** `{ request_id, status }`

### UC_56: End Mentorship Engagement
- **PUT** `/mentors/mentorships/:mentorshipId/end`
- **Auth:** Mentor only
- **Body:** `{ final_feedback?, reason? }`
- **Response:** `{ message, mentorship_id }`

---

## NOTIFICATION ENDPOINTS

- **GET** `/notifications`
- **Auth:** Required
- **Query:** `{ page, limit, unread_only }`
- **Response:** `{ notifications: [], total_unread }`

- **GET** `/notifications/:notificationId`
- **Auth:** Required
- **Response:** `{ notification details }`

- **PUT** `/notifications/:notificationId/read`
- **Auth:** Required
- **Response:** `{ message }`

- **PUT** `/notifications/mark-all-read`
- **Auth:** Required
- **Response:** `{ message }`

---

## Common Response Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

## Authentication

All endpoints requiring authentication use:
```
Header: Authorization: Bearer {access_token}
```

## Rate Limiting

- 100 requests per minute per user
- Admin endpoints: 200 requests per minute

## Pagination

Default: `page=1, limit=20`
Max limit: 100

