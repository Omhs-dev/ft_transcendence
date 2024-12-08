# Use the official Nginx image
FROM nginx:latest

# Copy the Nginx configuration file
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend static files (HTML, CSS, JS)
COPY ./frontend/ /usr/share/nginx/html/

# Expose port 80
EXPOSE 80
