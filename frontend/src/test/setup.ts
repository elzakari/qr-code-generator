import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [];
  
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress known benign warnings to keep test output readable
const originalError = console.error;
const originalWarn = console.warn;

const suppressedPatterns = [
  /ReactDOMTestUtils\.act is deprecated/i,
  /React Router Future Flag Warning/i,
  /Warning: .*not wrapped in act\(\.\.\.\)/i,
];

function shouldSuppress(message?: unknown): boolean {
  return typeof message === 'string' && suppressedPatterns.some((p) => p.test(message));
}

console.error = (...args: any[]) => {
  if (shouldSuppress(args[0])) return;
  originalError(...args);
};

console.warn = (...args: any[]) => {
  if (shouldSuppress(args[0])) return;
  originalWarn(...args);
};