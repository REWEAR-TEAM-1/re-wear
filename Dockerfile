FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /workspace
COPY backend/pom.xml backend/pom.xml
RUN mvn -B -f backend/pom.xml dependency:go-offline
COPY backend/src backend/src
RUN mvn -B -f backend/pom.xml clean package -DskipTests

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /workspace/backend/target/rewear-api-0.1.0.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
