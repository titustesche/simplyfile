# Simplyfile Roadmap

This document describes the planned evolution of Simplyfile from a minimal anonymous
upload/download service into a multi-user file sharing platform.

**Current state (v1.0-SNAPSHOT)**

- `POST /file/upload` – anonymous upload, returns `FileDTO`
- `GET /file/{id}/download` – anonymous download by UUID
- Entities: `FileModel` (`id`, `name`, `sha256`, `path`, `type`, `size`)
- Stack: Spring Boot 4.1, Spring Data JPA, PostgreSQL, local filesystem storage
- No authentication, no ownership, no frontend

Phases build on each other and are meant to be shipped in order. Each phase should end
with a deployable, tested state (`mvn test` green, CI/CD workflow uploading the JAR).

---

## Phase 0 – Hardening & Foundations

Prerequisites that later phases depend on. Mostly follows the findings of the security review.

- [ ] Add `spring-boot-starter-security` (stateless, CSRF disabled for the API)
- [ ] Introduce Flyway (`spring.jpa.hibernate.ddl-auto=validate`), create `V1__baseline.sql`
      from the current `files` table
- [ ] Global `@RestControllerAdvice` mapping exceptions to proper HTTP status codes
      (`400` empty file, `404` file not found, `413` too large, `500` generic)
- [ ] Compute real SHA-256 on upload (replace the `"TODO"` placeholder)
- [ ] Sanitize `originalFilename`, use `ContentDisposition.attachment().filename(...)`
- [ ] Path-traversal guard in `LocalStorageService.load()`
- [ ] Remove `path` from `FileDTO`; add `sha256`, `type`, `createdAt`
- [ ] Reduce multipart limits, add `storage.max-total-bytes` cap
- [ ] Externalize credentials (`${DB_PASSWORD}` without default, `.env.example`), bump
      `postgres` image and `postgresql` driver, run container as non-root
- [ ] Add `created_at` / `updated_at` columns to `files`

**Done when:** all endpoints return correct status codes, `sha256` is populated, and the
app refuses to start without configured secrets.

---

## Phase 1 – User Accounts

Users are the owners of files and the issuers of tokens.

### Data model

```
users
  id            uuid pk
  username      varchar unique
  email         varchar unique
  password_hash varchar            -- BCrypt / Argon2
  role          varchar            -- USER | ADMIN
  enabled       boolean
  created_at    timestamptz

files
  + owner_id    uuid fk -> users.id (nullable during migration, NOT NULL afterwards)
```

### API

| Method | Path                   | Auth        | Description                            |
|--------|------------------------|-------------|----------------------------------------|
| POST   | `/auth/register`       | none        | Create account (can be disabled via config, admin-only invite mode) |
| POST   | `/auth/login`          | none        | Returns a session JWT (short-lived, e.g. 15 min) + refresh token |
| POST   | `/auth/refresh`        | refresh     | Rotate refresh token, issue new JWT    |
| POST   | `/auth/logout`         | JWT         | Revoke refresh token                   |
| GET    | `/users/me`            | JWT         | Current user profile                   |
| PATCH  | `/users/me`            | JWT         | Change email / password                |
| GET    | `/files`               | JWT         | List own files (paginated)             |
| DELETE | `/file/{id}`           | JWT (owner) | Delete file + storage object           |

`POST /file/upload` now **requires authentication** and sets `owner_id`.
`GET /file/{id}/download` stays public for now (capability URL) – visibility rules
come in Phase 3.

### Implementation notes

- Spring Security `SecurityFilterChain` with a JWT filter; passwords hashed with
  `BCryptPasswordEncoder` (strength ≥ 12) or Argon2
- `UserRepository`, `UserService`, `AuthController`, `UserController`
- Migration `V2__users.sql`; existing files are assigned to a bootstrap admin user
- First admin created via env vars (`SIMPLYFILE_ADMIN_USERNAME` / `_PASSWORD`) on
  first start if no user exists
- Rate limit `/auth/login` and `/auth/register` (Bucket4j, per IP)
- Tests: `AuthControllerTest`, `UserServiceTest`, upload-without-auth returns `401`

**Done when:** a user can register, log in, upload a file that is attributed to them,
list and delete their own files, and cannot delete other users' files.

---

## Phase 2 – API Tokens for Automated Uploads

Users issue long-lived tokens that let scripts and CI pipelines upload **in the name
of that user**. This replaces the anonymous upload currently used by
`.github/workflows/ci-cd.yml`.

### Data model

```
api_tokens
  id           uuid pk
  user_id      uuid fk -> users.id
  name         varchar            -- "GitHub Actions", "backup script"
  token_hash   varchar unique     -- SHA-256 of the secret, plaintext never stored
  prefix       varchar(8)         -- first chars of the token for identification in UI
  scopes       varchar[]          -- upload, read, delete
  expires_at   timestamptz null
  last_used_at timestamptz null
  revoked_at   timestamptz null
  created_at   timestamptz
```

### API

| Method | Path                       | Auth | Description                                   |
|--------|----------------------------|------|-----------------------------------------------|
| POST   | `/users/me/tokens`         | JWT  | Create token; plaintext returned **once**      |
| GET    | `/users/me/tokens`         | JWT  | List tokens (prefix, name, scopes, last used) |
| DELETE | `/users/me/tokens/{id}`    | JWT  | Revoke                                        |

Token format: `sf_<base64url(32 random bytes)>` sent as `Authorization: Bearer sf_...`.

### Implementation notes

- `ApiTokenFilter` (`OncePerRequestFilter`) runs before the JWT filter: hashes the
  bearer token, looks it up, checks `revoked_at`/`expires_at`, populates the
  `SecurityContext` with the owning user and token scopes, updates `last_used_at`
- Scope enforcement via `@PreAuthorize("hasAuthority('SCOPE_upload')")`
- Audit log on every token-authenticated request: user, token id, client IP, file id
- Per-token rate limit and optional per-user storage quota (`users.quota_bytes`)
- Update `ci-cd.yml`: `-H "Authorization: Bearer $SIMPLYFILE_API_TOKEN"` from a GitHub
  secret; publish the JAR's SHA-256 in the Discord embed
- Optional stretch: accept GitHub Actions OIDC tokens as an alternative to static tokens
- Tests: token create/list/revoke, revoked token → `401`, missing scope → `403`

**Done when:** the CI workflow uploads with a token owned by a user, the upload shows up
in that user's file list, and revoking the token immediately breaks the pipeline upload.

---

## Phase 3 – File Sharing Between Users

Owners control who can access their files.

### Data model

```
files
  + visibility   varchar   -- PRIVATE | LINK | PUBLIC   (default PRIVATE)

file_shares
  id          uuid pk
  file_id     uuid fk -> files.id
  user_id     uuid fk -> users.id       -- grantee
  permission  varchar                   -- READ | MANAGE
  created_by  uuid fk -> users.id
  created_at  timestamptz
  unique (file_id, user_id)

share_links
  id          uuid pk
  file_id     uuid fk -> files.id
  token_hash  varchar unique
  expires_at  timestamptz null
  max_downloads int null
  download_count int default 0
  password_hash varchar null
  created_at  timestamptz
```

### Visibility rules

| Visibility | Who can download                                             |
|------------|--------------------------------------------------------------|
| `PRIVATE`  | owner and users in `file_shares`                             |
| `LINK`     | anyone with a valid, non-expired share link                  |
| `PUBLIC`   | anyone who knows the file UUID (current behaviour)           |

### API

| Method | Path                                 | Auth          | Description                          |
|--------|--------------------------------------|---------------|--------------------------------------|
| PATCH  | `/file/{id}`                         | owner         | Change `visibility`, rename          |
| GET    | `/file/{id}/shares`                  | owner/MANAGE  | List grantees                        |
| POST   | `/file/{id}/shares`                  | owner/MANAGE  | Share with user (`username`, `permission`) |
| DELETE | `/file/{id}/shares/{userId}`         | owner/MANAGE  | Revoke                               |
| POST   | `/file/{id}/links`                   | owner/MANAGE  | Create share link (expiry, max downloads, password) |
| DELETE | `/file/{id}/links/{linkId}`          | owner/MANAGE  | Revoke link                          |
| GET    | `/shared-with-me`                    | JWT           | Files other users shared with me     |
| GET    | `/s/{linkToken}`                     | none          | Download via share link              |

### Implementation notes

- Central `FileAccessService.canRead(user, file)` / `canManage(user, file)` used by
  controller and later by the frontend metadata endpoint
- Migration `V4__sharing.sql`; existing files get `visibility = PUBLIC` to preserve
  current links, new uploads default to `PRIVATE`
- Optional per-user notification (email) when a file is shared
- Tests: matrix of visibility × requester (owner, grantee, other user, anonymous)

**Done when:** a private file returns `403`/`404` for non-grantees, shared users see it
under `/shared-with-me`, and expiring/password-protected links work.

---

## Phase 4 – Frontend

A web UI served by the same deployment. First milestone is the public file page
(`example.com/file/{uuid}`), then the authenticated user area.

### 4.1 – File page (`/file/{uuid}`)

Shows metadata about the requested file and a download button:

- filename, size (human-readable), MIME type, SHA-256 (copyable), upload date
- owner (username), visibility badge, download count
- preview for safe types (images, text/markdown, PDF via `<iframe sandbox>`),
  otherwise a generic icon
- "Download" button → `/file/{uuid}/download`
- Respects access rules from Phase 3: private files show a login prompt / 404

Backend addition: `GET /api/file/{id}` returning `FileDetailsDTO` (metadata only,
no storage path). Add `download_count` to `files`, incremented on download.

### 4.2 – User area

- Login / register pages
- Dashboard: own files (table, sorting, search), drag-and-drop upload with progress
- File detail/manage view: rename, visibility, shares, share links
- Token management page: create (show secret once), list, revoke
- "Shared with me" view
- Account settings (email, password), storage usage indicator

### 4.3 – Admin area (optional)

- User list, enable/disable, quota per user
- Global storage stats, orphaned storage objects cleanup

### Technical decisions

- SPA (React + TypeScript + Vite, or SvelteKit) in `frontend/`, built via
  `frontend-maven-plugin` and copied into `src/main/resources/static` during `mvn package`
  so a single JAR remains the deployment artifact
- Routing: the API moves under `/api/**`; the SPA is served for all other paths.
  Keep `GET /file/{id}/download` at its current path for backwards compatibility
  (or add a redirect)
- Auth in the browser: JWT in memory + refresh token in `HttpOnly; Secure; SameSite=Strict`
  cookie; CSRF protection enabled for cookie-based endpoints
- OpenAPI via `springdoc-openapi` to generate the TypeScript client
- Security headers: CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options`
- CI: add `npm ci && npm test && npm run build`, run Playwright smoke test against
  the packaged JAR

**Done when:** opening `example.com/file/{uuid}` shows metadata and a working download
for a public file, and a logged-in user can manage files, shares and tokens without
using `curl`.

---

## Later / Backlog

- Retention policies: `expires_at` per file, scheduled cleanup job
- Resumable / chunked uploads (tus protocol) for large files
- Deduplication by SHA-256 (content-addressed storage)
- Alternative storage backends (S3-compatible) behind `StorageService`
- Virus scanning hook (ClamAV) before a file becomes downloadable
- Webhooks on upload (e.g. Discord notification directly from the service, replacing
  the CI step)
- Metrics and health endpoints (Actuator, Prometheus)
- Redis (already in `docker-compose.yaml` but unused): rate-limit buckets, refresh
  token store, download counters

---

## Milestone Overview

| Phase | Title                       | Key deliverable                                  |
|-------|-----------------------------|--------------------------------------------------|
| 0     | Hardening & Foundations     | Security baseline, Flyway, real SHA-256          |
| 1     | User Accounts               | Register/login, file ownership                   |
| 2     | API Tokens                  | Automated uploads in the name of a user, CI uses token |
| 3     | File Sharing                | Visibility, user shares, share links             |
| 4     | Frontend                    | `/file/{uuid}` page, dashboard, token UI         |
