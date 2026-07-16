# ─── Stage 1: Build with Maven (Backend) ───────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS backend-builder
WORKDIR /app
COPY backend/pom.xml .
RUN mvn dependency:go-offline -q
COPY backend/src ./src
RUN mvn package -DskipTests -q

# ─── Stage 2: Final Image (Python + Java + Supervisor) ─────────────────────────
FROM python:3.11-slim

# Install Java and Supervisor
RUN apt-get update && apt-get install -y \
    openjdk-21-jre-headless \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Setup Python Matching Service
COPY matching-service/requirements.txt ./matching-service/
RUN pip install --no-cache-dir -r matching-service/requirements.txt
COPY matching-service/ ./matching-service/

# Copy Backend JAR
COPY --from=backend-builder /app/target/*.jar ./app.jar

# Copy Supervisor configuration
COPY hf-deploy/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port for Hugging Face (7860)
EXPOSE 7860

# Run supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
