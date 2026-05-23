import { toggleClass, elementHasClass, rootInDarkMode } from './domElement';

describe('DOM utility functions', () => {
  let testElement: HTMLElement;

  beforeEach(() => {
    // Create a mock element for testing since JSDOM is used
    testElement = document.createElement('div');
  });

  describe('toggleClass', () => {
    it('should add class if it does not exist', () => {
      toggleClass(testElement, 'test-class');
      expect(testElement.classList.contains('test-class')).toBe(true);
    });

    it('should remove class if it exists', () => {
      testElement.classList.add('test-class');
      toggleClass(testElement, 'test-class');
      expect(testElement.classList.contains('test-class')).toBe(false);
    });

    it('should handle multiple toggle operations correctly', () => {
      // Start without class
      expect(testElement.classList.contains('test-class')).toBe(false);
      
      // Add class
      toggleClass(testElement, 'test-class');
      expect(testElement.classList.contains('test-class')).toBe(true);
      
      // Remove class
      toggleClass(testElement, 'test-class');
      expect(testElement.classList.contains('test-class')).toBe(false);
    });
  });

  describe('elementHasClass', () => {
    it('should return true when element has the specified class', () => {
      testElement.classList.add('test-class');
      const result = elementHasClass(testElement, 'test-class');
      expect(result).toBe(true);
    });

    it('should return false when element does not have the specified class', () => {
      const result = elementHasClass(testElement, 'non-existent-class');
      expect(result).toBe(false);
    });

    it('should return false for empty class name on element without classes', () => {
      const result = elementHasClass(testElement, '');
      expect(result).toBe(false);
    });

    it('should handle elements with multiple classes correctly', () => {
      testElement.className = 'class1 class2 class3';
      expect(elementHasClass(testElement, 'class1')).toBe(true);
      expect(elementHasClass(testElement, 'class2')).toBe(true);
      expect(elementHasClass(testElement, 'class3')).toBe(true);
      expect(elementHasClass(testElement, 'class4')).toBe(false);
    });
  });

  describe('rootInDarkMode', () => {
    afterEach(() => {
      // Clean up after each test to ensure consistent state
      document.documentElement.removeAttribute('data-theme');
    });

    it('should return true when root element has data-theme="dark"', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const result = rootInDarkMode();
      expect(result).toBe(true);
    });

    it('should return false when root element has data-theme="light"', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      const result = rootInDarkMode();
      expect(result).toBe(false);
    });

    it('should return false when root element has no data-theme attribute', () => {
      const result = rootInDarkMode();
      expect(result).toBe(false);
    });

    it('should return false when root element has different data-theme value', () => {
      document.documentElement.setAttribute('data-theme', 'auto');
      const result = rootInDarkMode();
      expect(result).toBe(false);
    });
  });
});