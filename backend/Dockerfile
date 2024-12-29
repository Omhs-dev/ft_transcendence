FROM python:3.10

# Install PostgreSQL client libraries
RUN apt-get update && apt-get install -y libpq-dev gcc
# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
# Set working directory inside the container
WORKDIR /app
# Copy the requirements file into the container
COPY requirements.txt /app/
# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt
# Copy the project files into the container
COPY . /app/
# Expose the port on which Django will run
EXPOSE 8000
ENTRYPOINT [ "sh", "execute_django.sh" ]