# Deployment Methods

This document outlines two different methods for deploying this application to a production server:

1.  **Docker-based Deployment (Recommended)**
2.  **PM2-based Deployment**

---

## 1. Docker-based Deployment

This is the recommended method and the one that is currently implemented in this repository's CI/CD pipeline (`.github/workflows/deploy.yml`).

### How it Works

The application is packaged into a self-contained Docker image. This image includes the application code, all necessary dependencies, and the Node.js runtime. The CI/CD pipeline automatically builds this image, pushes it to a container registry, and then deploys it to the server. The `deploy.sh` script on the server pulls the latest image and runs it as a container.

### Pros

*   **Consistency:** The application runs in the same environment on your local machine, the CI/CD server, and the production server. This eliminates "it works on my machine" problems.
*   **Isolation:** The application and its dependencies are isolated from the host system, preventing conflicts with other applications.
*   **Scalability:** It's easy to scale the application by running multiple instances of the container.
*   **Portability:** The Docker image can be run on any system that has Docker installed.
*   **Automatic Restarts:** The `--restart always` flag in the `docker run` command ensures that the application automatically restarts if it crashes or if the server reboots.

### Cons

*   **Learning Curve:** Docker has a slight learning curve if you're not familiar with it.
*   **Resource Usage:** Docker adds a small amount of overhead in terms of CPU and memory usage.

---

## 2. PM2-based Deployment

This is a more traditional method of deploying Node.js applications. It involves copying the application source code to the server and using a process manager like [PM2](https://pm2.keymetrics.io/) to run and manage the application.

### How it Would Work

A CI/CD pipeline for this method would look like this:

1.  **Install Dependencies:** Run `npm install` on the CI/CD server.
2.  **Build the Application:** Run `npm run build` to compile the TypeScript code to JavaScript.
3.  **Copy Files to Server:** Copy the `dist` directory, `node_modules`, and `package.json` to your VM using `scp` or `rsync`.
4.  **Run with PM2:** SSH into the server and use PM2 commands to start or restart the application.

### PM2 Commands

```bash
# To start the application for the first time
pm2 start dist/main.js --name pawlie-backend

# To restart the application after deploying new code
pm2 restart pawlie-backend

# To view logs
pm2 logs pawlie-backend

# To set up a startup script (so it restarts on server reboot)
pm2 startup
```

### Pros

*   **Simplicity:** For simple applications, this method can be easier to set up and understand than Docker.
*   **Direct Access:** You have direct access to the application files on the server.

### Cons

*   **Environment Drift:** The production environment on your VM might be different from your local development environment, leading to unexpected issues.
*   **Dependency Management:** You need to ensure that the correct version of Node.js and other system dependencies are installed on the server.
*   **Manual Steps:** This method often involves more manual steps, although they can be scripted.
*   **Scalability:** Scaling the application to run on multiple cores or multiple machines is more complex than with Docker.

---

For this project, the Docker-based approach is recommended as it provides a more robust and scalable deployment solution.
