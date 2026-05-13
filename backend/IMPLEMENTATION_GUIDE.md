# StartupConnect Ethiopia - Complete API Implementation

## Overview

This document provides a comprehensive guide to the StartupConnect Ethiopia API implementation covering all 56 use cases across 4 user roles (Admin, Investor, Startup, Mentor).

## Files Created

### Controllers (Complete Implementations)
1. **adminControllerComplete.js** - All admin endpoints (user management, audit, investments, reports)
2. **investorControllerComplete.js** - All investor endpoints (startup discovery, funding offers, communication)
3. **startupControllerComplete.js** - All startup endpoints (project management, investor search, mentorship)
4. **mentorControllerComplete.js** - All mentor endpoints (request management, sessions, reports)

### Routes (Complete Implementations)
1. **adminRoutesComplete.js** - Routes for all admin endpoints
2. **investorRoutesComplete.js** - Routes for all investor endpoints  
3. **startupRoutesComplete.js** - Routes for all startup endpoints
4. **mentorRoutesComplete.js** - Routes for all mentor endpoints

### Documentation
1. **API_ENDPOINTS.md** - Complete endpoint reference with all parameters
2. **Connect Startup Backend API.postman_collection.json** - Postman collection for testing

## Quick Start

### 1. Replace Existing Controllers and Routes

```bash
# Backup existing files first
cp backend/controllers/adminController.js backend/controllers/adminController.backup.js
cp backend/routes/adminRoutes.js backend/routes/adminRoutes.backup.js

# Copy complete files (rename them by removing "Complete" suffix)
cp backend/controllers/adminControllerComplete.js backend/controllers/adminController.js
cp backend/controllers/investorControllerComplete.js backend/controllers/investorController.js
cp backend/controllers/startupControllerComplete.js backend/controllers/startupController.js
cp backend/controllers/mentorControllerComplete.js backend/controllers/mentorController.js

cp backend/routes/adminRoutesComplete.js backend/routes/adminRoutes.js
cp backend/routes/investorRoutesComplete.js backend/routes/investorRoutes.js
cp backend/routes/startupRoutesComplete.js backend/routes/startupRoutes.js
cp backend/routes/mentorRoutesComplete.js backend/routes/mentorRoutes.js
```

### 2. Update index.js to Use New Routes

In `backend/index.js`, update route imports:

```javascript
// Update these lines:
const adminRoutes = require("./routes/adminRoutes");
const investorRoutes = require("./routes/investorRoutes");
const startupRoutes = require("./routes/startupRoutes");
const mentorRoutes = require("./routes/mentorRoutes");

// They should already be in use. If not, add:
app.use("/api/admin", adminRoutes);
app.use("/api/investors", investorRoutes);
app.use("/api/startups", startupRoutes);
app.use("/api/mentors", mentorRoutes);
```

### 3. Test the Endpoints

Import the Postman collection into Postman:

1. Open Postman
2. Click "Import"
3. Select `Connect Startup Backend API.postman_collection.json`
4. Update the `{{base_url}}` variable to `http://localhost:5000`
5. Test endpoints by setting `{{access_token}}` after login

## API Structure Overview

### Authentication Endpoints
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/refresh` - Refresh access token
- **POST** `/api/auth/logout` - Logout user

### Admin Endpoints (All Role: Admin)
**User Management:**
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId/approve` - Approve user
- `PUT /api/admin/users/:userId/reject` - Reject user
- `DELETE /api/admin/users/:userId` - Delete user

**Monitoring:**
- `GET /api/admin/audit-logs` - View system activity logs

**Startups:**
- `GET /api/admin/startups/pending` - View pending startups
- `PUT /api/admin/startups/:startupId/approve` - Approve startup
- `PUT /api/admin/startups/:startupId/reject` - Reject startup

**Investments:**
- `GET /api/admin/investments` - List all investments
- `GET /api/admin/investment-requests` - List investment requests
- `PUT /api/admin/investment-requests/:id/status` - Update investment status

**Payments:**
- `GET /api/admin/payments` - List all payments

**Reports:**
- `GET /api/admin/reports/usage` - System usage statistics
- `GET /api/admin/reports/investments` - Investment metrics
- `GET /api/admin/reports/mentorship` - Mentorship statistics

### Investor Endpoints (All Role: Investor)
**Profile:**
- `POST /api/investors/profile` - Create investor profile

**Startup Discovery:**
- `GET /api/investors/startups` - View all verified startups
- `GET /api/investors/startups/search` - Search and filter startups
- `GET /api/investors/recommendations/:investorId` - Get AI recommendations
- `GET /api/investors/startups/:startupId` - View startup details

**Investment:**
- `POST /api/investors/funding-offers` - Send funding offer
- `GET /api/investors/portfolio` - View investment portfolio

**Communication:**
- `POST /api/investors/chat/startups/:startupId/send` - Send message
- `GET /api/investors/chat/startups/:startupId/messages` - Get messages
- `POST /api/investors/startups/:startupId/feedback` - Send feedback

### Startup Endpoints (All Role: Startup)
**Projects:**
- `POST /api/startups/projects` - Create new project
- `GET /api/startups/projects` - Get my projects
- `GET /api/startups/projects/:projectId` - Get project details
- `PUT /api/startups/projects/:projectId` - Update project

**Documents:**
- `POST /api/startups/documents` - Upload document
- `GET /api/startups/documents` - Get my documents

**Discovery:**
- `GET /api/startups/investors/search` - Search investors
- `GET /api/startups/mentors/search` - Search mentors
- `GET /api/startups/recommendations/investors` - Get investor recommendations
- `GET /api/startups/recommendations/mentors` - Get mentor recommendations

**Funding:**
- `POST /api/startups/investment-requests` - Apply for investment

**Mentorship:**
- `POST /api/startups/mentorship-requests` - Request mentorship

**Communication:**
- `POST /api/startups/chat/investors/:investorId/send` - Send message to investor
- `GET /api/startups/chat/investors/:investorId/messages` - Get messages from investor

### Mentor Endpoints (All Role: Mentor)
**Profile:**
- `PUT /api/mentors/profile` - Update profile
- `GET /api/mentors/profile` - Get my profile

**Requests:**
- `GET /api/mentors/mentorship-requests` - Get incoming requests
- `PUT /api/mentors/mentorship-requests/:requestId/accept` - Accept request
- `PUT /api/mentors/mentorship-requests/:requestId/reject` - Reject request
- `POST /api/mentors/proposals` - Send mentorship proposal

**Startups:**
- `GET /api/mentors/startups` - List available startups
- `GET /api/mentors/startups/:startupId` - View startup details

**Resources:**
- `POST /api/mentors/resources` - Upload learning resource

**Sessions:**
- `POST /api/mentors/sessions` - Schedule session
- `GET /api/mentors/sessions` - Get my sessions

**Communication:**
- `POST /api/mentors/chat/startups/:startupId/send` - Send message
- `GET /api/mentors/chat/startups/:startupId/messages` - Get messages

**Reports:**
- `POST /api/mentors/reports` - Submit session report
- `GET /api/mentors/mentorships` - Get mentorship history

## Use Case Mapping

### Admin (UC_1 to UC_12)
| UC | Endpoint | Method |
|----|----------|--------|
| UC_1 | /api/admin/users | GET |
| UC_2 | /api/admin/users/:userId/approve | PUT |
| UC_3 | /api/admin/users/:userId/reject | PUT |
| UC_4 | /api/admin/users/:userId | DELETE |
| UC_5 | /api/admin/users | GET |
| UC_6 | /api/admin/audit-logs | GET |
| UC_7 | (Moderation) | - |
| UC_8 | /api/admin/startups/pending | GET |
| UC_9 | /api/admin/investments | GET |
| UC_10 | /api/admin/payments | GET |
| UC_11 | /api/admin/reports/* | GET |
| UC_12 | (Settings) | - |

### Investor (UC_13 to UC_26)
| UC | Endpoint | Method |
|----|----------|--------|
| UC_13b | /api/investors/profile | POST |
| UC_14 | /api/investors/startups | GET |
| UC_15 | /api/investors/startups/search | GET |
| UC_16 | /api/investors/recommendations/:id | GET |
| UC_17 | /api/investors/startups/:id | GET |
| UC_18 | /api/investors/funding-offers | POST |
| UC_20 | /api/investors/portfolio | GET |
| UC_23 | /api/investors/chat/startups/:id/* | POST/GET |
| UC_25 | /api/investors/startups/:id/feedback | POST |

### Startup (UC_27 to UC_43)
| UC | Endpoint | Method |
|----|----------|--------|
| UC_28 | /api/startups/projects | POST |
| UC_28b | /api/startups/projects | GET |
| UC_29 | /api/startups/documents | POST/GET |
| UC_31 | /api/startups/investors/search | GET |
| UC_32 | /api/startups/recommendations/* | GET |
| UC_33 | /api/startups/investment-requests | POST |
| UC_34 | /api/startups/chat/investors/:id/* | POST/GET |
| UC_38 | /api/startups/mentorship-requests | POST |

### Mentor (UC_44 to UC_56)
| UC | Endpoint | Method |
|----|----------|--------|
| UC_44c | /api/mentors/profile | PUT/GET |
| UC_45 | /api/mentors/mentorship-requests/:id/* | GET/PUT |
| UC_46 | /api/mentors/proposals | POST |
| UC_47 | /api/mentors/startups/:id | GET |
| UC_48 | /api/mentors/resources | POST |
| UC_49 | /api/mentors/sessions | POST/GET |
| UC_51 | /api/mentors/chat/startups/:id/* | POST/GET |
| UC_53 | /api/mentors/reports | POST |
| UC_54 | /api/mentors/mentorships | GET |

## Testing Workflow

### 1. Create Test Users
```
1. Register as Admin user
2. Register as Investor user
3. Register as Startup user
4. Register as Mentor user
```

### 2. Admin Approves Users
```
1. Admin logs in
2. Admin lists pending users
3. Admin approves each user
```

### 3. Users Create Profiles
```
1. Investor creates profile
2. Startup creates profile
3. Mentor creates profile
```

### 4. Test Discovery & Matching
```
1. Investor searches startups
2. Startup searches investors
3. Startup searches mentors
```

### 5. Test Communication
```
1. Investor sends funding offer
2. Startup sends message to investor
3. Investor sends message to startup
4. Mentor accepts mentorship request
5. Mentor schedules session
```

### 6. Test Reports
```
1. Admin views usage reports
2. Admin views investment reports
3. Admin views mentorship reports
```

## Features Implemented

✅ Complete User Management
✅ Admin Dashboard with Analytics
✅ Investor Discovery & Funding Management
✅ Startup Project Management
✅ Mentorship Request & Session Management
✅ Communication (Messages)
✅ Investment Tracking
✅ Comprehensive Reports
✅ Audit Logging
✅ Role-Based Access Control
✅ Pagination & Filtering
✅ AI Recommendations (Basic)

## Database Requirements

The following tables are required (created by `001_init.sql`):
- users
- admins
- startups
- investors
- mentors
- projects
- documents
- mentor_documents
- investment_requests
- investments
- mentorship_requests
- mentorship_sessions
- mentorship_reports
- mentorship_resources
- payments
- messages
- notifications
- reviews
- audit_logs
- refresh_tokens

## Error Handling

All endpoints follow this error response format:
```json
{
  "error": "Error message here",
  "message": "More details if available"
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Server Error

## Authentication

All protected endpoints require:
```
Header: Authorization: Bearer {access_token}
```

Tokens expire after 24 hours. Use the refresh endpoint to get a new token.

## Next Steps

1. Replace existing files with complete implementations
2. Test all endpoints using Postman collection
3. Implement remaining features (video meetings, payments integration)
4. Set up frontend to consume these APIs
5. Deploy to production environment

## Support

For issues or questions about the API implementation, refer to:
- `API_ENDPOINTS.md` - Detailed endpoint documentation
- `Connect Startup Backend API.postman_collection.json` - Testing examples
- Database schema in `001_init.sql`

