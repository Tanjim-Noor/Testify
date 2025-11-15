# Backend API Documentation

> NOTE: This documentation is generated from the current FastAPI backend implementation under `backend/src`. It is intended for frontend developers integrating with the Online Exam Management System.

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Question Bank Management (Admin)](#3-question-bank-management-admin-only)
4. [Exam Management (Admin)](#4-exam-management-admin-only)
5. [Student Exam Flow](#5-student-exam-flow)
6. [Results & Grading](#6-results--grading)
7. [Data Models & Schemas](#7-data-models--schemas)
8. [Error Handling](#8-error-handling)
9. [Integration Examples](#9-integration-examples)
10. [Testing & Development](#10-testing--development)
11. [Database & Enums](#11-database-migration-information)
12. [Best Practices & Notes](#12-best-practices--notes)

---

## 1. API Overview

- **Base URL (local dev)**: `http://localhost:8000`
- **API Version**: from settings `APP_VERSION` (currently `0.1.0`).
- **Content Type**: `application/json` for all JSON endpoints; multipart for file uploads.
- **Authentication Method**: OAuth2 password flow with JWT Bearer tokens.
- **CORS Configuration** (see `src/config/settings.py`):
  - Allowed origins:
    - `http://localhost:3000`
    - `http://127.0.0.1:3000`
    - `http://localhost:8000`
  - Methods: `*` (all methods allowed)
  - Headers: `*`
  - Credentials: allowed
- **Rate Limiting**: Not implemented in the current codebase.

**Health & Docs**

- `GET /health` – application health
- `GET /db-health` – database connectivity
- `GET /` – root info (title, version, docs links)
- Swagger: `GET /docs`
- ReDoc: `GET /redoc`
- OpenAPI JSON: `GET /openapi.json`

---

## 2. Authentication & Authorization

Routes in `src/routes/auth.py` and dependencies in `src/utils/dependencies.py`.

### 2.1 Registration Endpoint

- **Method & URL**: `POST /api/auth/register`
- **Description**: Register a new user (admin or student).
- **Auth**: Public (no token required).

#### Request Body Schema – `UserCreate`

```json
{
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "student"
}
```

- `email` (string, required): valid email.
- `password` (string, required): min length 8.
- `role` (string, required): `"admin"` or `"student"`.

#### Success Response (201) – `UserResponse`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "role": "student",
  "created_at": "2024-01-15T10:30:00"
}
```

#### Error Responses

- `409 CONFLICT` – email already exists

```json
{
  "detail": "User with this email already exists"
}
```

- `422 UNPROCESSABLE ENTITY` – validation errors (FastAPI default format).
- `500 INTERNAL SERVER ERROR` – unexpected failures.

#### Sample `curl`

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123",
    "role": "student"
  }'
```

### 2.2 Login Endpoint

- **Method & URL**: `POST /api/auth/login`
- **Description**: Authenticate a user and return a JWT access token.
- **Auth**: Public.
- **Request Format**: OAuth2 password form (`application/x-www-form-urlencoded`).

#### Request Fields

- `username` – user email
- `password` – user password

Example request body (URL-encoded):

```bash
username=john@example.com&password=securePassword123
```

#### Success Response (200) – `TokenResponse`

```json
{
  "access_token": "<JWT_TOKEN>",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "role": "student",
    "created_at": "2024-01-15T10:30:00"
  }
}
```

#### Error Responses

- `401 UNAUTHORIZED` – incorrect credentials

```json
{
  "detail": "Incorrect email or password"
}
```

- `422 UNPROCESSABLE ENTITY` – missing username/password.

#### Token Expiration

- Controlled via `settings.JWT_EXPIRATION` (minutes). Default: `30`.

#### Sample `curl`

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john@example.com&password=securePassword123"
```

### 2.3 Get Current User

- **Method & URL**: `GET /api/auth/me`
- **Description**: Get current authenticated user’s profile.
- **Auth**: Bearer token required.

#### Success Response (200) – `UserResponse`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "role": "student",
  "created_at": "2024-01-15T10:30:00"
}
```

#### Error Responses

- `401 UNAUTHORIZED` – missing/invalid token.

```json
{
  "detail": "Could not validate credentials"
}
```

#### Sample `curl`

```bash
curl "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### 2.4 JWT Token Structure

Tokens are created in `src/utils/auth.py#create_access_token`.

Payload example:

```json
{
  "sub": "john@example.com",
  "exp": 1731660000
}
```

- `sub`: user email (used to look up user).
- `exp`: expiration timestamp (UTC), now + `JWT_EXPIRATION` minutes.

Include token in all protected requests via header:

```http
Authorization: Bearer <JWT_TOKEN>
```

**Token Refresh**: there is no dedicated refresh token endpoint; when expired, the frontend should redirect user to login and obtain a new token.

### 2.5 Role-Based Access Control

Roles are defined via `UserRole` enum in the ORM model and checked using dependencies in `src/utils/dependencies.py`:

- `get_current_admin` – requires `role == "admin"`.
- `get_current_student` – requires `role == "student"`.

#### Permission Matrix (High-Level)

| Endpoint Group                              | Path Prefix                  | Methods                        | Roles          |
|---------------------------------------------|------------------------------|--------------------------------|----------------|
| Auth                                        | `/api/auth/*`               | register, login, me            | public / any   |
| Question Bank                               | `/api/admin/questions/*`    | import, list, CRUD             | admin only     |
| Exam Management                             | `/api/admin/exams/*`        | CRUD, assign, reorder, publish | admin only     |
| Manual Grading                              | `/api/admin/student-answers`| grade answer                   | admin only     |
| Student Exams                               | `/api/student/exams*`       | list/start/session/save/submit | student only   |
| Student Results                             | `/api/student/results*`     | own results                    | student only   |
| Admin Results                               | `/api/admin/results*`       | exam statistics, student views | admin only     |

Use this matrix when building navigation/guards on the frontend.

---

## 3. Question Bank Management (Admin Only)

Routes in `src/routes/question.py` – prefix `/api/admin/questions`.

### 3.1 Import Questions from Excel

- **Method & URL**: `POST /api/admin/questions/import`
- **Description**: Bulk-import questions from an Excel (`.xlsx`) file.
- **Auth**: Admin.
- **Content-Type**: `multipart/form-data`.

#### Multipart Spec

- Field name: `file`
- Type: single file, `.xlsx` only (validated by `validate_excel_file`).

#### Excel Template Structure

Expected columns (header row):

- `title` (string, required)
- `description` (string, optional)
- `complexity` (string, required; e.g., `"Class 7"`, `"easy"`)
- `type` (string, required; `single_choice`, `multi_choice`, `text`, `image_upload`)
- `options` (string; JSON array or CSV: e.g., `"[\"A\",\"B\"]"` or `"A,B"`)
- `correct_answers` (string; JSON array or CSV, e.g., `"[\"A\"]"`)
- `max_score` (integer ≥ 1)
- `tags` (string; comma-separated, e.g., `"math,algebra"`)

#### Success Response (200) – `ImportResult`

```json
{
  "success_count": 20,
  "error_count": 2,
  "errors": [
    {
      "row_number": 3,
      "errors": ["Missing title", "Invalid max_score (0)"]
    },
    {
      "row_number": 4,
      "errors": ["Options required for single_choice type"]
    }
  ]
}
```

#### Error Responses

- `400 BAD REQUEST` – invalid file type, parsing errors.
- `422 UNPROCESSABLE ENTITY` – multipart validation errors (missing `file`).
- `500 INTERNAL SERVER ERROR` – unhandled server errors.

#### Sample `curl`

```bash
curl -X POST "http://localhost:8000/api/admin/questions/import" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -F "file=@questions.xlsx"
```

### 3.2 List Questions

- **Method & URL**: `GET /api/admin/questions`
- **Description**: List questions with filtering and pagination.
- **Auth**: Admin.

#### Query Parameters (all optional)

- `complexity` – filter by complexity string.
- `qtype` – filter by question type: `single_choice`, `multi_choice`, `text`, `image_upload`.
- `tags` – repeated query param: `?tags=math&tags=algebra`.
- `search` – substring search in title/description (case-insensitive).
- `page` – page number (default `1`, min `1`).
- `limit` – page size (default `20`, min `1`, max `100`).

#### Response (200) – `PaginatedResponse[QuestionResponse]`

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Simple algebra question",
      "description": "Solve for x in 2x + 3 = 7",
      "complexity": "Class 7",
      "type": "single_choice",
      "options": ["A: 1", "B: 2", "C: 3", "D: 4"],
      "correct_answers": ["B"],
      "max_score": 1,
      "tags": ["math", "algebra"],
      "created_at": "2025-01-01T12:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### Sample `curl`

```bash
curl "http://localhost:8000/api/admin/questions?complexity=Class%207&search=algebra&page=1&limit=20" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 3.3 Get Single Question

- **Method & URL**: `GET /api/admin/questions/{question_id}`
- **Auth**: Admin.

#### Response (200) – `QuestionResponse`

Same as a single item in list response.

#### Error Responses

- `404 NOT FOUND` – question not found

```json
{
  "detail": "Question not found"
}
```

#### Sample `curl`

```bash
curl "http://localhost:8000/api/admin/questions/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 3.4 Create Question

- **Method & URL**: `POST /api/admin/questions`
- **Auth**: Admin.

#### Request Body – `QuestionCreate`

```json
{
  "title": "Simple algebra question",
  "description": "Solve for x in 2x + 3 = 7",
  "complexity": "Class 7",
  "type": "single_choice",
  "options": ["A: 1", "B: 2", "C: 3", "D: 4"],
  "correct_answers": ["B"],
  "max_score": 1,
  "tags": ["math", "algebra"]
}
```

- `title` – required, 1–500 chars.
- `description` – optional.
- `complexity` – required string label.
- `type` – one of `single_choice`, `multi_choice`, `text`, `image_upload`.
- `options` – required for choice questions, optional otherwise.
- `correct_answers` – required for objective questions, optional for text/image.
- `max_score` – integer ≥ 1.
- `tags` – optional list of strings.

#### Success Response (201) – `QuestionResponse`

Same fields as request plus `id` and `created_at`.

#### Error Responses

- `422` – validation.
- `500` – unhandled server error.

#### Sample `curl`

```bash
curl -X POST "http://localhost:8000/api/admin/questions" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Simple algebra question",
    "description": "Solve for x in 2x + 3 = 7",
    "complexity": "Class 7",
    "type": "single_choice",
    "options": ["A: 1", "B: 2", "C: 3", "D: 4"],
    "correct_answers": ["B"],
    "max_score": 1,
    "tags": ["math", "algebra"]
  }'
```

### 3.5 Update Question

- **Method & URL**: `PUT /api/admin/questions/{question_id}`
- **Auth**: Admin.

#### Request Body

Same schema as `QuestionCreate`. Use full replacement semantics (send all fields).

#### Success Response (200) – `QuestionResponse`

#### Error Responses

- `404 NOT FOUND` – question not found.
- `422` – validation.

#### Sample `curl`

```bash
curl -X PUT "http://localhost:8000/api/admin/questions/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "description": "Updated description",
    "complexity": "Class 7",
    "type": "single_choice",
    "options": ["A: 1", "B: 2"],
    "correct_answers": ["B"],
    "max_score": 2,
    "tags": ["math"]
  }'
```

### 3.6 Delete Question

- **Method & URL**: `DELETE /api/admin/questions/{question_id}`
- **Auth**: Admin.

#### Success Response (200)

```json
{
  "message": "Question deleted"
}
```

#### Error Responses

- `404 NOT FOUND` – question not found.

> Note: there is no explicit business rule in this layer about preventing deletion when in use; if enforced, it will be in the service layer and returned as `400` with a message.

#### Sample `curl`

```bash
curl -X DELETE "http://localhost:8000/api/admin/questions/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 4. Exam Management (Admin Only)

Routes in `src/routes/exam.py` – prefix `/api/admin/exams` plus additional `/api/admin/student-answers` for manual grading.

### 4.1 Create Exam

- **Method & URL**: `POST /api/admin/exams`
- **Auth**: Admin.

#### Request Body – `ExamCreate`

```json
{
  "title": "Midterm Exam - Algebra",
  "description": "Covers chapters 1-4",
  "start_time": "2025-12-01T09:00:00Z",
  "end_time": "2025-12-01T12:00:00Z",
  "duration_minutes": 90
}
```

- `start_time`, `end_time` – ISO 8601 strings (UTC recommended).
- `end_time` must be after `start_time` (validated).
- `duration_minutes` > 0.

#### Success Response (201) – `ExamResponse`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Midterm Exam - Algebra",
  "description": "Covers chapters 1-4",
  "start_time": "2025-12-01T09:00:00Z",
  "end_time": "2025-12-01T12:00:00Z",
  "duration_minutes": 90,
  "is_published": false,
  "created_by": "550e8400-e29b-41d4-a716-446655440111",
  "created_at": "2025-11-15T10:00:00Z",
  "question_count": 0
}
```

#### Error Responses

- `400 BAD REQUEST` – service-level business errors (e.g., invalid time range).
- `422` – schema validation.

#### Sample `curl`

```bash
curl -X POST "http://localhost:8000/api/admin/exams" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Midterm Exam - Algebra",
    "description": "Covers chapters 1-4",
    "start_time": "2025-12-01T09:00:00Z",
    "end_time": "2025-12-01T12:00:00Z",
    "duration_minutes": 90
  }'
```

### 4.2 List All Exams

- **Method & URL**: `GET /api/admin/exams`
- **Auth**: Admin.

#### Query Params

- `is_published` (optional, bool) – filter by publish status.

#### Response (200) – `List[ExamResponse]`

Array of `ExamResponse` objects.

```json
[
  {
    "id": "...",
    "title": "Midterm Exam - Algebra",
    "description": "...",
    "start_time": "2025-12-01T09:00:00Z",
    "end_time": "2025-12-01T12:00:00Z",
    "duration_minutes": 90,
    "is_published": false,
    "created_by": "...",
    "created_at": "...",
    "question_count": 10
  }
]
```

#### Sample `curl`

```bash
curl "http://localhost:8000/api/admin/exams?is_published=true" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 4.3 Get Exam Details

- **Method & URL**: `GET /api/admin/exams/{exam_id}`
- **Auth**: Admin.

#### Response (200) – `ExamDetailResponse`

```json
{
  "id": "...",
  "title": "Midterm Exam - Algebra",
  "description": "...",
  "start_time": "2025-12-01T09:00:00Z",
  "end_time": "2025-12-01T12:00:00Z",
  "duration_minutes": 90,
  "is_published": false,
  "created_by": "...",
  "created_at": "...",
  "question_count": 10,
  "questions": [
    {
      "id": "...",
      "title": "Simple algebra question",
      "description": "...",
      "complexity": "Class 7",
      "type": "single_choice",
      "options": ["A: 1", "B: 2"],
      "correct_answers": ["B"],
      "max_score": 1,
      "tags": ["math"],
      "created_at": "..."
    }
  ]
}
```

#### Error Responses

- `404 NOT FOUND` – exam not found.

### 4.4 Update Exam

- **Method & URL**: `PUT /api/admin/exams/{exam_id}`
- **Auth**: Admin.

#### Request Body – `ExamUpdate`

All fields optional:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "start_time": "2025-12-01T08:30:00Z",
  "end_time": "2025-12-01T11:00:00Z",
  "duration_minutes": 75
}
```

- When updating `start_time` / `end_time`, `end_time` must still be after `start_time`.
- Additional business rules (e.g., cannot update once there are submissions) are enforced in `exam_service.update_exam` and surfaced as `400` with message.

#### Response (200) – `ExamResponse`

#### Error Responses

- `400 BAD REQUEST` – business rules (e.g., exam locked because submissions exist).
- `404 NOT FOUND` – exam not found.
- `422` – validation.

### 4.5 Delete Exam

- **Method & URL**: `DELETE /api/admin/exams/{exam_id}`
- **Auth**: Admin.

#### Response (200)

```json
{
  "message": "Exam deleted"
}
```

#### Error Responses

- `404 NOT FOUND` – exam not found.
- `400 BAD REQUEST` – if exam cannot be deleted due to submissions (thrown from service layer).

### 4.6 Assign Questions to Exam

- **Method & URL**: `POST /api/admin/exams/{exam_id}/questions`
- **Auth**: Admin.

#### Request Body – `List[ExamQuestionAssignment]`

```json
[
  { "question_id": "q-uuid-1", "order_index": 0 },
  { "question_id": "q-uuid-2", "order_index": 1 }
]
```

- `question_id` – UUID of existing question.
- `order_index` – zero-based integer.

#### Response (200) – `ExamDetailResponse`

Updated exam including `questions` list.

#### Error Responses

- `404 NOT FOUND` – exam or question not found.
- `400 BAD REQUEST` – invalid assignment (duplicates, etc.).

### 4.7 Reorder Questions

- **Method & URL**: `PUT /api/admin/exams/{exam_id}/questions/reorder`
- **Auth**: Admin.

#### Request Body

Array of question IDs in the desired order:

```json
[
  "q-uuid-2",
  "q-uuid-1"
]
```

#### Response (200)

```json
{
  "message": "Questions reordered"
}
```

#### Error Responses

- `400 BAD REQUEST` – invalid payload or exam state.

### 4.8 Publish/Unpublish Exam

- **Method & URL**: `PUT /api/admin/exams/{exam_id}/publish`
- **Auth**: Admin.

#### Request Body – `PublishRequest`

```json
{
  "is_published": true
}
```

#### Response (200) – `ExamResponse`

Exam with updated `is_published` flag.

#### Error Responses

- `404 NOT FOUND` – exam not found.
- `400 BAD REQUEST` – must have at least one question assigned to publish, or other business rules.

### 4.9 Manual Grade Question (Admin)

- **Method & URL**: `POST /api/admin/student-answers/{answer_id}/grade`
- **Auth**: Admin.

#### Request Body – `ManualGradeRequest`

```json
{
  "score": 4.5,
  "feedback": "Good explanation, minor errors."
}
```

- `score` – number, must be between `0` and question’s `max_score`.
- `feedback` – optional string stored for audit.

#### Success Response (200)

```json
{
  "id": "answer-uuid",
  "question_id": "question-uuid",
  "score": 4.5,
  "is_correct": false
}
```

- Also triggers recomputation of the overall `StudentExam.total_score`.

#### Error Responses

- `404 NOT FOUND` – answer or question not found.
- `400 BAD REQUEST` – score outside allowed range.

---

## 5. Student Exam Flow

Routes in `src/routes/student.py` – prefix `/api/student`.

### 5.1 List Available Exams

- **Method & URL**: `GET /api/student/exams`
- **Auth**: Student.

Backend logic uses current time vs `start_time`/`end_time` to set `status`:

- `upcoming` – now < `start_time`
- `available` – `start_time` ≤ now ≤ `end_time`
- `ended` – now > `end_time`

#### Response (200) – `List[AvailableExamResponse]`

```json
[
  {
    "exam_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Algebra Midterm",
    "description": "Covers algebra topics",
    "start_time": "2025-12-01T09:00:00Z",
    "end_time": "2025-12-01T12:00:00Z",
    "duration_minutes": 90,
    "status": "available"
  }
]
```

#### Sample `curl`

```bash
curl "http://localhost:8000/api/student/exams" \
  -H "Authorization: Bearer <STUDENT_TOKEN>"
```

### 5.2 Start Exam

- **Method & URL**: `POST /api/student/exams/{exam_id}/start`
- **Auth**: Student.
- **Description**: Start or resume a student exam (`StudentExam`).

#### Response (201 or 200) – `StudentExamResponse`

```json
{
  "id": "student-exam-uuid",
  "exam_id": "exam-uuid",
  "student_id": "student-uuid",
  "started_at": "2025-12-01T09:05:00Z",
  "submitted_at": null,
  "status": "in_progress",
  "time_remaining_seconds": 0
}
```

- If a new session is created: HTTP `201 Created`.
- If an existing `in_progress` session is resumed: HTTP `200 OK`.

#### Error Responses

- `400 BAD REQUEST` – exam not available, already submitted, expired, etc.
- `403 FORBIDDEN` – not allowed (exam belongs to another student or business rules).

#### Sample `curl`

```bash
curl -X POST "http://localhost:8000/api/student/exams/<EXAM_ID>/start" \
  -H "Authorization: Bearer <STUDENT_TOKEN>"
```

### 5.3 Get Exam Session

- **Method & URL**: `GET /api/student/exams/{student_exam_id}`
- **Auth**: Student.
- **Description**: Retrieve complete exam session state for an in-progress exam.

#### Response (200) – `ExamSessionResponse`

```json
{
  "student_exam": {
    "id": "student-exam-uuid",
    "exam_id": "exam-uuid",
    "student_id": "student-uuid",
    "started_at": "2025-12-01T09:05:00Z",
    "submitted_at": null,
    "status": "in_progress",
    "time_remaining_seconds": 1200
  },
  "exam_details": {
    "title": "Algebra Midterm",
    "description": "Covers algebra topics",
    "duration_minutes": 90
  },
  "questions": [
    {
      "id": "question-uuid",
      "title": "Simple algebra question",
      "description": "Solve for x in 2x + 3 = 7",
      "complexity": "Class 7",
      "type": "single_choice",
      "options": ["A: 1", "B: 2", "C: 3", "D: 4"],
      "max_score": 1,
      "tags": ["math", "algebra"],
      "created_at": "..."
      // NOTE: `correct_answers` is removed before returning to students
    }
  ],
  "answers": {
    "question-uuid": {
      "answer": "B"
    }
  }
}
```

If the exam time is expired, backend returns `400` with `"Exam time expired"`.

#### Error Responses

- `400 BAD REQUEST` – exam expired.
- `403 FORBIDDEN` – student not owner of session.
- `404 NOT FOUND` – session not found.

#### Sample `curl`

```bash
curl "http://localhost:8000/api/student/exams/<STUDENT_EXAM_ID>" \
  -H "Authorization: Bearer <STUDENT_TOKEN>"
```

### 5.4 Save Answer (Auto-save)

- **Method & URL**: `PUT /api/student/exams/{student_exam_id}/answer`
- **Auth**: Student.
- **Description**: Save a single answer. Intended for frequent auto-save.

#### Request Body – `AnswerSubmission`

Generic JSON structure:

```json
{
  "question_id": "question-uuid",
  "answer_value": {
    "answer": "B"
  }
}
```

Recommended `answer_value` conventions by question type:

- `single_choice`:

  ```json
  {
    "question_id": "...",
    "answer_value": { "answer": "A" }
  }
  ```

- `multi_choice`:

  ```json
  {
    "question_id": "...",
    "answer_value": { "answers": ["A", "C"] }
  }
  ```

- `text`:

  ```json
  {
    "question_id": "...",
    "answer_value": { "text": "student response" }
  }
  ```

- `image_upload` (if implemented):

  ```json
  {
    "question_id": "...",
    "answer_value": { "file_url": "https://.../image.png" }
  }
  ```

#### Response (200)

```json
{
  "success": true,
  "saved_at": "2025-12-01T09:10:05.123456+00:00"
}
```

#### Error Responses

- `400 BAD REQUEST` – invalid session, time expired, invalid question.
- `403 FORBIDDEN` – not owner.

#### Auto-Save Notes (Frontend)

- Use a debounced update (e.g., 3–5 seconds after last change).
- Avoid sending multiple requests for the same question in quick succession; cancel or coalesce.
- On network error, show a warning and retry on next change or after a short backoff.

### 5.5 Submit Exam

- **Method & URL**: `POST /api/student/exams/{student_exam_id}/submit`
- **Auth**: Student.
- **Description**: Submit an exam; triggers auto-grading.

#### Response (200) – `ExamSubmitResponse`

```json
{
  "student_exam_id": "student-exam-uuid",
  "submitted_at": "2025-12-01T10:40:00Z",
  "message": "Submitted successfully",
  "total_score": 8.0,
  "graded_count": 8,
  "pending_review_count": 2,
  "grading_results": [
    {
      "question_id": "question-uuid-1",
      "is_correct": true,
      "score": 1.0,
      "max_score": 1,
      "requires_manual_review": false
    },
    {
      "question_id": "question-uuid-2",
      "is_correct": null,
      "score": null,
      "max_score": 5,
      "requires_manual_review": true
    }
  ]
}
```

#### Error Responses

- `400 BAD REQUEST` – exam already submitted, expired, or invalid state.
- `403 FORBIDDEN` – not owner.

#### Sample `curl`

```bash
curl -X POST "http://localhost:8000/api/student/exams/<STUDENT_EXAM_ID>/submit" \
  -H "Authorization: Bearer <STUDENT_TOKEN>"
```

---

## 6. Results & Grading

Student and admin results routes in `src/routes/results.py` and `src/routes/admin_results.py`.

### 6.1 Get Student Result (By StudentExam ID)

- **Method & URL**: `GET /api/student/results/{student_exam_id}`
- **Auth**: Student.

#### Response (200) – `StudentResultResponse`

```json
{
  "student_exam_id": "student-exam-uuid",
  "exam_title": "Algebra Midterm",
  "student_name": "Jane Doe",
  "student_email": "jane@example.com",
  "total_score": 8.0,
  "max_possible_score": 10.0,
  "percentage": 80.0,
  "submitted_at": "2025-12-01T10:40:00Z",
  "status": "submitted",
  "question_results": [
    {
      "question_id": "question-uuid-1",
      "title": "What is 2+2?",
      "type": "single_choice",
      "student_answer": { "answer": "A" },
      "correct_answer": ["B"],
      "is_correct": false,
      "score": 0.0,
      "max_score": 1,
      "requires_manual_review": false
    }
  ]
}
```

> Note: Correct answers are only exposed once the exam is submitted.

#### Error Responses

- `403 FORBIDDEN` – student does not own this result.
- `404 NOT FOUND` – `StudentExam` not found.

### 6.2 Get Student Result by Exam ID

- **Method & URL**: `GET /api/student/results/exam/{exam_id}`
- **Auth**: Student.
- **Description**: Convenience endpoint to get result by `exam_id` instead of `student_exam_id`.

#### Error Responses

- `404 NOT FOUND` – student has no attempt for this exam.

### 6.3 Get All Results for Exam (Admin)

- **Method & URL**: `GET /api/admin/results/exams/{exam_id}`
- **Auth**: Admin.

#### Response (200) – `AdminExamResultsResponse`

```json
{
  "exam_summary": {
    "exam_id": "exam-uuid",
    "exam_title": "Algebra Midterm",
    "total_students": 30,
    "average_score": 6.23,
    "highest_score": 10.0,
    "lowest_score": 2.0,
    "submission_count": 28
  },
  "student_results": [
    {
      "student_id": "student-uuid-1",
      "student_name": "John Doe",
      "student_email": "john@example.com",
      "total_score": 7.0,
      "percentage": 70.0,
      "submitted_at": "2025-12-01T11:00:00Z",
      "status": "submitted"
    }
  ]
}
```

#### Error Responses

- `404 NOT FOUND` – exam not found.

### 6.4 Get Detailed Student Exam Review (Admin)

- **Method & URL**: `GET /api/admin/results/student-exams/{student_exam_id}`
- **Auth**: Admin.

Returns the same `StudentResultResponse` as the student endpoint but for any student exam.

#### Error Responses

- `404 NOT FOUND` – exam not found.

### 6.5 Get Exam Statistics (Admin)

- **Method & URL**: `GET /api/admin/results/exams/{exam_id}/statistics`
- **Auth**: Admin.

#### Response (200)

Plain JSON from `results_service.calculate_exam_statistics`, typically including fields such as:

```json
{
  "exam_id": "exam-uuid",
  "average_score": 6.23,
  "median_score": 6.0,
  "max_score": 10.0,
  "min_score": 2.0,
  "submission_count": 28
}
```

(Exact fields may vary; inspect this endpoint via `/docs`.)

#### Error Responses

- `404 NOT FOUND` – exam not found.

### 6.6 Get All Exams for Student (Admin)

- **Method & URL**: `GET /api/admin/results/students/{student_id}/exams`
- **Auth**: Admin.

#### Response (200)

```json
[
  {
    "student_exam_id": "...",
    "exam_id": "...",
    "exam_title": "Algebra Midterm",
    "total_score": 7.0,
    "max_possible_score": 10.0,
    "percentage": 70.0,
    "submitted_at": "2025-12-01T11:00:00Z",
    "status": "submitted"
  }
]
```

---

## 7. Data Models & Schemas

Key Pydantic schemas are in `src/schemas/*`.

### 7.1 User Schemas

- `UserCreate` – registration payload.
- `UserLogin` – not used directly by routes (login uses form), but matches shape.
- `UserResponse` – user data in responses.
- `TokenResponse` – login response with token + user.

See examples in [Authentication](#2-authentication--authorization).

### 7.2 Question Schemas

Located in `src/schemas/question.py`.

- `QuestionTypeLiteral` enum values:
  - `single_choice`
  - `multi_choice`
  - `text`
  - `image_upload`
- `QuestionCreate` – request body for create/update endpoints.
- `QuestionResponse` – includes `id`, `created_at`.
- `QuestionFilter` – filter model mirrored by query params.
- `ImportResult` – Excel import summary.
- `PaginatedResponse[T]` – generic wrapper for paginated data.

### 7.3 Exam Schemas

Located in `src/schemas/exam.py`.

- `ExamCreate` – create exam.
- `ExamUpdate` – update exam (all optional).
- `ExamResponse` – base exam info in lists.
- `ExamDetailResponse` – extends `ExamResponse` with `questions`.
- `ExamQuestionAssignment` – assignment objects.
- `PublishRequest` – publish/unpublish payload.

### 7.4 Student Exam Schemas

Located in `src/schemas/student_exam.py`.

- `AvailableExamResponse` – list visible exams to students.
- `StudentExamResponse` – student exam session metadata.
- `AnswerSubmission` – request for save-answer endpoint.
- `ExamSubmitResponse` – response when submitting exam.
- `ExamDetailsLite` – minimal exam info in sessions.
- `ExamSessionResponse` – full student view of an exam session.
- `GradingResult` – per-question grading details after submission.
- `ManualGradeRequest` – admin manual grading payload.

### 7.5 Result Schemas

Located in `src/schemas/result.py`.

- `QuestionResultResponse` – per-question breakdown.
- `StudentResultResponse` – full result for student.
- `ExamResultsSummary` – aggregate exam stats.
- `StudentResultSummary` – single student’s summary in admin listing.
- `AdminExamResultsResponse` – top-level response for admin `/exams/{exam_id}`.

### 7.6 Pagination Schema

`PaginatedResponse[T]` in `question.py`:

```json
{
  "data": [/* array of items */],
  "total": 123,
  "page": 1,
  "limit": 20
}
```

Use `page` and `limit` query params for paginated endpoints.

---

## 8. Error Handling

FastAPI default HTTP error model is:

```json
{
  "detail": "..."
}
```

The codebase does not implement a global custom error wrapper, but you can standardize in the frontend by mapping these responses.

### 8.1 Status Codes Used

| Status | Meaning                                          |
|--------|--------------------------------------------------|
| 200    | OK                                               |
| 201    | Created                                          |
| 400    | Bad Request (business logic / invalid state)     |
| 401    | Unauthorized (missing/invalid token)             |
| 403    | Forbidden (role mismatch / not owner)            |
| 404    | Not Found                                        |
| 409    | Conflict (duplicate email on registration)       |
| 422    | Validation Error (Pydantic / schema issues)      |
| 500    | Internal Server Error                            |

### 8.2 Common Error Scenarios

- **Authentication errors**
  - Missing token:

    ```json
    {
      "detail": "Not authenticated"
    }
    ```

  - Invalid/expired token:

    ```json
    {
      "detail": "Could not validate credentials"
    }
    ```

- **Permission errors**

  ```json
  {
    "detail": "Admin access required"
  }
  ```

  or

  ```json
  {
    "detail": "Student access required"
  }
  ```

- **Business logic errors** (examples – exact messages from service layer):
  - Exam not available to start.
  - Exam already submitted.
  - Cannot delete exam with submissions.
  - Score outside allowed range when manual grading.

- **Validation errors** – FastAPI/Pydantic error list with `loc`, `msg`, `type`.

---

## 9. Integration Examples

### 9.1 Complete Authentication Flow (TypeScript/Fetch)

```ts
const API_BASE = "http://localhost:8000";

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: "admin" | "student";
  };
}

async function register(email: string, password: string, role: "admin" | "student") {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role })
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

async function login(email: string, password: string): Promise<LoginResponse> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

function saveToken(token: string) {
  localStorage.setItem("access_token", token);
}

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getProfile() {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
```

### 9.2 Admin Workflow Example (Import → Create Exam → Assign → Publish)

Pseudocode/TypeScript:

```ts
async function importQuestions(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/api/admin/questions/import`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: form
  });
  return res.json();
}

async function createExam(payload: any) {
  const res = await fetch(`${API_BASE}/api/admin/exams`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function assignQuestions(examId: string, assignments: {question_id: string; order_index: number;}[]) {
  const res = await fetch(`${API_BASE}/api/admin/exams/${examId}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(assignments)
  });
  return res.json();
}

async function publishExam(examId: string) {
  const res = await fetch(`${API_BASE}/api/admin/exams/${examId}/publish`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ is_published: true })
  });
  return res.json();
}
```

### 9.3 Student Workflow Example

```ts
async function listAvailableExams() {
  const res = await fetch(`${API_BASE}/api/student/exams`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

async function startExam(examId: string) {
  const res = await fetch(`${API_BASE}/api/student/exams/${examId}/start`, {
    method: "POST",
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

async function getExamSession(studentExamId: string) {
  const res = await fetch(`${API_BASE}/api/student/exams/${studentExamId}`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

async function saveAnswer(studentExamId: string, questionId: string, answerValue: any) {
  const res = await fetch(`${API_BASE}/api/student/exams/${studentExamId}/answer`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ question_id: questionId, answer_value: answerValue })
  });
  return res.json();
}

async function submitExam(studentExamId: string) {
  const res = await fetch(`${API_BASE}/api/student/exams/${studentExamId}/submit`, {
    method: "POST",
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

async function viewResult(studentExamId: string) {
  const res = await fetch(`${API_BASE}/api/student/results/${studentExamId}`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}
```

### 9.4 Auto-Save Implementation Example

Debounced auto-save using `setTimeout` / React hooks:

```ts
function useAutoSave(
  studentExamId: string,
  questionId: string,
  value: any,
  delayMs = 5000
) {
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!studentExamId || !questionId) return;
    setPending(true);
    const handle = setTimeout(() => {
      saveAnswer(studentExamId, questionId, value)
        .catch(console.error)
        .finally(() => setPending(false));
    }, delayMs);

    return () => clearTimeout(handle);
  }, [studentExamId, questionId, value, delayMs]);

  return { pending };
}
```

**Local Storage Backup Strategy**

- Mirror the latest answer for each question in `localStorage` with key `exam:<studentExamId>:<questionId>`.
- On reload, hydrate the form with saved local values and immediately re-sync once API is reachable.

**Conflict Resolution**

- Use server as source of truth.
- When fetching session, compare timestamps if you store them client-side; prompt user to keep server or local answer if they differ.

### 9.5 Timer Implementation Example

```ts
function useExamTimer(startSeconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = React.useState(startSeconds);

  React.useEffect(() => {
    if (remaining <= 0) {
      onExpire();
      return;
    }
    const id = setInterval(() => {
      setRemaining((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [remaining, onExpire]);

  return remaining;
}
```

- Periodically call `getExamSession` (e.g., every 60–120 seconds) to sync remaining time with server to avoid drift.
- When `remaining` hits 0, automatically call `submitExam` for the current `student_exam_id`.

---

## 10. Testing & Development

### 10.1 Health Check Endpoints

- `GET /health` – app health.
- `GET /db-health` – DB connectivity.

### 10.2 API Docs

- Swagger UI: `GET /docs`
- ReDoc: `GET /redoc`
- OpenAPI JSON: `GET /openapi.json`

### 10.3 Environment & Setup

Relevant settings in `src/config/settings.py`:

- `DATABASE_URL` – Postgres connection string.
- `JWT_SECRET` – JWT signing secret.
- `JWT_ALGORITHM` – default `HS256`.
- `JWT_EXPIRATION` – minutes (default `30`).
- `CORS_ORIGINS` – list of allowed frontends.

#### Running Backend (likely commands)

From `backend/` folder:

```bash
# Install dependencies
pip install -r requirements.txt

# Run app (development)
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

There is also a `run.py` / `run_server.ps1` script in the repo which can be used in development.

#### Docker & DB

The repo includes `backend/docker/docker-compose.yml` for Postgres; use it as defined in that file.

### 10.4 Testing with curl/Postman

- Use an environment variable `{{baseUrl}}` set to `http://localhost:8000`.
- Create `{{accessToken}}` updated by login responses.
- For Postman, set `Authorization` type to `Bearer Token` and use `{{accessToken}}`.

---

## 11. Database Migration Information

While migrations are handled via Alembic on the backend, a basic conceptual schema is helpful for frontend developers.

### 11.1 Main Entities (Conceptual)

- **User** (`users`)
  - `id` (UUID)
  - `email` (unique)
  - `password_hash`
  - `role` (`admin` / `student`)
  - `created_at`

- **Question** (`questions`)
  - `id` (UUID)
  - `title`, `description`, `complexity`, `type`
  - `options` (JSONB)
  - `correct_answers` (JSONB)
  - `max_score`
  - `tags` (array or JSONB)
  - `created_at`

- **Exam** (`exams`)
  - `id` (UUID)
  - `title`, `description`
  - `start_time`, `end_time`, `duration_minutes`
  - `is_published`
  - `created_by` (FK to `users`)
  - `created_at`

- **ExamQuestion** (`exam_questions`)
  - `id` (UUID)
  - `exam_id` (FK)
  - `question_id` (FK)
  - `order_index`

- **StudentExam** (`student_exams`)
  - `id` (UUID)
  - `exam_id` (FK)
  - `student_id` (FK to `users`)
  - `status` (`not_started`, `in_progress`, `submitted`, `expired`)
  - `started_at`, `submitted_at`
  - `total_score` (numeric, nullable until graded)

- **StudentAnswer** (`student_answers`)
  - `id` (UUID)
  - `student_exam_id` (FK)
  - `question_id` (FK)
  - `answer_value` (JSONB)
  - `is_correct` (bool, nullable for manual)
  - `score` (numeric, nullable)
  - `graded_by` (FK to `users`, nullable)
  - `graded_at` (timestamp, nullable)

### 11.2 Enum Values

- **UserRole** (in code `UserRole`)
  - `admin`
  - `student`

- **QuestionType** (`QuestionTypeLiteral`)
  - `single_choice`
  - `multi_choice`
  - `text`
  - `image_upload`

- **ExamStatus** (for StudentExam)
  - `not_started`
  - `in_progress`
  - `submitted`
  - `expired`

### 11.3 JSONB Field Formats

- `Question.options`: `string[]` — e.g., `["A: 1", "B: 2"]`.
- `Question.correct_answers`: `string[]` — e.g., `["B"]` or `["A","C"]`.
- `StudentAnswer.answer_value`: free JSON with shapes described in [Save Answer](#54-save-answer-auto-save).

---

## 12. Best Practices & Notes

### 12.1 Authentication Best Practices

- Prefer storing the JWT in memory or `localStorage` in development; in production, consider an httpOnly cookie-based approach if you implement refresh tokens server-side.
- After login, save `access_token` and user role; ensure all protected API calls include `Authorization: Bearer <token>`.
- On `401` / `403`, redirect to login or show a permission error as appropriate.

### 12.2 Auto-Save Best Practices

- Debounce saves (e.g., 3–5s) to avoid spamming the server.
- Show visual feedback (e.g., “Saving…” / “Saved”).
- Queue retries on transient errors; ensure that final submission blocks until last save is confirmed if possible.

### 12.3 Time Handling

- All times are stored and returned as ISO 8601 timestamps, generally UTC.
- Client should convert to local timezone for display.
- Use `ExamSessionResponse.student_exam.time_remaining_seconds` to drive countdown timers.

### 12.4 File Upload Considerations

- Excel import: `.xlsx` only.
- Ensure UI validates file type and reasonable size before uploading.
- For `image_upload` questions, answers reference uploaded file URLs; actual upload/storage API is outside this backend scope.

### 12.5 Performance Considerations

- Use pagination (`page`, `limit`) for question lists.
- Avoid re-fetching large datasets unnecessarily; cache exams and questions on the client where appropriate.

### 12.6 Security Notes

- Always use HTTPS in production so JWT tokens and credentials are encrypted in transit.
- Never log or store plain-text passwords on the client or in logs.
- CORS is configured for localhost dev origins; update `CORS_ORIGINS` for deployed frontend domains.
- Mitigate XSS by properly escaping/rendering question text and descriptions in the frontend.

---

This documentation should provide enough detail for frontend developers to implement all required admin and student workflows against the backend API without inspecting server code. If new endpoints are added, update this file alongside the backend implementation.
