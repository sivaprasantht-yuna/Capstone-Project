# ==========================================
# STAGE 1: Build the Java Spring Boot JAR
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /backend-build

# Copy only the backend folder
COPY backend/pom.xml .
# Pre-download all Maven dependencies as a separate cached layer
RUN mvn dependency:go-offline -q
COPY backend/src ./src

# Compile the JAR
RUN mvn clean package -DskipTests

# ==========================================
# STAGE 2: Final Production Container
# ==========================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy the compiled JAR from Stage 1
COPY --from=build /backend-build/target/*.jar ./app.jar

# Expose the mandatory Hugging Face port
EXPOSE 7860

# Boot the Java application
ENTRYPOINT ["java", "-Dserver.port=7860", "-jar", "app.jar"]
