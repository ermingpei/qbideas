# Project Migration Guide

This guide outlines the steps to migrate the `qbideas` project to a new MacBook and set up the development environment.

## 1. Prerequisites

Before cloning the repository, ensure the following are installed on your new machine:

-   **Git**: `git --version`
-   **Node.js** (v18+ recommended): `node -v`
-   **Docker Desktop**: Ensure it is installed and running. `docker info`
-   **VS Code** (or your preferred IDE)

## 2. Clone the Repository

```bash
git clone https://github.com/ermingpei/qbideas.git
cd qbideas
git submodule update --init --recursive
```

## 3. Environment Setup

> [!IMPORTANT]
> The `.env` file is **NOT** included in the repository for security reasons. You must manually transfer it from your old machine.

1.  **Copy `.env`**: Transfer the `.env` file from your old machine to the root of the `qbideas` directory on the new machine.
2.  **Verify `.env`**: Ensure it contains all necessary secrets (database credentials, API keys, etc.).

## 4. Installation & Startup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Services**:
    The project uses a helper script to start all services (Docker containers for DB, backend, frontend).
    ```bash
    ./start-all-services.sh
    ```

3.  **Verify Status**:
    Check if everything is running correctly:
    ```bash
    ./check-status.sh
    ```

## 5. AI Assistant Prompt

Copy and paste the following prompt into your AI coding assistant (e.g., Antigravity, GitHub Copilot, ChatGPT) on the new machine to give it full context and resume work immediately.

---

**[BEGIN PROMPT]**

I have just migrated this project (`qbideas`) to a new MacBook. I need you to help me verify the environment setup and continue development.

**Project Overview:**
`qbideas` is a collaboration platform for submitting and managing ideas. It uses a microservices architecture.

**Tech Stack:**
-   **Frontend**: React (Vite), TypeScript, TailwindCSS. Located in `frontend/`.
-   **Backend**: Node.js, Express, TypeScript. Located in `services/api/`.
-   **Database**: PostgreSQL (running in Docker).
-   **Infrastructure**: Docker Compose.

**Current State:**
-   I have cloned the repo and transferred the `.env` file.
-   I have run `npm install` and `./start-all-services.sh`.
-   The latest work involved fixing authentication, API type errors, and Docker stability.

**Key Documentation:**
-   `README_START_HERE.md`: Main entry point.
-   `START_HERE.md`: Quick start guide.
-   `COLLABORATION_PLATFORM_ROADMAP.md`: Future plans.
-   `task.md`: (If available) Tracks recent tasks.

**Your Task:**
1.  **Verify Environment**: Help me check if the application is running correctly.
    -   Check if Docker containers are up.
    -   Check if the backend API is reachable (`http://localhost:3001/health` or similar).
    -   Check if the frontend is accessible (`http://localhost:5173`).
2.  **Resume Work**: Ask me what feature or bug fix we should tackle next.

Please start by running a health check on the system components.

**[END PROMPT]**
