# Playwright Test Suite for SauceDemo.com

A comprehensive end-to-end test automation suite for [SauceDemo.com](https://www.saucedemo.com/) using Playwright. This project demonstrates modern test automation practices with TypeScript and Playwright, focusing on robust, maintainable, and thorough testing strategies.

## Project Overview

This test suite covers the core functionality of the SauceDemo.com e-commerce demo site, including:
- User authentication and session management
- Product inventory browsing and sorting
- Shopping cart operations
- Burger menu navigation
- Accessibility testing

## Test Coverage

The test suite is organized into several key areas:

### Login Tests (`login.spec.ts`)
- Authentication scenarios
- Error handling
- User session management
- Various user role testing

### Inventory Tests (`inventory.spec.ts`)
- Product listing verification
- Image and content validation
- Sorting functionality
- Cart operations
- Performance checks

### Burger Menu Tests (`burger-menu.spec.ts`)
- Menu navigation
- State management
- Accessibility testing
- Cross-page functionality

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/jowan88/PW-MCP.git
   cd PW-MCP
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Running Tests

Run all tests:
```bash
npx playwright test
```

Run specific test files:
```bash
npx playwright test login.spec.ts      # Run login tests
npx playwright test inventory.spec.ts  # Run inventory tests
npx playwright test burger-menu.spec.ts # Run burger menu tests
```

Run tests with UI mode:
```bash
npx playwright test --ui
```

View test report:
```bash
npx playwright show-report
```

## Project Structure

```
└── pw-mcp/
    ├── tests/
    │   ├── login.spec.ts      # Login functionality tests
    │   ├── inventory.spec.ts  # Product inventory tests
    │   └── burger-menu.spec.ts # Navigation menu tests
    ├── playwright.config.ts   # Playwright configuration
    ├── package.json          # Project dependencies
    └── README.md            # Project documentation
```

## Test Design Principles

- **Isolation**: Each test is independent and can run in any order
- **Readability**: Clear test descriptions and well-structured code
- **Reliability**: Robust selectors and proper waiting strategies
- **Maintainability**: Modular test structure and reusable functions
- **Coverage**: Comprehensive testing of both happy paths and edge cases

## Contributing

Feel free to submit issues and enhancement requests!
