#!/bin/bash
set -e

# Configuration
IMAGE_NAME="ghcr.io/your-github-username/your-repo-name:latest" # <-- IMPORTANT: Replace with your GitHub username and repo name
CONTAINER_NAME="pawlie-backend"
NETWORK_NAME="pawlie-network"

# --- Deployment ---

echo "Starting deployment..."

# 1. Login to GitHub Container Registry
#    You should run `docker login ghcr.io -u YOUR_GITHUB_USERNAME` manually once before running this script.
#    The script assumes you are already logged in.

# 2. Pull the latest image
echo "Pulling latest Docker image..."
docker pull $IMAGE_NAME

# 3. Stop and remove the old container if it exists
if [ $(docker ps -a -q -f name=^/${CONTAINER_NAME}$) ]; then
    echo "Stopping and removing old container..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# 4. Create network if it doesn't exist
if ! docker network ls | grep -q $NETWORK_NAME; then
    echo "Creating Docker network: $NETWORK_NAME"
    docker network create $NETWORK_NAME
fi

# 5. Run the new container
echo "Running new container..."
docker run -d \
    --name $CONTAINER_NAME \
    --network $NETWORK_NAME \
    --restart always \
    -p 3000:3000 \
    --env-file .env \
    $IMAGE_NAME

echo "Deployment finished successfully!"
