// tests/setup.js
import '@testing-library/jest-dom';

// Mock console methods for cleaner test output
global.console = {
    ...console,
    // Uncomment below to suppress console.log in tests
    // log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Mock DOM methods that might not be available in jsdom
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock IntersectionObserver if your toast library uses it
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    observe() { return null; }
    disconnect() { return null; }
    unobserve() { return null; }
};

// Clean up DOM after each test
afterEach(() => {
    document.body.innerHTML = '';
});
