# Playwright Test Suite for SauceDemo.com

A comprehensive end-to-end test automation suite for [SauceDemo.com](https://www.saucedemo.com/) using Playwright. This project demonstrates modern test automation practices with TypeScript and Playwright, focusing on robust, maintainable, and thorough testing strategies.

## Project Overview

This test suite covers the core functionality of the SauceDemo.com e-commerce demo site, including:
- User authentication and session management
- Product inventory browsing and sorting
- Shopping cart operations
- Burger menu navigation
- Accessibility and security testing

## Test Structure

The test suite is organized into functional and non-functional tests:

### Functional Tests (`tests/functional/`)
- **Burger Menu** (`burger-menu.spec.ts`)
  - Menu navigation and state management
  - Cross-page functionality
  - Transition handling
  - Keyboard interactions
  
- **Cart** (`cart.spec.ts`)
  - Adding/removing items
  - Quantity updates
  - Checkout process
  
- **Edge Cases** (`edge-cases.spec.ts`)
  - Boundary conditions
  - Error scenarios
  - State recovery
  
- **Inventory** (`inventory.spec.ts`)
  - Product listing and details
  - Sorting and filtering
  - Image and content validation
  
- **Login** (`login.spec.ts`)
  - Authentication flows
  - User roles and permissions
  - Session management

### Non-Functional Tests (`tests/non-functional/`)
- **Accessibility** (`accessibility.spec.ts`)
  - WCAG compliance checks
  - Screen reader compatibility
  - Keyboard navigation
  
- **Security** (`security.spec.ts`)
  - Authentication security
  - Session handling
  - Data protection

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
npx playwright test tests/functional/login.spec.ts      # Run login tests
npx playwright test tests/functional/inventory.spec.ts  # Run inventory tests
npx playwright test tests/non-functional/*.spec.ts     # Run all non-functional tests
```

Run tests with UI mode:
```bash
npx playwright test --ui
```

View test report:
```bash
npx playwright show-report
```

Format code:
```bash
npm run format        # Format all test files
npm run format:check  # Check formatting without making changes
```

## Project Structure

```
└── pw-mcp/
    ├── tests/
    │   ├── functional/
    │   │   ├── burger-menu.spec.ts
    │   │   ├── cart.spec.ts
    │   │   ├── edge-cases.spec.ts
    │   │   ├── inventory.spec.ts
    │   │   └── login.spec.ts
    │   └── non-functional/
    │       ├── accessibility.spec.ts
    │       └── security.spec.ts
    ├── playwright-report/     # Test execution reports
    ├── test-results/         # Test artifacts and screenshots
    ├── .prettierrc          # Code formatting rules
    ├── playwright.config.ts  # Playwright configuration
    ├── package.json         # Project dependencies
    └── README.md           # Project documentation
```

## Recent Updates

- Reorganized tests into functional and non-functional categories
- Added dedicated edge cases test suite
- Improved burger menu tests reliability:
  - Enhanced navigation handling
  - Better state management
  - More reliable selectors
  - Proper transition handling
- Added Prettier for consistent code formatting
- Improved test structure with better separation of concerns
- Added npm scripts for common operations
- Enhanced error handling and test stability
- Added comprehensive documentation

## Test Design Principles

- **Isolation**: Each test is independent and can run in any order
- **Readability**: Clear test descriptions and well-structured code
- **Reliability**: Robust selectors and proper waiting strategies
- **Maintainability**: Modular test structure and reusable functions
- **Coverage**: Comprehensive testing of both happy paths and edge cases

## Best Practices

- Use appropriate waiting strategies (waitForSelector, waitForNavigation, etc.)
- Handle page transitions and animations properly
- Implement reliable test cleanup in afterEach hooks
- Use meaningful test descriptions
- Follow consistent code formatting
- Maintain test independence
- Implement proper error handling
- Use appropriate assertions
- Keep tests focused and concise

## Contributing

Feel free to submit issues and enhancement requests!
