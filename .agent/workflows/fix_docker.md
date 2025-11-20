---
description: Fix Docker daemon issues and start services safely
---

# Fix Docker and Start Services

This workflow diagnoses and fixes common Docker issues (daemon not running) and starts the application services while avoiding port conflicts.

1. Check if Docker is running
   ```bash
   docker info >/dev/null 2>&1
   ```

2. If Docker is NOT running (exit code != 0), restart it (macOS)
   // turbo
   ```bash
   echo "Docker is not running. Restarting Docker Desktop..."
   open -a Docker
   # Wait for Docker to be ready
   for i in {1..30}; do 
       docker info >/dev/null 2>&1 && echo "Docker started!" && break
       echo "Waiting for Docker... ($i/30)"
       sleep 2
   done
   ```

3. Stop any conflicting containers (prevent port 3000 conflicts)
   // turbo
   ```bash
   docker stop qbideas-api >/dev/null 2>&1 || true
   ```

4. Start infrastructure services only (avoiding api-service in Docker)
   // turbo
   ```bash
   docker-compose up -d postgres redis minio mailhog
   ```

5. Run the start script to launch API and Frontend locally
   ```bash
   ./start-all-services.sh
   ```
