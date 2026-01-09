# 🗄️ CYNO Healthcare - Database Documentation

## Overview

CYNO Healthcare uses **Prisma ORM** with **SQLite** for development and can be configured for **PostgreSQL** in production. The database schema is designed to support a comprehensive healthcare platform for cancer care management.

---

## 📊 Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Hospital     │───────│     Patient     │───────│     Report      │
└─────────────────┘  1:N  └─────────────────┘  1:N  └─────────────────┘
        │                         │
        │ 1:N                     │ 1:N
        ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│  ActivityLog    │       │    AIReport     │
└─────────────────┘       └─────────────────┘
        │                         
        │                  ┌─────────────────┐
        └──────────────────│ TumorBoardCase  │
                           └─────────────────┘
```

---

## 📋 Models Reference

### 1. Hospital

The main tenant model representing healthcare organizations.

| Field              | Type     | Description                        | Constraints        |
|--------------------|----------|------------------------------------|--------------------|
| `id`               | String   | Primary key (CUID)                 | @id @default(cuid) |
| `name`             | String   | Hospital name                      | Required           |
| `email`            | String   | Hospital email for login           | @unique            |
| `password`         | String   | Hashed password (bcrypt)           | Required           |
| `registrationNumber`| String  | Official registration number       | @unique            |
| `address`          | String?  | Physical address                   | Optional           |
| `phone`            | String?  | Contact phone number               | Optional           |
| `createdAt`        | DateTime | Account creation timestamp         | @default(now())    |
| `updatedAt`        | DateTime | Last update timestamp              | @updatedAt         |

**Relations:**
- `patients` → Patient[] (One-to-Many)
- `tumorBoards` → TumorBoardCase[] (One-to-Many)
- `activityLogs` → ActivityLog[] (One-to-Many)

---

### 2. Patient

Patient records managed by hospitals.

| Field        | Type     | Description                          | Constraints        |
|--------------|----------|--------------------------------------|--------------------|
| `id`         | String   | Primary key (CUID)                   | @id @default(cuid) |
| `patientId`  | String   | External ID (e.g., PT-2024-001)      | @unique            |
| `name`       | String   | Full name                            | Required           |
| `age`        | Int?     | Age in years                         | Optional           |
| `gender`     | String?  | Gender (male/female/other)           | Optional           |
| `cancerType` | String?  | Type of cancer (lung/breast/blood)   | Optional           |
| `status`     | String   | Patient status                       | @default("active") |
| `hospitalId` | String?  | Foreign key to Hospital              | Optional           |
| `createdAt`  | DateTime | Record creation timestamp            | @default(now())    |
| `updatedAt`  | DateTime | Last update timestamp                | @updatedAt         |

**Status Values:**
- `active` - Currently under treatment
- `discharged` - Treatment completed
- `critical` - Requires immediate attention
- `under_review` - Case being reviewed

**Relations:**
- `hospital` → Hospital (Many-to-One)
- `reports` → Report[] (One-to-Many)
- `aiReports` → AIReport[] (One-to-Many)
- `tumorBoards` → TumorBoardCase[] (One-to-Many)

---

### 3. Report

Medical reports and documents uploaded for patients.

| Field       | Type     | Description                      | Constraints        |
|-------------|----------|----------------------------------|--------------------|
| `id`        | String   | Primary key (CUID)               | @id @default(cuid) |
| `fileName`  | String   | Original file name               | Required           |
| `filePath`  | String   | Server storage path              | Required           |
| `fileSize`  | Int      | File size in bytes               | Required           |
| `fileType`  | String   | Type (PDF/DICOM/Image)           | Required           |
| `category`  | String   | Category of report               | Required           |
| `status`    | String   | Processing status                | @default("pending")|
| `patientId` | String   | Foreign key to Patient           | Required           |
| `uploadedAt`| DateTime | Upload timestamp                 | @default(now())    |

**Category Values:**
- `imaging` - X-rays, CT scans, MRI, PET scans
- `pathology` - Biopsy reports, histopathology
- `lab` - Blood tests, tumor markers
- `clinical` - Clinical notes, discharge summaries

**Status Values:**
- `pending` - Awaiting processing
- `ready` - Ready for analysis
- `analyzed` - AI analysis completed

---

### 4. AIReport

AI-generated analysis and recommendations for patients.

| Field            | Type     | Description                        | Constraints        |
|------------------|----------|------------------------------------|--------------------|
| `id`             | String   | Primary key (CUID)                 | @id @default(cuid) |
| `patientId`      | String   | Foreign key to Patient             | Required           |
| `status`         | String   | Report generation status           | @default("draft")  |
| `keyFindings`    | String?  | JSON - Key clinical findings       | Optional           |
| `redFlags`       | String?  | JSON - Critical alerts             | Optional           |
| `suggestedSteps` | String?  | JSON - Recommended next steps      | Optional           |
| `imagingAnalysis`| String?  | AI analysis of imaging reports     | Optional           |
| `pathologyReview`| String?  | AI analysis of pathology           | Optional           |
| `clinicalNotes`  | String?  | AI clinical correlation notes      | Optional           |
| `riskScore`      | Int?     | Risk stratification (1-10)         | Optional           |
| `generatedAt`    | DateTime | Generation timestamp               | @default(now())    |
| `reviewedAt`     | DateTime?| Review timestamp                   | Optional           |
| `reviewedBy`     | String?  | Reviewer name                      | Optional           |

**Status Values:**
- `draft` - Initial creation
- `processing` - AI analysis in progress
- `ready` - Analysis complete, pending review
- `reviewed` - Reviewed by medical professional

**JSON Field Structures:**

```json
// keyFindings
[
  { "type": "finding", "severity": "high", "text": "..." },
  { "type": "observation", "severity": "medium", "text": "..." }
]

// redFlags
[
  { "priority": 1, "message": "Immediate attention required", "action": "..." }
]

// suggestedSteps
[
  { "step": 1, "action": "Schedule follow-up imaging", "timeline": "2 weeks" }
]
```

---

### 5. TumorBoardCase

Multi-disciplinary tumor board case discussions.

| Field            | Type     | Description                        | Constraints        |
|------------------|----------|------------------------------------|--------------------|
| `id`             | String   | Primary key (CUID)                 | @id @default(cuid) |
| `patientId`      | String   | Foreign key to Patient             | Required           |
| `hospitalId`     | String   | Foreign key to Hospital            | Required           |
| `aiSummary`      | String?  | AI-generated case summary          | Optional           |
| `radiologyNotes` | String?  | Radiology specialist notes         | Optional           |
| `pathologyNotes` | String?  | Pathology specialist notes         | Optional           |
| `oncologyNotes`  | String?  | Oncology specialist notes          | Optional           |
| `guidelinesRef`  | String?  | Clinical guidelines references     | Optional           |
| `recommendations`| String?  | JSON - Treatment recommendations   | Optional           |
| `finalDecision`  | String?  | Final treatment decision           | Optional           |
| `status`         | String   | Case status                        | @default("pending")|
| `createdAt`      | DateTime | Creation timestamp                 | @default(now())    |
| `updatedAt`      | DateTime | Last update timestamp              | @updatedAt         |

**Status Values:**
- `pending` - Awaiting review
- `in_progress` - Currently being discussed
- `completed` - Decision made

---

### 6. ActivityLog

Audit trail for all system activities.

| Field        | Type     | Description                      | Constraints        |
|--------------|----------|----------------------------------|--------------------|
| `id`         | String   | Primary key (CUID)               | @id @default(cuid) |
| `hospitalId` | String   | Foreign key to Hospital          | Required           |
| `action`     | String   | Action type identifier           | Required           |
| `entityType` | String   | Type of entity affected          | Required           |
| `entityId`   | String?  | ID of affected entity            | Optional           |
| `description`| String   | Human-readable description       | Required           |
| `metadata`   | String?  | JSON - Additional context        | Optional           |
| `performedBy`| String?  | User who performed action        | Optional           |
| `createdAt`  | DateTime | Activity timestamp               | @default(now())    |

**Action Types:**
- `login` - User authentication
- `upload` - Report upload
- `ai_analysis` - AI report generation
- `review` - Report review
- `patient_add` - New patient added
- `patient_update` - Patient info updated
- `tumor_board_create` - New tumor board case
- `tumor_board_update` - Tumor board updated

**Entity Types:**
- `hospital`
- `patient`
- `report`
- `ai_report`
- `tumor_board`

---

## 🛠️ Database Commands

### Setup & Migration

```bash
# Generate Prisma Client
npx prisma generate

# Create/Apply migrations (development)
npx prisma migrate dev --name init

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Database Administration

```bash
# Open Prisma Studio (Database GUI)
npx prisma studio --url="file:./prisma/dev.db"

# View current schema
npx prisma db pull

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

### Seeding (if implemented)

```bash
# Run database seeder
npx prisma db seed
```

---

## 🔧 Configuration

### Development (SQLite)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")  // "file:./prisma/dev.db"
}
```

### Production (PostgreSQL)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Connection String Format:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

---

## 📁 File Structure

```
BACKEND/
├── prisma/
│   ├── schema.prisma     # Database schema definition
│   ├── dev.db            # SQLite database file (development)
│   └── migrations/       # Migration history
├── .env                  # Environment variables
├── .env.example          # Environment template
└── docs/
    └── db.md             # This documentation
```

---

## 🔒 Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt with salt
2. **No Plain Text Storage**: Sensitive data is never stored in plain text
3. **JSON Fields**: Complex data stored as JSON strings (validated at application level)
4. **Foreign Key Constraints**: Referential integrity maintained through Prisma relations
5. **Audit Logging**: All significant actions are logged in ActivityLog

---

## 📈 Performance Tips

1. **Indexes**: Consider adding indexes for frequently queried fields:
   - `Patient.status`
   - `Report.status`
   - `ActivityLog.createdAt`

2. **Pagination**: Always use pagination for list queries
3. **Select Fields**: Only select required fields in queries
4. **Connection Pooling**: Configure connection pooling for production

---

## 🔄 Migration History

| Version | Date       | Description                    |
|---------|------------|--------------------------------|
| 1.0.0   | 2024-12-28 | Initial schema with all models |

---

## 📞 Support

For database-related issues:
1. Check the Prisma documentation: https://www.prisma.io/docs
2. Verify environment variables in `.env`
3. Run `npx prisma validate` to check schema
4. Use `npx prisma studio` for visual debugging
