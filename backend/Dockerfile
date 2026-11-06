# Stage 1: Build executable JAR
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

COPY pom.xml ./
# Cache dependencies
RUN mvn dependency:go-offline -B || true

COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Production JRE 21 Runtime
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup --system --gid 1001 clashcode && \
    adduser --system --uid 1001 -G clashcode clashcode

COPY --from=builder /build/target/clashcode-backend-1.0.0.jar ./app.jar
RUN chown -R clashcode:clashcode /app

USER clashcode

EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

