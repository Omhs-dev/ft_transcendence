# Use the official Nginx image
FROM nginx:latest


# # Install OpenSSL for generating the self-signed certificate
# RUN apt-get update && apt-get install -y openssl

# # Create a directory for the SSL certificates
# RUN mkdir -p /etc/nginx/ssl

# # Generate a self-signed SSL certificate
# RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/ping_pong.com.key -out /etc/nginx/ssl/transcendence.com.crt -subj "/C=DE/ST=Heilbronn/L=Heilbronn/O=Organization/OU=Department/CN=ping_pong.com"

# Copy the Nginx configuration file
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend static files (HTML, CSS, JS)
COPY ./frontend/ /usr/share/nginx/html/

# Expose port 80
EXPOSE 80 443

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
