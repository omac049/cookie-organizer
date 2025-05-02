// Cookie Organizer - Comparison Module

// Create a safe namespace for comparison functionality
window.safeComparisonManager = {
  // Initialize comparison features
  init: function() {
    console.log("Initializing comparison functionality");
    
    // Set up UI elements and event listeners
    this.setupComparisonUI();
  },
  
  // Setup comparison UI elements
  setupComparisonUI: function() {
    // Add implementation for comparison UI setup
    const compareTab = document.getElementById("compareTab");
    
    if (compareTab) {
      compareTab.classList.add("comparison-ready");
    }
  },

  // Create a snapshot of current cookies
  createSnapshot: function(cookies, timestamp = new Date().toISOString()) {
    return {
      cookies: JSON.parse(JSON.stringify(cookies)), // Deep copy
      timestamp: timestamp,
      id: `snapshot-${Date.now()}`
    };
  },
  
  // Save a snapshot to storage
  saveSnapshot: function(snapshot) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['cookieSnapshots'], function(result) {
        const snapshots = result.cookieSnapshots || [];
        snapshots.push(snapshot);
        
        // Keep only most recent snapshots (limit to 10)
        if (snapshots.length > 10) {
          snapshots.shift();
        }
        
        chrome.storage.local.set({ cookieSnapshots: snapshots }, function() {
          resolve(snapshots);
        });
      });
    });
  },
  
  // Load snapshots from storage
  loadSnapshots: function() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['cookieSnapshots'], function(result) {
        resolve(result.cookieSnapshots || []);
      });
    });
  },
  
  // Compare current cookies with a snapshot
  compareCookies: function(currentCookies, snapshot) {
    const results = {
      added: [],
      removed: [],
      modified: [],
      unchanged: []
    };
    
    // Build lookup tables for faster comparison
    const currentCookiesMap = {};
    const snapshotCookiesMap = {};
    
    currentCookies.forEach(cookie => {
      const key = `${cookie.name}|${cookie.domain}|${cookie.path}`;
      currentCookiesMap[key] = cookie;
    });
    
    snapshot.cookies.forEach(cookie => {
      const key = `${cookie.name}|${cookie.domain}|${cookie.path}`;
      snapshotCookiesMap[key] = cookie;
    });
    
    // Find added and modified cookies
    for (const key in currentCookiesMap) {
      const currentCookie = currentCookiesMap[key];
      if (!snapshotCookiesMap[key]) {
        results.added.push(currentCookie);
      } else {
        const snapshotCookie = snapshotCookiesMap[key];
        if (currentCookie.value !== snapshotCookie.value) {
          results.modified.push({
            current: currentCookie,
            previous: snapshotCookie
          });
        } else {
          results.unchanged.push(currentCookie);
        }
      }
    }
    
    // Find removed cookies
    for (const key in snapshotCookiesMap) {
      if (!currentCookiesMap[key]) {
        results.removed.push(snapshotCookiesMap[key]);
      }
    }
    
    return results;
  },
  
  // Display comparison results in UI
  displayComparisonResults: function(results) {
    const compareContainer = document.getElementById("compareContainer");
    if (!compareContainer) return;
    
    // Clear previous results
    compareContainer.innerHTML = "";
    
    // Create summary
    const summary = document.createElement("div");
    summary.className = "comparison-summary";
    summary.innerHTML = `
      <h3>Comparison Results</h3>
      <div class="summary-stats">
        <div class="stat-item added">
          <span class="stat-count">${results.added.length}</span>
          <span class="stat-label">Added</span>
        </div>
        <div class="stat-item removed">
          <span class="stat-count">${results.removed.length}</span>
          <span class="stat-label">Removed</span>
        </div>
        <div class="stat-item modified">
          <span class="stat-count">${results.modified.length}</span>
          <span class="stat-label">Modified</span>
        </div>
        <div class="stat-item unchanged">
          <span class="stat-count">${results.unchanged.length}</span>
          <span class="stat-label">Unchanged</span>
        </div>
      </div>
    `;
    
    compareContainer.appendChild(summary);
    
    // Function to render cookie sections
    const renderCookieSection = (title, cookies, className) => {
      if (cookies.length === 0) return;
      
      const section = document.createElement("div");
      section.className = `comparison-section ${className}`;
      section.innerHTML = `<h4>${title} (${cookies.length})</h4>`;
      
      const list = document.createElement("div");
      list.className = "cookie-list";
      
      section.appendChild(list);
      compareContainer.appendChild(section);
    };
    
    // Render each section
    renderCookieSection("Added Cookies", results.added, "added-section");
    renderCookieSection("Removed Cookies", results.removed, "removed-section");
    renderCookieSection("Modified Cookies", results.modified, "modified-section");
  }
};

// Function to initialize comparison tab
function initCompareTab() {
  window.safeComparisonManager.init();
} 