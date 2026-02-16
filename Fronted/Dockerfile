FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend files
COPY . /usr/share/nginx/html

# Remove unnecessary files from the served directory
RUN rm -f /usr/share/nginx/html/Dockerfile \
    /usr/share/nginx/html/captain-definition \
    /usr/share/nginx/html/nginx.conf \
    /usr/share/nginx/html/.dockerignore

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
