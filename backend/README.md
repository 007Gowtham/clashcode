# CodeArena Authentication Service

See the main [README.md](../README.md) in the project root for full documentation, environment variable specifications, and Docker commands.

### Quick Start
```bash
# Start Postgres & Redis
docker compose up -d

# Run tests
mvn test

# Start service
java -jar target/auth-1.0.0-SNAPSHOT.jar
```

