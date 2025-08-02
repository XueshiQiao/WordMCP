# GitHub Issue MCP Server

A Model Context Protocol (MCP) server for managing words via GitHub issues. This server provides tools to add, list, and retrieve words stored as GitHub issues, one issue for each word.

## Features

- **Add Words**: Create new word entries as GitHub issues
- **List Words**: Retrieve all words from GitHub issues
- **Get Word**: Retrieve a specific word by ID
- **RESTful API**: HTTP endpoints for MCP communication
- **Session Management**: Proper session handling for MCP clients
- **Error Handling**: Comprehensive error handling and validation
- **Type Safety**: Full TypeScript support with Zod validation

## Project Structure

```
src/
├── config.ts              # Configuration management
├── errors.ts              # Error handling and custom error classes
├── server.ts              # Main HTTP server with MCP integration
├── types.ts               # TypeScript type definitions
├── word.ts                # Word schema and validation
├── word_test.ts           # Word validation tests
└── services/
    ├── github.service.ts  # GitHub API business logic
    └── mcp.service.ts     # MCP tool registration and handling
```

## Installation

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your GitHub credentials:
   ```bash
   cp env.example .env
   ```
   Then edit `.env` with your actual values:
   ```env
   GITHUB_TOKEN=your_github_token
   GITHUB_OWNER=your_github_username
   GITHUB_REPO=your_repository_name
   ```
4. Run `npm start`


### Docker Deployment

1. Clone the repository
2. Copy the environment example:
   ```bash
   cp env.example .env
   ```
3. Edit `.env` with your GitHub credentials
4. Run with Docker Compose:
   ```bash
   # Production
   docker-compose up -d

   # Development (with hot reloading)
   docker-compose -f docker-compose.dev.yml up -d
   ```

## Usage

### Local Development
```bash
npm run dev
```

### Local Production
```bash
npm start
```

### Testing
```bash
npm test
```

### Docker Commands

```bash
# Build and start production container
docker-compose up -d

# Build and start development container (with hot reloading)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Production with Nginx reverse proxy
docker-compose --profile production up -d
```

## API Endpoints

- `POST /mcp` - MCP client communication
- `GET /mcp` - Server-sent events for notifications
- `DELETE /mcp` - Session termination
- `GET /health` - Health check endpoint

## MCP Tools

### add-word
Adds a new word to the GitHub repository as an issue.

**Input Schema:**
```json
{
  "word": "string",
  "pronunciation": "string",
  "definition": "string",
  "context": "string (optional)",
  "other_definitions": ["string"] (optional),
  "id": "number (optional)"
}
```

### list-words
Lists all words from the GitHub repository.

**Input:** None required

### get-word
Retrieves a specific word by ID.

**Input Schema:**
```json
{
  "id": "number"
}
```

## Configuration

### Environment Variables

The server can be configured via environment variables:

- `GITHUB_TOKEN` - GitHub personal access token (required)
- `GITHUB_OWNER` - GitHub username or organization (required)
- `GITHUB_REPO` - GitHub repository name (required)
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: localhost)
- `CORS_ORIGINS` - CORS allowed origins (default: *)
- `NODE_ENV` - Environment (development/production/test)
- `LOG_LEVEL` - Logging level (default: info)

### Docker Configuration

The Docker setup includes:

- **Production**: Optimized container with health checks
- **Development**: Hot reloading with volume mounts
- **Nginx**: Optional reverse proxy with rate limiting and SSL support
- **Networking**: Isolated network for security
- **Logging**: Persistent log volumes

## Error Handling

The application includes comprehensive error handling:

- **ValidationError**: For invalid input data
- **GitHubApiError**: For GitHub API failures

All errors are properly logged and returned with appropriate HTTP status codes.

## Best Practices Implemented

1. **Separation of Concerns**: Business logic separated into services
2. **Type Safety**: Full TypeScript support with Zod validation
3. **Error Handling**: Custom error classes and centralized error handling
4. **Configuration Management**: Environment-based configuration with validation
5. **Security**: CORS configuration and input validation
6. **Code Organization**: Modular structure with clear responsibilities
7. **Documentation**: Comprehensive code documentation
8. **Testing**: Validation tests for core functionality

## Development

### Adding New Tools

1. Add the tool registration in `src/services/mcp.service.ts`
2. Implement the business logic in the appropriate service
3. Add proper error handling and validation
4. Update documentation

### Adding New Services

1. Create a new service file in `src/services/`
2. Follow the established patterns for error handling and type safety
3. Update the main server to use the new service

## License

MIT
