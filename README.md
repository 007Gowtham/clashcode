# ClashCode - Real-Time Multiplayer Competitive Coding Platform

A high-performance real-time competitive coding platform built with **Next.js 16 (App Router & Turbopack)**, **Java 21**, **Spring Boot 3.3.5**, **PostgreSQL**, **Redis**, and **Docker**.

---

## Architecture & Package Structure

The module is strictly encapsulated under `com.codearena.auth` with zero external domain dependencies (other platform modules like rooms and teams reference users strictly by `userId`):

```text
com.codearena.auth/
├── AuthApplication.java                  # Spring Boot Main Application
├── controller/
│   └── AuthController.java               # REST Endpoints (/api/auth/*)
├── dto/
│   ├── RegisterRequest.java              # Registration validation DTO
│   ├── LoginRequest.java                 # Login DTO (username or email)
│   ├── LoginResult.java                  # Internal login result
│   ├── UserResponse.java                 # Public user response (no password)
│   ├── MessageResponse.java              # Simple acknowledgment message
│   └── ErrorResponse.java                # RFC-compliant error format
├── entity/
│   └── User.java                         # User JPA Entity (UUID, unique username/email)
├── repository/
│   └── UserRepository.java               # Spring Data JPA Repository
├── security/
│   ├── CookieService.java                # HttpOnly, SameSite=Lax cookie manager
│   ├── JwtAuthenticationFilter.java      # OncePerRequestFilter reading access_token
│   ├── JwtProperties.java                # JWT configuration properties
│   ├── JwtService.java                   # Token issuance & validation with JJWT (HS256)
│   ├── NoOpTokenStorageService.java      # Default stateless token storage
│   ├── RestAuthenticationEntryPoint.java # 401 JSON handler for unauthorized access
│   ├── SecurityConfig.java               # Stateless Spring Security filter chain & CORS
│   ├── TokenStorageService.java          # Extension interface for token storage / Redis
│   └── UserPrincipal.java                # Spring Security UserDetails implementation
├── service/
│   └── AuthService.java                  # Core authentication & business logic with metrics
└── exception/
    ├── DuplicateResourceException.java   # 409 Conflict
    ├── InvalidCredentialsException.java  # 401 Unauthorized
    ├── PasswordMismatchException.java    # 400 Bad Request
    ├── ResourceNotFoundException.java    # 404 Not Found
    └── GlobalExceptionHandler.java       # Global RestControllerAdvice
```

---

## Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `SERVER_PORT` | `8080` | Port on which the Spring Boot server runs |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `codearena_auth` | Database name |
| `DB_USERNAME` | `codearena` | PostgreSQL username |
| `DB_PASSWORD` | `codearena_secret` | PostgreSQL password |
| `JWT_SECRET` | *(Generated Dev Secret)* | Secret key for HS256 JWT signing (**min 32 characters**) |
| `JWT_EXPIRATION_MS` | `3600000` | JWT expiration time in milliseconds (1 hour) |
| `JWT_COOKIE_NAME` | `access_token` | Name of the authentication cookie |
| `JWT_COOKIE_SECURE` | `false` | Set to `true` in production to enforce HTTPS-only cookies |
| `JWT_COOKIE_SAME_SITE`| `Lax` | SameSite cookie policy |
| `CORS_ALLOWED_ORIGINS`| `http://localhost:3000` | Allowed origins (Next.js frontend) |

---

## Running with Docker (PostgreSQL & Redis)

Start the backing PostgreSQL and Redis instances:

```bash
docker compose up -d
```

Verify containers are running:
```bash
docker compose ps
```

---

## Building and Running the Backend

### 1. Run Tests
```bash
cd backend
mvn test
```

### 2. Package Jar
```bash
mvn clean package -DskipTests
```

### 3. Run the Application
```bash
# With default local environment
java -jar target/auth-1.0.0-SNAPSHOT.jar

# Or with custom environment variables
JWT_SECRET="your-ultra-secure-secret-key-at-least-32-chars-long" \
DB_HOST="localhost" \
DB_PORT="5432" \
DB_NAME="codearena_auth" \
DB_USERNAME="codearena" \
DB_PASSWORD="codearena_secret" \
java -jar target/auth-1.0.0-SNAPSHOT.jar
```

---

## API Endpoints

### 1. Register User
- **`POST /api/auth/register`**
- **Public endpoint**
- Validates field constraints, checks password confirmation, lowercases email, checks uniqueness, and saves BCrypt hashed password.
- **Request:**
  ```json
  {
    "username": "alice_dsa",
    "email": "Alice@Example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "id": "e69e7378-f6fa-419e-9c58-cacb80614091",
    "username": "alice_dsa",
    "email": "alice@example.com",
    "createdAt": "2026-11-05T15:28:59Z"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure or password mismatch.
  - `409 Conflict`: Duplicate username or email.

### 2. Login User
- **`POST /api/auth/login`**
- **Public endpoint**
- Accepts `identifier` (username or email). Case-insensitive for email lookup.
- On success, creates a signed HS256 JWT and sets it in an `HttpOnly`, `SameSite=Lax` cookie named `access_token`.
- Returns basic user info in body (**the token is NEVER in the response body**).
- **Request:**
  ```json
  {
    "identifier": "alice@example.com",
    "password": "Password123"
  }
  ```
- **Response `200 OK`:**
  - **Headers**: `Set-Cookie: access_token=eyJ...; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax`
  - **Body**:
    ```json
    {
      "id": "e69e7378-f6fa-419e-9c58-cacb80614091",
      "username": "alice_dsa",
      "email": "alice@example.com",
      "createdAt": "2026-11-05T15:28:59Z"
    }
    ```
- **Error Response:**
  - `401 Unauthorized`: Returns identical message `"Invalid credentials"` for unknown user or wrong password.

### 3. Logout User
- **`POST /api/auth/logout`**
- Clears the `access_token` cookie by setting `Max-Age=0`.
- **Response `200 OK`:**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

### 4. Current User (Protected)
- **`GET /api/auth/me`**
- Requires `access_token` cookie.
- Returns current authenticated user profile (`id`, `username`, `email`).
- Returns `401 Unauthorized` JSON if unauthenticated.

---

## Observability & Prometheus Metrics

- **Health Probe:** `GET /actuator/health`
- **Prometheus Metrics:** `GET /actuator/prometheus`

### Custom Counters Tracked:
- `auth.register.success`
- `auth.register.failure`
- `auth.login.success`
- `auth.login.failure`

---

## Security Highlights

1. **Stateless Authentication**: Sessions are `STATELESS` with no server-side HTTP session storage.
2. **HttpOnly Cookie**: JWT is stored exclusively in an `HttpOnly`, `SameSite=Lax` cookie (`access_token`) to prevent XSS credential exfiltration.
3. **CSRF Strategy**: Relies on modern browser `SameSite=Lax` enforcement for the MVP.
4. **CORS**: Configured with credentials enabled (`allowCredentials: true`) to support Next.js frontend origin.
5. **Clean Extension Points**: Includes `TokenStorageService` interface ready for Redis-based token revocation / blacklisting and session management in subsequent phases.

