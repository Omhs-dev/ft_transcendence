# docker/database.yml
version: '3.8'
services:
  postgres:
    container_name: postgres_container
    image: postgres:latest
    environment:
      env_file: ./.env 
    Ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
volumes:
  db_data:
