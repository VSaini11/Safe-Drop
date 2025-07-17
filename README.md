# 🔒 SafeDrop - Secure File Sharing

SafeDrop is a full-stack, secure file sharing application built with vanilla JavaScript, Node.js, Express, and MongoDB. It provides temporary file sharing with optional password protection and automatic cleanup.

## ✨ Features

- **🔐 Secure File Sharing**: Upload files with optional password protection
- **⏰ Time-based Expiry**: Files automatically expire and are deleted (1hr, 1 day, 1 week, 1 month)
- **🚀 Fast & Simple**: Clean, responsive vanilla JavaScript frontend
- **🛡️ Security First**: Rate limiting, input sanitization, CORS protection, Helmet.js
- **☁️ Cloud Storage**: Files stored securely on Cloudinary
- **🧹 Auto Cleanup**: Scheduled cleanup of expired files using node-cron
- **🐳 Dockerized**: Complete Docker setup with docker-compose
- **📊 MongoDB**: Efficient storage with TTL indexes for automatic expiry

## 🏗️ System Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Vanilla JS)  │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│                 │    │   Express       │    │   TTL Indexes   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   File Storage  │
                       │   (Cloudinary)  │
                       └─────────────────┘
\`\`\`

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB (or use Docker)
- Cloudinary account (free tier available)

### 1. Clone and Setup

\`\`\`bash
git clone <repository-url>
cd safedrop
cp .env.example .env
\`\`\`

### 2. Configure Environment

Edit \`.env\` with your settings:

\`\`\`env
# Required: Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Database
MONGODB_URI=mongodb://localhost:27017/safedrop
\`\`\`

### 3. Run with Docker (Recommended)

\`\`\`bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f safedrop-app

# Stop services
docker-compose down
\`\`\`

### 4. Run Locally (Development)

\`\`\`bash
# Install dependencies
cd server && npm install

# Start MongoDB (if not using Docker)
mongod

# Start the application
npm run dev
\`\`\`

Visit \`http://localhost:3000\` to use SafeDrop!

## 📁 Project Structure

\`\`\`
safedrop/
├── client/                 # Frontend (Vanilla JS)
│   ├── index.html         # Upload page
│   ├── download.html      # Download page
│   ├── styles.css         # Styling
│   ├── script.js          # Upload functionality
│   └── download.js        # Download functionality
├── server/                # Backend (Node.js)
│   ├── app.js            # Main application
│   ├── config/           # Configuration
│   ├── controllers/      # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── utils/            # Utilities
├── scripts/              # Database scripts
├── .github/workflows/    # CI/CD pipeline
├── docker-compose.yml    # Docker orchestration
├── Dockerfile           # Container definition
└── README.md           # This file
\`\`\`

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | \`/api/upload\` | Upload a file |
| GET | \`/api/file/:id\` | Get file information |
| POST | \`/api/file/:id/verify\` | Verify password |
| GET | \`/api/file/:id/download\` | Download file |
| GET | \`/api/health\` | Health check |

## 🛡️ Security Features

- **Rate Limiting**: 100 requests/15min, 10 uploads/hour per IP
- **Input Sanitization**: All inputs sanitized and validated
- **Password Hashing**: bcrypt with 12 rounds
- **CORS Protection**: Configured for production domains
- **Helmet.js**: Security headers and XSS protection
- **File Validation**: Dangerous file types blocked
- **UUID File IDs**: Cryptographically secure identifiers

## ⚙️ Configuration Options

### File Upload Limits
- Maximum file size: 50MB
- Supported: All file types (except dangerous executables)
- Storage: Cloudinary with automatic optimization

### Expiry Options
- 1 hour
- 1 day (default)
- 1 week  
- 1 month (maximum)

### Cleanup Schedule
- Every hour: Basic cleanup
- Every 6 hours: Thorough cleanup
- MongoDB TTL: Automatic document expiry

## 🐳 Docker Configuration

### Production Deployment

\`\`\`bash
# Build and run production
docker-compose up -d

# Scale the application
docker-compose up -d --scale safedrop-app=3
\`\`\`

### Development Mode

\`\`\`bash
# Run development version with hot reload
docker-compose --profile dev up -d safedrop-dev
\`\`\`

### With Redis Caching

\`\`\`bash
# Include Redis for enhanced performance
docker-compose --profile cache up -d
\`\`\`

## 🚀 Deployment

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Render Deployment

1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: \`cd server && npm install\`
4. Set start command: \`cd server && npm start\`
5. Add environment variables

### Environment Variables for Production

\`\`\`env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://your-domain.com
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run tests
cd server && npm test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint
\`\`\`

## 📊 Monitoring & Logs

### Health Check
- Endpoint: \`/api/health\`
- Docker health checks configured
- Uptime and status monitoring

### Logging
- Application logs in \`/logs\` directory
- Docker logs: \`docker-compose logs -f\`
- Error tracking and performance monitoring

## 🔄 CI/CD Pipeline

GitHub Actions workflow includes:
- **Testing**: Automated tests with MongoDB
- **Linting**: Code quality checks
- **Building**: Docker image creation
- **Deployment**: Automatic deployment to Railway/Render

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/amazing-feature\`
3. Commit changes: \`git commit -m 'Add amazing feature'\`
4. Push to branch: \`git push origin feature/amazing-feature\`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Documentation**: Check the \`/docs\` folder for detailed guides

## 🎯 Roadmap

- [ ] File preview functionality
- [ ] Bulk file uploads
- [ ] User accounts and file management
- [ ] Advanced analytics and usage stats
- [ ] Mobile app (React Native)
- [ ] API rate limiting per user
- [ ] File encryption at rest
- [ ] Custom expiry times
- [ ] File sharing via email

---

**SafeDrop** - Secure, Simple, Temporary File Sharing 🔒✨
\`\`\`

Built with ❤️ using Vanilla JavaScript, Node.js, and MongoDB
