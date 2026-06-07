// MongoDB initialization script
db = db.getSiblingDB("aurahr");

// Create collections
db.createCollection("users");
db.createCollection("employees");
db.createCollection("job_postings");
db.createCollection("candidates");
db.createCollection("performance_reviews");
db.createCollection("development_plans");
db.createCollection("chats");

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.employees.createIndex({ department: 1 });
db.employees.createIndex({ managerId: 1 });
db.employees.createIndex({ firstName: 1, lastName: 1 });

db.job_postings.createIndex({ status: 1 });
db.job_postings.createIndex({ department: 1 });
db.job_postings.createIndex({ createdAt: 1 });

db.candidates.createIndex({ jobPostingId: 1 });
db.candidates.createIndex({ matchScore: 1 });
db.candidates.createIndex({ status: 1 });
db.candidates.createIndex({ email: 1 });

db.performance_reviews.createIndex({ employeeId: 1 });
db.performance_reviews.createIndex({ reviewDate: 1 });

db.development_plans.createIndex({ employeeId: 1 });
db.development_plans.createIndex({ generatedAt: 1 });

db.chats.createIndex({ candidateId: 1 });
db.chats.createIndex({ status: 1 });

print("Database initialized successfully!");
