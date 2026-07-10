# Use Debian-based Node.js image to ensure compatibility with Typesense binary
FROM node:20

# Set working directory
WORKDIR /app

# Install curl and tar to download and extract Typesense
RUN apt-get update && apt-get install -y curl tar && rm -rf /var/lib/apt/lists/*

# Download and extract Typesense 0.25.1 binary
RUN curl -O https://dl.typesense.org/releases/0.25.1/typesense-server-0.25.1-linux-amd64.tar.gz \
    && tar -xzf typesense-server-0.25.1-linux-amd64.tar.gz \
    && rm typesense-server-0.25.1-linux-amd64.tar.gz

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Ensure start.sh has executable permissions
RUN chmod +x start.sh

# Expose backend port
EXPOSE 4000

# Run the startup script that starts both Typesense and Node.js backend
CMD ["./start.sh"]
