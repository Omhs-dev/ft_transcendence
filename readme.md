# Full‑Stack Django Application with Docker, Nginx, ELK & Grafana

This repository contains a full‑stack web application with:

- **Backend**: Django (multiple apps: auth, chat, game)
- **Frontend**: Static HTML/CSS/JS frontend
- **Infrastructure**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Logging Stack**: Elasticsearch, Logstash, Kibana (ELK)
- **Monitoring**: Prometheus & Grafana
- **Automation**: Makefile & shell scripts

---

## Table of Contents

1. Architecture Overview  
2. Project Structure  
3. Prerequisites  
4. Configuration  
5. Running the Project  
6. Backend (Django)  
7. Frontend  
8. Nginx  
9. Logging (ELK Stack)  
10. Monitoring (Grafana & Prometheus)  
11. Development Workflow  
12. Testing  
13. Deployment Notes  
14. Troubleshooting  
15. License

---

## Architecture Overview

High‑level diagram (conceptual):

- **Client** (Browser)
  - Serves static assets from `frontend/`
  - Communicates with Django backend over HTTP/HTTPS
- **Nginx**
  - Reverse proxy in front of Django and static frontend
  - Handles SSL termination (if configured)
- **Django Backend**
  - Project in `backend/Django_backend_project/`
  - Apps:
    - `auth_app/`
    - `chat_app/`
    - `game_app/`
  - Media & static handling via `/media` and `/static`
- **ELK Stack**
  - Collects, stores, and visualizes logs
- **Prometheus & Grafana**
  - Scrapes metrics and exposes dashboards for monitoring

All services are orchestrated via `docker-compose.yml` and auxiliary Dockerfiles in subdirectories.

---

## Project Structure

Top‑level:

- `.env` – Environment variables for Docker/Django (secrets, DB config, etc.).
- `.gitignore` – Git ignore rules.
- `docker-compose.yml` – Main Docker Compose definition for the stack.
- `Makefile` – Common commands for building/running the stack.
- `readme.md` – Project documentation (this file).
- `script/`
  - `init_docker.sh` – Helper script to initialize Docker environment (build/pull/run, etc.).
- `nginx/`
  - `Dockerfile` – Nginx container image.
  - `conf/` – Nginx configuration files (virtual hosts, upstreams, SSL, etc.).
- `ELK/`
  - `elasticsearch/` – Elasticsearch configuration/data bootstrap.
  - `kibana/` – Kibana configuration.
  - `logstash/` – Logstash pipelines and config.
  - `setup/` – Additional scripts/config files for provisioning ELK.
- `grafana/`
  - `Dockerfile` – Grafana image configuration.
  - `grafana.ini` – Grafana server configuration.
  - `prometheus.yml` – Prometheus scrape configuration.
  - `provisioning/` – Datasources, dashboards, and alerting config.
- `frontend/`
  - `assets/` – Images, fonts, etc.
  - `css/` – Stylesheets.
  - `javascript/` – Client‑side JS.
  - `pages/` – Partial pages/templates (if used).
  - `sidebars/` – Sidebar partials (if used).
  - `index.html`, `index1.html` – Main HTML entry points.
  - `docker compose.yml` – Optional separate compose for frontend‑only running.
  - `tasks.txt` – Notes/todos for frontend development.
- `backend/`
  - `Django_backend_project/`
    - `auth_app/` – Authentication & user management.
    - `chat_app/` – Chat‑related features.
    - `game_app/` – Game logic and APIs.
    - `media/` – Uploaded media files.
    - `static/` – Collected static files (if not using external volume).
    - `settings/` – Django settings modules (e.g. dev/prod).
    - `manage.py` – Django management script.
    - `...` – Additional Django modules/apps.
  - `Django_Docker_files/` – Docker configuration for Django backend (Dockerfile, entrypoint, etc.).
  - `staticfiles/` – Collected static files when running `collectstatic`.
  - `test.py` – Standalone test script or small harness for backend.

---

## Prerequisites

- **Operating System**
  - Linux, macOS, or Windows (with WSL2 recommended).
- **Required Tools**
  - [Docker](https://docs.docker.com/get-docker/) (latest stable)
  - [Docker Compose](https://docs.docker.com/compose/) (v2+ or integrated in Docker)
  - `make` (for using the Makefile; optional but recommended)
  - Python 3.10+ (if running Django outside Docker)

---

## Configuration

### Environment Variables

The `.env` file at the project root configures environment variables for Docker and Django.

Common values to define (example):

```bash
# Django
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
POSTGRES_DB=app_db
POSTGRES_USER=app_user
POSTGRES_PASSWORD=change-me
POSTGRES_HOST=db
POSTGRES_PORT=5432

# ELK
ELASTICSEARCH_HOST=elasticsearch
ELASTICSEARCH_PORT=9200

# Prometheus / Grafana (if needed)
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=change-me
```

> Never commit real secrets to version control. Keep `.env` out of Git (it should already be in `.gitignore`).

### Django Settings

Django settings are organized under `backend/Django_backend_project/settings/`.  
Typical modules:

- `base.py` – Base shared settings.
- `dev.py` – Development overrides.
- `prod.py` – Production overrides.

Update:

- `DATABASES`
- `CACHES`
- `LOGGING`
- `ALLOWED_HOSTS`
- `STATIC_ROOT`, `MEDIA_ROOT`

as appropriate for your environment.

### Nginx

Nginx configuration lives in `nginx/conf/` and is used by the Nginx Dockerfile in `nginx/Dockerfile`.  
You’ll typically have:

- A server block for HTTP/HTTPS
- Upstream definitions pointing to Django backend container
- Static/media routing

---

## Running the Project

### 1. Clone & Setup

```bash
git clone <your-repo-url>.git
cd <your-repo-directory>
cp .env.example .env   # if you maintain an example file
# then edit .env with real values
```

### 2. Start with Docker Compose

From the project root:

```bash
docker compose up --build
# or if you still use docker-compose CLI
docker-compose up --build
```

This should:

- Build backend, frontend, nginx, ELK, and Grafana images
- Start all containers and networks

To run in detached mode:

```bash
docker compose up -d
```

### 3. Using the Makefile (optional)

Run `make` commands from the project root.

Common targets (change names to match your actual Makefile):

```bash
make build       # Build all Docker images
make up          # docker compose up -d
make down        # docker compose down
make logs        # Tail logs from all containers
make migrate     # Run Django migrations inside the backend container
make collectstatic
```

Check your `Makefile` for the exact targets you have.

### 4. Helper Script

The script `script/init_docker.sh` automates some initialization steps. From project root:

```bash
chmod +x script/init_docker.sh
./script/init_docker.sh
```

Review the script before running to see what it does (builds, migrations, superuser, etc.).

---

## Backend (Django)

### Location

Backend code lives under:

- `backend/Django_backend_project/`

Key directories:

- `auth_app/` – Authentication, user registration, login, permissions, etc.
- `chat_app/` – Chat endpoints, WebSocket configuration (if used), message models.
- `game_app/` – Game state, rules, and related APIs.
- `media/` – Uploaded user content.
- `static/` – Static files.
- `settings/` – Django settings modules.
- `manage.py` – Entrypoint for Django commands.

### Common Commands (inside backend container)

To open a shell inside the running backend container (example container name: `backend`):

```bash
docker compose exec backend bash
```

Then:

```bash
python manage.py migrate          # Apply migrations
python manage.py createsuperuser  # Create admin user
python manage.py collectstatic    # Collect static files
python manage.py shell            # Django shell
```

If running directly on your host (not recommended for production):

```bash
cd backend/Django_backend_project
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

---

## Frontend

### Location

Frontend assets live in:

- `frontend/`
  - `index.html`, `index1.html`
  - `css/`
  - `javascript/`
  - `assets/`
  - `pages/`
  - `sidebars/`

### Running Frontend

Depending on your setup, frontend may be:

- Served directly by Nginx from the `frontend/` directory (volume‑mounted into the Nginx container).
- Or built into a static folder and copied into an Nginx image at build time.

Some setups also have a separate `frontend/docker compose.yml` to run the frontend as a standalone service for development:

```bash
cd frontend
docker compose up --build
```

Check that file to see how the frontend is intended to run.

---

## Nginx

### Location

- Dockerfile: `nginx/Dockerfile`
- Config: `nginx/conf/`

Nginx acts as:

- Reverse proxy to the Django backend (e.g. `proxy_pass http://backend:8000;`)
- Static file server for assets in `frontend/` or collected `staticfiles/`
- Optional TLS terminator (configure certificates in `conf/` or via volume mounts)

Modify the `server {}` blocks in `nginx/conf/` to adjust:

- Domain names
- SSL settings
- Path routing (e.g. `/api/` to Django, `/` to frontend)

---

## Logging (ELK Stack)

### Location

- `ELK/elasticsearch/`
- `ELK/kibana/`
- `ELK/logstash/`
- `ELK/setup/`

### Purpose

ELK provides centralized logging:

- **Elasticsearch** – Stores log data.
- **Logstash** – Ingests logs from containers, files, or other sources.
- **Kibana** – UI for querying & visualizing logs.

### Integration

Typical patterns:

- Docker containers log to stdout -> Docker logging driver -> Logstash / Filebeat -> Elasticsearch.
- Django logging config (`LOGGING` in settings) sends logs to a file or directly to Logstash.

Once running:

- Kibana is usually accessible at `http://localhost:<kibana-port>` (e.g. 5601).
- Configure index patterns and dashboards as needed.

---

## Monitoring (Grafana & Prometheus)

### Location

- `grafana/Dockerfile`
- `grafana/grafana.ini`
- `grafana/prometheus.yml`
- `grafana/provisioning/`

### Purpose

- **Prometheus** – Scrapes metrics (from Django, Nginx, system, etc.).
- **Grafana** – Visualizes metrics using dashboards.

### Integration

- Prometheus endpoints:
  - Django metrics via a library (e.g. `django-prometheus`) exposing `/metrics`.
  - Nginx metrics via an exporter or stub status.
- `prometheus.yml` defines jobs to scrape these endpoints.
- `provisioning/` sets up:
  - Data sources (Prometheus)
  - Dashboards (preconfigured views)

Grafana is typically available at `http://localhost:<grafana-port>` (e.g. 3000).  
Default credentials are set in `.env` or `grafana.ini`.

---

## Development Workflow

1. **Modify Code**
   - Backend: edit files under `backend/Django_backend_project/`.
   - Frontend: edit files under `frontend/`.

2. **Hot Reloading**
   - If Django `DEBUG=True` and using a development server inside Docker, code changes trigger autoreload.
   - For frontend, static assets are served directly; reload the browser.

3. **Database Migrations**
   - Define models in your apps (`auth_app`, `chat_app`, `game_app`).
   - Create migrations:
     ```bash
     docker compose exec backend python manage.py makemigrations
     docker compose exec backend python manage.py migrate
     ```

4. **Static Files**
   - When changing static files (for production), run:
     ```bash
     docker compose exec backend python manage.py collectstatic --noinput
     ```

5. **Logging & Monitoring**
   - Use Kibana to check logs.
   - Use Grafana to monitor performance and health.

---

## Testing

### Django Tests

Run unit tests inside the backend container:

```bash
docker compose exec backend python manage.py test
```

Or use the standalone script if `backend/test.py` is a specific test harness:

```bash
docker compose exec backend python backend/test.py
```

(Adjust path as needed based on the actual location.)

### Frontend Tests

If you have JS tests or linting:

```bash
cd frontend
# e.g., npm test, npm run lint, etc.
```

Add details here depending on your actual JS tooling.

---

## Deployment Notes

- **Production Settings**
  - Use `DJANGO_DEBUG=False` and appropriate `ALLOWED_HOSTS`.
  - Use a robust database (PostgreSQL) rather than SQLite.
  - Configure proper SSL termination in Nginx.
- **Scaling**
  - Use Docker Compose profiles or Kubernetes for scaling services.
  - Ensure static & media are served from a shared location (volume or object storage).
- **Backups**
  - Database backups (cron jobs or external tools).
  - Elasticsearch index snapshots (if logs are critical).

---

## Troubleshooting

**Containers won’t start**

- Check logs:
  ```bash
  docker compose logs backend
  docker compose logs nginx
  docker compose logs elasticsearch
  ```
- Verify `.env` values and that ports aren’t in use.

**Django 500 errors**

- Check backend logs via:
  ```bash
  docker compose logs backend
  ```
- Also inspect Kibana for detailed stack traces if logs are being forwarded.

**Static files not loading**

- Confirm `collectstatic` ran successfully.
- Ensure Nginx `location /static` and `location /media` match your volume paths.

**ELK or Grafana inaccessible**

- Confirm the services are up:
  ```bash
  docker compose ps
  ```
- Check port mappings in `docker-compose.yml`.
- Check service logs via `docker compose logs <service-name>`.
