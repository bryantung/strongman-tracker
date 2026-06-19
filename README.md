# Strongman Tracker 🏋️‍♂️

A minimalist, responsive web application for logging workouts, tracking body measurements, monitoring recovery states, and viewing personal fitness analytics.

---

## Features

- **Workout Logging**: Track lifts, sets, reps, and weights.
- **Recovery Analysis**: Log sleep, energy, and joint health to calculate recovery readiness.
- **Metrics & Measurements**: Log and track body weight and custom measurements.
- **Analytics**: View trends, progress, and performance visualizations.
- **Hybrid Storage**: Local-first mock database mode with seamless promotion to AWS DynamoDB in cloud environments.

---

## Tech Stack

- **Frontend**: HTML5, EJS Templates, Vanilla CSS
- **Backend**: Node.js, Express
- **Database**: AWS DynamoDB (with fallback to local JSON storage)
- **Deployment**: AWS Serverless (SAM/CloudFormation)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone this repository to your local machine.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server with automatic reloading (via `nodemon`):

```bash
npm run dev
```

The application will be accessible at: **`http://localhost:3999`**

### Type Checking & Build

To check for type errors using TypeScript:
```bash
npm run typecheck
```

To compile the TypeScript project (if applicable):
```bash
npm run build
```

---

## Database Configuration

The application is built to run out-of-the-box without requiring an active AWS connection.

### 1. Local Fallback Mode (Mock DB)
If the `TABLE_NAME` environment variable or AWS credentials are not set, the application falls back to storing data locally in:
- `local-db.json`

### 2. AWS DynamoDB Mode
To connect the app to AWS DynamoDB, ensure the following environment variables are configured in your runtime:

- `TABLE_NAME`: The name of your DynamoDB table (e.g., `strongman_tracker`).
- `AWS_REGION`: The AWS region of your table (e.g., `us-east-1`).
- AWS credentials: Standard AWS environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, etc.) or an active IAM role.

---

## Infrastructure & Cloud Deployment

This project includes a serverless infrastructure template located in the [infra/template.yaml](file:///Users/bryantung/Documents/Projects/Personal/workout-tracker/infra/template.yaml) folder, designed for deployment with **AWS SAM**.

It configures:
- An **AWS::Serverless::Function** (`ApiFunction`) utilizing a `nodejs18.x` runtime, mapped to `handler.handler`.
- An **AWS::DynamoDB::Table** (`TrackerTable`) named `strongman_tracker` with a billing mode of `PAY_PER_REQUEST` and a composite key schema (`PK` as partition key and `SK` as sort key).
- An **HttpApi** event to proxy all HTTP traffic (`/{proxy+}`) to the Lambda function.

---

## Project Structure

- **[handler.js](file:///Users/bryantung/Documents/Projects/Personal/workout-tracker/handler.js)**: Entry point wrapper for AWS Lambda execution.
- **[src/server.js](file:///Users/bryantung/Documents/Projects/Personal/workout-tracker/src/server.js)**: Local server execution entry point.
- **[src/app.js](file:///Users/bryantung/Documents/Projects/Personal/workout-tracker/src/app.js)**: Express application setup, routes registration, and configuration.
- **[src/routes/](file:///Users/bryantung/Documents/Projects/Personal/workout-tracker/src/routes)**: Route handlers for each feature of the tracker.
- **[src/services/](file:///Users/bryantung/Documents/Projects/Personal/workout-tracker/src/services)**:
  - `dynamo.js`: Data Access Object (DAO) managing DynamoDB and local JSON DB fallbacks.
  - `logic.js`: Pure functions for computing user fitness metrics (e.g., recovery status evaluation logic).
- **[public/](file:///Users/bryantung/Documents/Projects/Personal/workout-tracker/public)**: Static assets, styles, and client-side scripts.
- **[infra/template.yaml](file:///Users/bryantung/Documents/Projects/Personal/workout-tracker/infra/template.yaml)**: SAM template for cloud infrastructure.
