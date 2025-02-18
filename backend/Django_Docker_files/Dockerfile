FROM python:3.10

# Set working directory inside the container
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc netcat-traditional redis-tools iputils-ping net-tools vim\
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the project files into the container
COPY .. /app/
# Expose the port on which Django will run
EXPOSE 8000
ENTRYPOINT [ "sh", "Django_Docker_files/execute_django.sh" ]