# Contributing to ArtHub Backend

Thank you for considering contributing to the ArtHub Backend project! This document provides guidelines and instructions for contributing to the project.

## Project Structure

The project follows a modular architecture with clear separation of concerns:

```
ArtHub-Backend/
├── DB/                     # Database models and connection
│   ├── connection.js       # MongoDB connection setup
│   └── models/             # Mongoose models
├── __mocks__/              # Mock files for testing
├── __tests__/              # Test files
│   ├── integration/        # Integration tests
│   ├── setup.js            # Test setup
│   └── unit/               # Unit tests
├── src/
│   ├── middleware/         # Express middleware
│   ├── modules/            # Feature modules
│   │   ├── auth/           # Authentication module
│   │   │   ├── controller/ # Controller functions
│   │   │   ├── auth.router.js # Routes
│   │   │   └── auth.validation.js # Validation schemas
│   │   ├── user/           # User module
│   │   ├── artwork/        # Artwork module
│   │   └── ...             # Other modules
│   ├── utils/              # Utility functions
│   ├── swagger/            # API documentation
│   └── index.router.js     # Main router
├── index.js                # Application entry point
├── jest.config.js          # Jest configuration
├── .env                    # Environment variables (not in repo)
└── package.json            # Project dependencies
```

## Development Guidelines

### Code Style

We follow clean code principles and use ESLint and Prettier for code formatting:

- Use meaningful variable and function names
- Keep functions small and focused on a single task
- Use async/await for asynchronous operations
- Follow the ESLint rules defined in `.eslintrc.json`
- Format code using Prettier before committing

Run linting and formatting:

```bash
npm run lint        # Check for linting issues
npm run lint:fix    # Fix linting issues automatically
npm run format      # Format code with Prettier
```

### Testing

We use Jest for testing. All new features should include appropriate tests:

- Unit tests for individual functions and components
- Integration tests for API endpoints

Run tests:

```bash
npm test            # Run all tests
npm run test:unit   # Run only unit tests
npm run test:integration # Run only integration tests
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure they pass (`npm test`)
5. Run linting (`npm run lint`)
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Commit Message Guidelines

Follow these guidelines for commit messages:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests after the first line

## Best Practices

### Authentication and Authorization

- Always use the authentication middleware for protected routes
- Use role-based authorization for admin-only routes
- Validate user permissions before allowing resource modification

### Error Handling

- Use the global error handler for consistent error responses
- Use the asyncHandler utility for async route handlers
- Include appropriate HTTP status codes with errors

### Database Operations

- Use Mongoose models for database operations
- Validate data before saving to the database
- Use indexes for frequently queried fields
- Handle database connection errors gracefully

### API Design

- Follow RESTful principles
- Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- Version the API when making breaking changes
- Document all endpoints using Swagger

## Environment Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the required environment variables (see `.env.example`)
4. Start the development server: `npm run dev`

## Need Help?

If you need help with anything, please open an issue in the repository or contact the project maintainers.

Thank you for contributing to ArtHub Backend! 