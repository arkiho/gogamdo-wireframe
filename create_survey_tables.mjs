import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});

// Create survey_templates
await conn.execute(`
  CREATE TABLE IF NOT EXISTS survey_templates (
    id int AUTO_INCREMENT PRIMARY KEY,
    name varchar(300) NOT NULL,
    type enum('initial_manager','company_wide','post_occupancy','custom') NOT NULL,
    description text,
    isDefault tinyint DEFAULT 0,
    isActive tinyint NOT NULL DEFAULT 1,
    createdBy int,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);
console.log("✓ survey_templates created");

// Create survey_questions
await conn.execute(`
  CREATE TABLE IF NOT EXISTS survey_questions (
    id int AUTO_INCREMENT PRIMARY KEY,
    templateId int NOT NULL,
    sectionTitle varchar(200),
    questionText text NOT NULL,
    questionType enum('single_choice','multiple_choice','scale','text','number','matrix') NOT NULL,
    isRequired tinyint NOT NULL DEFAULT 1,
    sortOrder int NOT NULL DEFAULT 0,
    metadata json,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);
console.log("✓ survey_questions created");

// Create survey_question_options
await conn.execute(`
  CREATE TABLE IF NOT EXISTS survey_question_options (
    id int AUTO_INCREMENT PRIMARY KEY,
    questionId int NOT NULL,
    optionText varchar(500) NOT NULL,
    optionValue varchar(200),
    sortOrder int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log("✓ survey_question_options created");

// Create survey_instances
await conn.execute(`
  CREATE TABLE IF NOT EXISTS survey_instances (
    id int AUTO_INCREMENT PRIMARY KEY,
    templateId int NOT NULL,
    clientProjectId int,
    token varchar(100) NOT NULL,
    recipientEmail varchar(320),
    recipientName varchar(200),
    status enum('draft','sent','opened','in_progress','completed','expired') NOT NULL DEFAULT 'draft',
    expiresAt bigint,
    completedAt bigint,
    responseCount int DEFAULT 0,
    customQuestions text,
    reminderSentAt bigint,
    reminderCount int DEFAULT 0,
    metadata json,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log("✓ survey_instances created");

// Create survey_responses
await conn.execute(`
  CREATE TABLE IF NOT EXISTS survey_responses (
    id int AUTO_INCREMENT PRIMARY KEY,
    instanceId int NOT NULL,
    questionId int NOT NULL,
    responseValue text,
    selectedOptions json,
    scaleValue int,
    matrixResponses json,
    respondentInfo json,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);
console.log("✓ survey_responses created");

// Create survey_analysis_reports
await conn.execute(`
  CREATE TABLE IF NOT EXISTS survey_analysis_reports (
    id int AUTO_INCREMENT PRIMARY KEY,
    clientProjectId int,
    instanceId int,
    reportType enum('initial_analysis','company_wide_analysis','post_occupancy','custom') NOT NULL DEFAULT 'initial_analysis',
    overallScore int,
    executiveSummary text,
    categoryScores text,
    painPoints text,
    recommendations text,
    spaceNeeds text,
    fullReportJson longtext,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);
console.log("✓ survey_analysis_reports created");

console.log("\nAll survey tables created successfully!");
await conn.end();
