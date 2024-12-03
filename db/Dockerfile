# Use the official MySQL image
FROM mysql:8.0

# Set the environment variable for the root password
ENV MYSQL_ROOT_PASSWORD=rootpassword

# Copy the init.sql script into the container
COPY init.sql /docker-entrypoint-initdb.d/

# Expose the MySQL port
EXPOSE 3306
