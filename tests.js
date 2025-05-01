/**
 * Cookie Organizer - Automated Tests
 * This file contains automated tests for the core functionality of the Cookie Organizer extension.
 * The tests can be run manually from the browser console when the extension popup is open.
 */

// Main test suite
const CookieOrganizerTests = {
  allTests: [],
  passedTests: 0,
  failedTests: 0,
  
  // Register a test
  registerTest: function(name, testFn) {
    this.allTests.push({ name, testFn });
  },
  
  // Run all registered tests
  runAll: async function() {
    this.passedTests = 0;
    this.failedTests = 0;
    
    console.group("🧪 COOKIE ORGANIZER TESTS");
    console.log(`Starting test run with ${this.allTests.length} tests`);
    console.time("Total test time");
    
    for (const test of this.allTests) {
      await this.runTest(test.name, test.testFn);
    }
    
    console.timeEnd("Total test time");
    console.log(`\n📊 RESULTS: ${this.passedTests} passed, ${this.failedTests} failed`);
    
    if (this.failedTests === 0) {
      console.log("✅ All tests passed!");
    } else {
      console.error(`❌ ${this.failedTests} tests failed`);
    }
    
    console.groupEnd();
    
    return {
      total: this.allTests.length,
      passed: this.passedTests,
      failed: this.failedTests
    };
  },
  
  // Run a single test
  runTest: async function(name, testFn) {
    console.group(`Test: ${name}`);
    console.time(name);
    
    try {
      await testFn();
      console.log("✅ Passed");
      this.passedTests++;
    } catch (error) {
      console.error("❌ Failed:", error);
      this.failedTests++;
    }
    
    console.timeEnd(name);
    console.groupEnd();
  },
  
  // Assertions
  assert: function(condition, message) {
    if (!condition) {
      throw new Error(message || "Assertion failed");
    }
  },
  
  assertEquals: function(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected "${expected}" but got "${actual}"`);
    }
  },
  
  assertContains: function(haystack, needle, message) {
    if (typeof haystack === 'string') {
      if (!haystack.includes(needle)) {
        throw new Error(message || `Expected "${haystack}" to contain "${needle}"`);
      }
    } else if (Array.isArray(haystack)) {
      if (!haystack.includes(needle)) {
        throw new Error(message || `Expected array to contain "${needle}"`);
      }
    } else {
      throw new Error("Cannot check contains on this type");
    }
  }
};

/**
 * UI Tests
 */
// Test that the UI elements load correctly
CookieOrganizerTests.registerTest("UI elements load correctly", function() {
  const requiredElements = [
    "searchInput",
    "byPurposeTab",
    "byRelationshipTab",
    "allCookiesTab",
    "chartsTab",
    "logsTab",
    "refreshButton",
    "exportButton"
  ];
  
  for (const elementId of requiredElements) {
    const element = document.getElementById(elementId);
    CookieOrganizerTests.assert(element, `Element ${elementId} not found`);
  }
});

// Test theme switching functionality
CookieOrganizerTests.registerTest("Theme switching works", function() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";
  
  // Change theme
  const themeToggle = document.getElementById("themeToggle");
  CookieOrganizerTests.assert(themeToggle, "Theme toggle not found");
  themeToggle.click();
  
  // Check that theme has changed
  const updatedTheme = html.getAttribute("data-theme");
  CookieOrganizerTests.assertEquals(updatedTheme, newTheme, "Theme did not change correctly");
  
  // Reset to original theme
  themeToggle.click();
});

/**
 * Core functionality tests
 */
// Test cookie filtering
CookieOrganizerTests.registerTest("Cookie filtering works", function() {
  const searchBox = document.getElementById("searchBox");
  CookieOrganizerTests.assert(searchBox, "Search box not found");
  
  // Store original value
  const originalValue = searchBox.value;
  
  // Test with a search term that shouldn't match anything
  searchBox.value = "ThisShouldNotMatchAnyCookies123456789";
  const event = new Event("input", { bubbles: true });
  searchBox.dispatchEvent(event);
  
  // Give time for the debounced search to execute
  return new Promise(resolve => {
    setTimeout(() => {
      // Check if no results message is displayed
      const noCookiesElements = document.querySelectorAll(".no-cookies");
      const visibleNoCookies = Array.from(noCookiesElements).some(el => 
        el.style.display !== "none" && el.textContent.includes("No cookies match")
      );
      
      CookieOrganizerTests.assert(visibleNoCookies, "No cookies message not displayed for non-matching search");
      
      // Reset search box
      searchBox.value = originalValue;
      searchBox.dispatchEvent(event);
      
      resolve();
    }, 500); // Wait for debounce
  });
});

// Test tab switching
CookieOrganizerTests.registerTest("Tab switching works", function() {
  const tabs = document.querySelectorAll(".category-tab");
  CookieOrganizerTests.assert(tabs.length > 0, "No tabs found");
  
  // Store currently active tab
  let activeTabId;
  tabs.forEach(tab => {
    if (tab.classList.contains("active")) {
      activeTabId = tab.getAttribute("data-tab");
    }
  });
  
  // Click on each tab and verify it becomes active
  for (const tab of tabs) {
    const tabId = tab.getAttribute("data-tab");
    tab.click();
    
    // Verify tab is active
    CookieOrganizerTests.assert(tab.classList.contains("active"), `Tab ${tabId} did not become active`);
    
    // Verify tab content is displayed
    const tabContent = document.getElementById(tabId);
    CookieOrganizerTests.assert(tabContent.classList.contains("active"), `Tab content for ${tabId} is not active`);
  }
  
  // Return to original tab
  if (activeTabId) {
    document.querySelector(`[data-tab="${activeTabId}"]`).click();
  }
});

/**
 * Cookie parsing and manipulation tests
 */
// Test cookie value interpretation
CookieOrganizerTests.registerTest("Cookie value interpretation works", function() {
  // Create a test cookie
  const fakeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  
  const result = cookieValueInterpreter.interpret(fakeJwt);
  CookieOrganizerTests.assert(result.success, "JWT interpretation failed");
  CookieOrganizerTests.assertEquals(result.type, "JWT", "Did not detect JWT format correctly");
  CookieOrganizerTests.assertContains(result.result, "payload", "JWT rendering did not include payload section");
});

// Test export functionality
CookieOrganizerTests.registerTest("Cookie export formats work", function() {
  // Skip if no cookies data
  if (!siteCookies || siteCookies.length === 0) {
    console.log("No cookies to test export, skipping");
    return;
  }
  
  // Test all export formats
  const formats = ["json", "curl", "netscape"];
  
  for (const format of formats) {
    let content;
    
    switch (format) {
      case "json":
        content = createJsonExport();
        CookieOrganizerTests.assertContains(content, '"cookies":', `JSON export missing cookies section`);
        break;
      case "curl":
        content = createCurlExport();
        CookieOrganizerTests.assertContains(content, "curl", `cURL export does not contain curl command`);
        break;
      case "netscape":
        content = createNetscapeExport();
        CookieOrganizerTests.assertContains(content, "# Netscape HTTP Cookie File", `Netscape export missing header`);
        break;
    }
  }
});

// Expose test suite to the console
window.CookieOrganizerTests = CookieOrganizerTests;
console.log("Cookie Organizer Tests loaded. Run tests with: CookieOrganizerTests.runAll()"); 