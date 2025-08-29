# Pawlie - Pet Social Media Platform

Pawlie is a comprehensive pet social media platform built with NestJS that connects pet owners, professional service providers, and adoption organizations. The platform offers Instagram-like features specifically tailored for the pet community, including pet profiles, health records, breeding/adoption matching, and local service discovery.

## 🌟 Features

### Core Functionality
- **User Management**: Normal users (pet owners) and professional users (vets, shops, groomers)
- **Pet Profiles**: Create up to 3 free pet sub-profiles with detailed information
- **Social Features**: Posts, stories, reels with Instagram-like feed and explore pages
- **Health Records**: Comprehensive pet health tracking and family tree management
- **Matching System**: Tinder-like swipe interface for breeding/adoption
- **Service Discovery**: Interactive maps to find nearby vets, shops, and groomers
- **Reviews & Ratings**: Rate and review professional services
- **Community**: Pet groups, events, and lost pet alerts

### Monetization
- **Verified Accounts**: $10-20/month for enhanced visibility
- **Extra Pet Profiles**: $2/month per additional pet beyond 3 free
- **Professional Ads**: CPC advertising and featured listings
- **Gamification**: Badges and points system with redeemable rewards

### Admin Features
- **Content Moderation**: AI-assisted flagging with human review
- **User Management**: Handle reports, bans, and verification requests
- **Configuration**: Manage terms, pricing, and platform settings
- **Analytics**: Comprehensive admin dashboard with insights

## 🛠️ Technology Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM and PostGIS for geospatial queries
- **Caching**: Redis for performance optimization
- **Storage**: Oracle Cloud Object Storage (S3-compatible)
- **Authentication**: JWT with refresh token rotation
- **Payments**: PayHere integration
- **Content Moderation**: Google Cloud Vision API
- **Container**: Docker with multi-stage builds
- **Documentation**: Swagger/OpenAPI

## 🏗️ Architecture

Pawlie follows a monolithic architecture with modular design:

```
src/
├── common/          # Shared utilities, guards, decorators
├── database/        # Database configuration and migrations
├── modules/         # Feature modules
│   ├── auth/        # Authentication and authorization
│   ├── user/        # User management
│   ├── pet/         # Pet profiles and management
│   ├── post/        # Posts, likes, comments
│   ├── story/       # Stories and ephemeral content
│   ├── health/      # Health records and family trees
│   ├── match/       # Breeding/adoption matching
│   ├── map/         # Service discovery and maps
│   ├── review/      # Reviews and ratings
│   ├── feed/        # Personalized content feeds
│   ├── explore/     # Content discovery
│   ├── report/      # User reports and moderation
│   ├── admin/       # Administrative functions
│   ├── notification/ # Push notifications
│   ├── payment/     # PayHere integration
│   └── storage/     # File upload and management
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- Docker (optional)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/pawlie-backend.git
   cd pawlie-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start services with Docker**
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Run database migrations**
   ```bash
   npm run migration:run
   ```

6. **Start development server**
   ```bash
   npm run start:dev
   ```

The application will be available at:
- API: http://localhost:3000
- Documentation: http://localhost:3000/api/docs
- Database Admin: http://localhost:8080 (Adminer)

### Environment Variables

Create a `.env` file with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=pawlie
DATABASE_PASSWORD=your_password
DATABASE_NAME=pawlie_db

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Oracle Cloud Object Storage
OCI_ACCESS_KEY_ID=your_access_key
OCI_SECRET_ACCESS_KEY=your_secret_key
OCI_BUCKET_NAME=pawlie-media
OCI_REGION=us-ashburn-1
OCI_ENDPOINT=https://objectstorage.us-ashburn-1.oraclecloud.com

# PayHere Payments
PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_merchant_secret
PAYHERE_SANDBOX=true

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Content Moderation
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

## 🐳 CI/CD with GitHub Actions

This project is configured with a Continuous Integration and Continuous Deployment (CI/CD) pipeline using GitHub Actions.

### Continuous Integration (CI)

The CI pipeline is defined in `.github/workflows/ci.yml`. It automatically triggers on every push or pull request to the `main` branch and performs the following actions:
1.  **Installs Dependencies**: Sets up the Node.js environment and installs all required packages using `npm ci`.
2.  **Lints Code**: Checks the code for style and formatting issues using ESLint.
3.  **Runs Tests**: Executes the entire test suite with `npm test`.
4.  **Builds & Pushes Docker Image**: If all previous steps pass, it builds a Docker image of the application and pushes it to the GitHub Container Registry (`ghcr.io`).

This process ensures that code merged into the main branch is always tested and ready for deployment.

### Continuous Deployment (CD) on Oracle VM

Deployment to your Oracle Cloud VM is semi-automated using a deployment script.

#### 1. One-Time Server Setup

First, you need to set up your Oracle VM instance.

1.  **Connect to your VM:**
    ```bash
    ssh -i /path/to/your/oci_key user@<your-vm-ip>
    ```

2.  **Install Docker and Docker Compose:**
    ```bash
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    # Log out and log back in for the group changes to take effect
    ```

3.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-github-username/your-repo-name.git
    cd your-repo-name
    ```

4.  **Log in to GitHub Container Registry:**
    You need a GitHub Personal Access Token (PAT) with `read:packages` scope.
    ```bash
    export CR_PAT=YOUR_GITHUB_PAT
    echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
    ```
    This command securely logs you in without saving the PAT in your shell history.

5.  **Create Environment File:**
    Create a `.env` file in the root of the cloned repository and fill it with your production environment variables (database credentials, JWT secrets, etc.). Refer to the `.env.example` file for the required variables.
    ```bash
    cp .env.example .env
    nano .env # Or your favorite editor
    ```

#### 2. Deploying the Application

Whenever you want to deploy the latest version of the application from the `main` branch, simply run the deployment script:

```bash
bash deploy.sh
```

The script will:
1.  Pull the latest Docker image from GitHub Container Registry.
2.  Stop and remove the currently running application container.
3.  Start a new container with the updated image.

For fully automated deployment, you can set up a cron job to run the `deploy.sh` script at regular intervals.

## 🌐 Oracle Cloud Free Tier Deployment

The section above describes the recommended CI/CD deployment method. The following notes are for setting up the surrounding infrastructure on Oracle Cloud.

### Infrastructure Setup

1.  **Create Oracle Cloud Account**
    -   Sign up at https://cloud.oracle.com
    -   Navigate to the Free Tier resources

2.  **Provision Resources**
    -   **Virtual Machine**: The free tier offers generous Ampere A1 Compute instances (ARM) which are perfect for running this application.
    -   **Autonomous Database**: You can use a free tier PostgreSQL or bring your own. Ensure it's accessible from your VM.
    -   **Object Storage**: Used for media uploads, as configured in your `.env` file.

3.  **Database Setup**
    -   Ensure your VM can connect to your database instance. You might need to configure VCN security lists or network security groups.
    -   Database migrations are handled by the application on startup if configured to do so, or you can run them manually inside the container.

4.  **Load Balancer & SSL**
    -   Configure an Oracle Cloud Load Balancer to point to your VM's IP address on port 3000.
    -   Set up SSL certificates for your domain.

### Cloudflare Integration

1. **DNS Setup**
   ```bash
   # Point your domain to Oracle Cloud Load Balancer
   # Enable Cloudflare proxy (orange cloud)
   ```

2. **Performance & Security**
   ```bash
   # Enable caching rules for static assets
   # Set up rate limiting
   # Configure DDoS protection
   ```

## 📊 API Documentation

### Authentication Endpoints

```http
POST /api/v1/auth/register     # Register new user
POST /api/v1/auth/login        # User login
POST /api/v1/auth/refresh      # Refresh access token
POST /api/v1/auth/logout       # User logout
```

### User Management

```http
GET    /api/v1/users/:id           # Get user profile
PATCH  /api/v1/users/profile       # Update profile
POST   /api/v1/users/profile-picture # Upload profile picture
POST   /api/v1/users/:id/follow     # Follow user
DELETE /api/v1/users/:id/follow     # Unfollow user
```

### Pet Management

```http
POST   /api/v1/pets              # Create pet profile
GET    /api/v1/pets/:id          # Get pet details
PATCH  /api/v1/pets/:id          # Update pet profile
POST   /api/v1/pets/:id/picture  # Upload pet picture
```

### Content Creation

```http
POST   /api/v1/posts            # Create new post
GET    /api/v1/posts/:id        # Get post details
POST   /api/v1/posts/:id/like   # Like/unlike post
POST   /api/v1/stories          # Create story
GET    /api/v1/feed/:userId     # Get personalized feed
GET    /api/v1/explore          # Discover trending content
```

### Health & Records

```http
POST   /api/v1/health-records           # Add health record
GET    /api/v1/health-records/:petId    # Get pet health records
PATCH  /api/v1/health-records/:id       # Update health record
```

### Matching & Discovery

```http
GET    /api/v1/matches/swipe            # Get pets for swiping
POST   /api/v1/matches/swipe            # Swipe on pet
GET    /api/v1/map/services             # Find nearby services
POST   /api/v1/reviews                  # Create service review
```

Complete API documentation is available at `/api/docs` when running the application.

## 🧪 Testing

### Unit Tests
```bash
npm run test              # Run unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
```

### Integration Tests
```bash
npm run test:e2e          # End-to-end tests
```

### Load Testing
```bash
# Install k6
npm install -g k6

# Run load tests
k6 run tests/load/basic-load.js
```

### Test Data
```bash
# Seed test data
npm run seed:dev
```

## 🔐 Security Features

- **Authentication**: JWT with refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Configurable throttling per endpoint
- **Data Encryption**: Sensitive data encrypted at rest
- **File Security**: Malware scanning for uploads
- **SQL Injection**: TypeORM query builder protection
- **CORS**: Configurable cross-origin policies
- **Helmet**: Security headers middleware

## 📈 Performance Optimizations

- **Database**: Proper indexing and query optimization
- **Caching**: Redis for frequently accessed data
- **CDN**: Cloudflare for static asset delivery
- **Image Processing**: Sharp for image optimization
- **Connection Pooling**: Optimized database connections
- **Compression**: Gzip compression for responses

## 🔍 Monitoring & Logging

- **Health Checks**: Automated endpoint monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time tracking
- **Database Monitoring**: Query performance analysis
- **Rate Limit Monitoring**: API usage patterns

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages
- Ensure code passes linting

### Code Style

```bash
npm run lint              # Run ESLint
npm run format            # Format with Prettier
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Full API docs at `/api/docs`
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: support@pawlie.app

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core user and pet management
- [x] Basic social features (posts, stories)
- [x] Authentication and authorization
- [x] File upload and storage

### Phase 2 (Next)
- [ ] Matching system implementation
- [ ] Map integration with service discovery
- [ ] Push notifications
- [ ] PayHere payment integration

### Phase 3 (Future)
- [ ] Mobile app development
- [ ] Advanced AI features
- [ ] International expansion
- [ ] Enterprise features

## 🏆 Acknowledgments

- NestJS team for the excellent framework
- TypeORM for database abstraction
- Oracle Cloud for infrastructure support
- The pet community for inspiration

---

**Built with ❤️ for pet lovers everywhere**