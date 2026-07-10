#!/bin/sh

# Ensure Typesense data directory exists
mkdir -p /app/typesense-data

# Start Typesense in the background
echo "Starting Typesense server..."
/app/typesense-server --data-dir=/app/typesense-data --api-key=${TYPESENSE_API_KEY:-xyz123} --enable-cors &

# Give Typesense a moment to initialize
sleep 2

# Index database data into Typesense search automatically on startup
echo "Indexing database data into Typesense search..."
npm run index-search

# Start the Node.js Express server in the foreground
echo "Starting Node.js Express server..."
exec npm start

