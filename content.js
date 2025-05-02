/**
 * Cookie Organizer - Content Script
 * 
 * This script runs in the context of web pages and provides communication
 * between the page context and the extension.
 */

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getPageCookies") {
    // Return any accessible document.cookie data
    sendResponse({ cookies: document.cookie });
    return true;
  }
  
  // Add other message handlers as needed
});

// Log initialization in console for debugging purposes
console.debug("Cookie Organizer: Content script initialized"); 