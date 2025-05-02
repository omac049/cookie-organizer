// Cookie Organizer Popup Script
/* global Chart */

// Initialize critical global variables first
let siteUrl = "";
let siteCookies = [];
let cookiesByPurpose = {};
let cookiesByRelationship = {};
let selectedCookies = new Set();
let bulkActionsBar;

// Define relationship and purpose names
const relationshipNames = {
  primary: "Primary/First-Party",
  secondary: "Secondary",
  thirdParty: "Third-Party",
};

const purposeNames = {
  necessary: "Necessary",
  preferences: "Preferences",
  analytics: "Analytics",
  marketing: "Marketing",
  social: "Social Media",
  unknown: "Unknown",
};

// Define placeholder functions for functions that might be defined elsewhere
function loadCookies() {
  console.log("Loading cookies for current site...");
  
  // Show loading indicator
  const loadingIndicator = document.getElementById("loadingIndicator");
  const noCookies = document.getElementById("noCookies");
  
  if (loadingIndicator) {
    loadingIndicator.style.display = "block";
  }
  
  if (noCookies) {
    noCookies.style.display = "none";
  }
  
  // Call the scanCurrentSiteCookies function to get cookies via background script
  scanCurrentSiteCookies();
}

function updateStats(stats) {
  console.log("Updating stats with:", stats);
  
  if (!stats) return;
  
  // Update total cookies count
  const totalCookies = document.getElementById("totalCookies");
  if (totalCookies) {
    totalCookies.textContent = stats.total || 0;
  }
  
  // Update counts by purpose
  for (const purpose in stats.byPurpose) {
    const count = stats.byPurpose[purpose];
    const element = document.getElementById(`${purpose}Count`);
    if (element) {
      element.textContent = count;
    }
  }
  
  // Update counts by relationship
  for (const relationship in stats.byRelationship) {
    const count = stats.byRelationship[relationship];
    const element = document.getElementById(`${relationship}Count`);
    if (element) {
      element.textContent = count;
    }
  }
}

function renderCookies() {
  console.log("Rendering cookies in UI...");
  
  // Clear any existing cookie displays
  const byPurposeContainer = document.getElementById("byPurposeContent");
  const byRelationshipContainer = document.getElementById("byRelationshipContent");
  const allCookiesContainer = document.getElementById("allCookiesContent");
  
  if (!byPurposeContainer || !byRelationshipContainer || !allCookiesContainer) {
    console.error("Container elements not found for rendering cookies");
    return;
  }
  
  byPurposeContainer.innerHTML = "";
  byRelationshipContainer.innerHTML = "";
  allCookiesContainer.innerHTML = "";
  
  // No cookies found
  if (!siteCookies || siteCookies.length === 0) {
    const noCookies = document.getElementById("noCookies");
    if (noCookies) {
      noCookies.style.display = "block";
    }
    return;
  }
  
  // Render cookies by purpose
  for (const purpose in cookiesByPurpose) {
    const cookies = cookiesByPurpose[purpose];
    if (cookies && cookies.length > 0) {
      const purposeItem = document.createElement("div");
      purposeItem.className = `purpose-item ${purpose}`;
      
      const purposeHeader = document.createElement("div");
      purposeHeader.className = "category-header";
      purposeHeader.innerHTML = `
        <span>${getPurposeDescription(purpose)}</span>
        <span class="category-cookie-count">${cookies.length} cookies</span>
      `;
      
      const purposeCookies = document.createElement("div");
      purposeCookies.className = "category-cookies";
      
      // Add event listener to toggle category open/close
      purposeHeader.addEventListener("click", function() {
        purposeCookies.classList.toggle("open");
      });
      
      // Create cookie items
      cookies.forEach((cookie, index) => {
        const cookieItem = createCookieItemHTML(cookie, index);
        purposeCookies.appendChild(cookieItem);
      });
      
      purposeItem.appendChild(purposeHeader);
      purposeItem.appendChild(purposeCookies);
      byPurposeContainer.appendChild(purposeItem);
    }
  }
  
  // Render cookies by relationship
  for (const relationship in cookiesByRelationship) {
    const cookies = cookiesByRelationship[relationship];
    if (cookies && cookies.length > 0) {
      const relationshipItem = document.createElement("div");
      relationshipItem.className = `domain-item ${relationship}`;
      
      const relationshipHeader = document.createElement("div");
      relationshipHeader.className = "category-header";
      relationshipHeader.innerHTML = `
        <span>${relationshipNames[relationship] || relationship}</span>
        <span class="category-cookie-count">${cookies.length} cookies</span>
      `;
      
      const relationshipCookies = document.createElement("div");
      relationshipCookies.className = "category-cookies";
      
      // Add event listener to toggle category open/close
      relationshipHeader.addEventListener("click", function() {
        relationshipCookies.classList.toggle("open");
      });
      
      // Create cookie items
      cookies.forEach((cookie, index) => {
        const cookieItem = createCookieItemHTML(cookie, index);
        relationshipCookies.appendChild(cookieItem);
      });
      
      relationshipItem.appendChild(relationshipHeader);
      relationshipItem.appendChild(relationshipCookies);
      byRelationshipContainer.appendChild(relationshipItem);
    }
  }
  
  // Render all cookies
  siteCookies.forEach((cookie, index) => {
    const cookieItem = createCookieItemHTML(cookie, index);
    allCookiesContainer.appendChild(cookieItem);
  });
  
  // Update UI elements after rendering
  updateUI();
}

// Create HTML for a cookie item
function createCookieItemHTML(cookie, index) {
  // Create cookie item container
  const cookieItem = document.createElement("div");
  cookieItem.className = `cookie-item ${cookie.purpose || "unknown"}`;
  cookieItem.dataset.index = index;
  
  // Format expiration date
  let expiryText = "Session";
  if (cookie.expirationDate) {
    const expDate = new Date(cookie.expirationDate * 1000);
    expiryText = expDate.toLocaleString();
  }
  
  // Create cookie item content
  cookieItem.innerHTML = `
    <div class="cookie-header">
      <div class="cookie-name-container">
        <input type="checkbox" class="cookie-select-checkbox" data-index="${index}">
        <h3 class="cookie-name">${cookie.name}</h3>
      </div>
      <div class="cookie-metadata">
        ${cookie.secure ? '<span class="badge secure">Secure</span>' : ''}
        ${cookie.httpOnly ? '<span class="badge httponly">HttpOnly</span>' : ''}
        ${!cookie.expirationDate ? '<span class="badge session">Session</span>' : ''}
        <button class="delete" data-index="${index}">Delete</button>
      </div>
    </div>
    <div class="cookie-details">
      <span class="cookie-attribute">Domain: ${cookie.domain}</span>
      <span class="cookie-attribute">Path: ${cookie.path}</span>
      <span class="cookie-attribute">Expires: ${expiryText}</span>
    </div>
    <div class="cookie-value" title="Double-click to copy">
      ${cookie.value}
      <button class="copy-value" title="Copy value" data-value="${cookie.value}">📋</button>
      ${isEncodedValue(cookie.value) ? '<button class="decode-value" title="Decode value">🔍</button>' : ''}
    </div>
  `;
  
  return cookieItem;
}

// Function to check if a value appears to be encoded
function isEncodedValue(value) {
  // Check for URL encoding
  if (/%[0-9A-F]{2}/.test(value)) return true;
  
  // Check for Base64 encoding (basic check)
  if (/^[A-Za-z0-9+/]+=*$/.test(value) && value.length > 8) return true;
  
  // Check for JWT tokens
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) return true;
  
  return false;
}

// Add warnings for cookies that will expire soon
function addExpirationWarnings() {
  const now = Math.floor(Date.now() / 1000);
  const oneDayInSeconds = 24 * 60 * 60;
  
  siteCookies.forEach((cookie, index) => {
    if (cookie.expirationDate) {
      const timeLeft = cookie.expirationDate - now;
      
      const elements = document.querySelectorAll(`.cookie-item[data-index="${index}"] .cookie-details`);
      elements.forEach(element => {
        if (timeLeft <= 0) {
          // Cookie is expired
          const warning = document.createElement("div");
          warning.className = "cookie-warning expired";
          warning.textContent = "This cookie has expired!";
          element.appendChild(warning);
        } else if (timeLeft <= oneDayInSeconds) {
          // Cookie will expire within 24 hours
          const warning = document.createElement("div");
          warning.className = "cookie-warning expiring-soon";
          warning.textContent = "This cookie will expire soon";
          element.appendChild(warning);
        }
      });
    }
  });
}

// Setup checkbox functionality for cookie selection
function setupCookieCheckboxes() {
  const checkboxes = document.querySelectorAll(".cookie-select-checkbox");
  
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener("change", function() {
      const index = parseInt(this.dataset.index, 10);
      
      if (this.checked) {
        selectedCookies.add(index);
      } else {
        selectedCookies.delete(index);
      }
      
      updateBulkActionsBar();
    });
  });
  
  // Find and setup the select all checkbox
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function() {
      const isChecked = this.checked;
      
      checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        
        const index = parseInt(checkbox.dataset.index, 10);
        if (isChecked) {
          selectedCookies.add(index);
        } else {
          selectedCookies.delete(index);
        }
      });
      
      updateBulkActionsBar();
    });
  }
}

// Update the bulk actions bar based on selected cookies
function updateBulkActionsBar() {
  if (!bulkActionsBar) {
    bulkActionsBar = document.getElementById("bulkActions");
  }
  
  if (!bulkActionsBar) return;
  
  const selectedCount = selectedCookies.size;
  const selectedCountDisplay = document.getElementById("selectedCount");
  
  if (selectedCount > 0) {
    bulkActionsBar.style.display = "flex";
    if (selectedCountDisplay) {
      selectedCountDisplay.textContent = selectedCount;
    }
  } else {
    bulkActionsBar.style.display = "none";
  }
}

// Add copy functionality to cookie values
function addCopyButtonsToCookieValues() {
  // Add click listeners to copy buttons
  const copyButtons = document.querySelectorAll(".copy-value");
  copyButtons.forEach(button => {
    button.addEventListener("click", function(e) {
      e.stopPropagation();
      
      const value = this.dataset.value;
      navigator.clipboard.writeText(value)
        .then(() => {
          // Show success toast
          showToast("Cookie value copied to clipboard", "success", 2000);
          
          // Show success indicator on button
          const originalText = this.textContent;
          this.textContent = "✓";
          this.classList.add("copy-success");
          
          setTimeout(() => {
            this.textContent = originalText;
            this.classList.remove("copy-success");
          }, 1000);
        })
        .catch(err => {
          console.error("Could not copy text: ", err);
          showToast("Failed to copy to clipboard", "error");
        });
    });
  });
  
  // Also make the value container double-clickable for copying
  const valueContainers = document.querySelectorAll(".cookie-value");
  valueContainers.forEach(container => {
    container.addEventListener("dblclick", function(e) {
      // Don't trigger if clicking on a button
      if (e.target.tagName === "BUTTON") return;
      
      const value = this.textContent.trim();
      navigator.clipboard.writeText(value)
        .then(() => {
          // Show success toast
          showToast("Cookie value copied to clipboard", "success", 2000);
          
          // Add visual feedback with flash animation
          this.classList.add("copy-flash");
          setTimeout(() => {
            this.classList.remove("copy-flash");
          }, 500);
        })
        .catch(err => {
          console.error("Could not copy text: ", err);
          showToast("Failed to copy to clipboard", "error");
        });
    });
  });
}

// Setup decode buttons for encoded cookie values
function setupDecodeButtons() {
  const decodeButtons = document.querySelectorAll(".decode-value");
  
  decodeButtons.forEach(button => {
    button.addEventListener("click", function() {
      const valueContainer = this.parentElement;
      const encodedValue = valueContainer.textContent.trim();
      
      // Try different decoding methods
      let decodedValue = "";
      
      try {
        // First try URL decoding
        decodedValue = decodeURIComponent(encodedValue);
        
        // If that didn't change anything and it looks like base64, try that
        if (decodedValue === encodedValue && /^[A-Za-z0-9+/]+=*$/.test(encodedValue)) {
          const base64Decoded = atob(encodedValue);
          // Only use base64 result if it's printable
          if (/^[\x20-\x7E]*$/.test(base64Decoded)) {
            decodedValue = base64Decoded;
          }
        }
        
        // If it looks like a JWT token, decode its parts
        if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(encodedValue)) {
          const parts = encodedValue.split('.');
          try {
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));
            
            decodedValue = `JWT Token:
Header: ${JSON.stringify(header, null, 2)}
Payload: ${JSON.stringify(payload, null, 2)}`;
          } catch (jwtError) {
            console.error("Error decoding JWT:", jwtError);
          }
        }
        
        // Create and show decoded value
        const decodedContainer = document.createElement("div");
        decodedContainer.className = "decoded-value";
        decodedContainer.textContent = decodedValue;
        
        // Add close button
        const closeButton = document.createElement("button");
        closeButton.className = "close-decoded";
        closeButton.textContent = "×";
        closeButton.addEventListener("click", function() {
          valueContainer.removeChild(decodedContainer);
        });
        
        decodedContainer.prepend(closeButton);
        valueContainer.appendChild(decodedContainer);
        
      } catch (error) {
        console.error("Error decoding value:", error);
      }
    });
  });
}

// Render charts using Chart.js
function renderCharts() {
  // Clear existing charts first
  clearExistingCharts();
  
  // Charts data
  const purposeData = {
    labels: Object.keys(cookiesByPurpose).map(key => getPurposeDescription(key)),
    counts: Object.values(cookiesByPurpose).map(cookies => cookies.length)
  };
  
  const relationshipData = {
    labels: Object.keys(cookiesByRelationship).map(key => relationshipNames[key] || key),
    counts: Object.values(cookiesByRelationship).map(cookies => cookies.length)
  };
  
  // Purpose chart
  const purposeChartCanvas = document.getElementById("purposeChart");
  if (purposeChartCanvas) {
    const ctx = purposeChartCanvas.getContext("2d");
    
    window.chartInstances = window.chartInstances || {};
    window.chartInstances.purposeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: purposeData.labels,
        datasets: [{
          data: purposeData.counts,
          backgroundColor: [
            '#4caf50', // necessary
            '#2196f3', // preferences
            '#ff9800', // analytics
            '#f44336', // marketing
            '#9c27b0', // social
            '#607d8b'  // unknown
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: {
                size: 11
              }
            }
          },
          title: {
            display: true,
            text: 'Cookies by Purpose',
            font: {
              size: 14
            }
          }
        }
      }
    });
  }
  
  // Relationship chart
  const relationshipChartCanvas = document.getElementById("relationshipChart");
  if (relationshipChartCanvas) {
    const ctx = relationshipChartCanvas.getContext("2d");
    
    window.chartInstances = window.chartInstances || {};
    window.chartInstances.relationshipChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: relationshipData.labels,
        datasets: [{
          data: relationshipData.counts,
          backgroundColor: [
            '#4caf50', // primary
            '#2196f3', // secondary
            '#f44336'  // third-party
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: {
                size: 11
              }
            }
          },
          title: {
            display: true,
            text: 'Cookies by Relationship',
            font: {
              size: 14
            }
          }
        }
      }
    });
  }
}

// Purpose description helper
function getPurposeDescription(purpose) {
  return purposeNames[purpose] || purpose;
}

// Update the UI after processing cookies
function updateUI() {
  // Update cookie count in header
  const cookieCount = document.getElementById("cookieCount");
  if (cookieCount) {
    cookieCount.textContent = siteCookies.length;
  }
  
  // Update detailed statistics
  updateStats({
    total: siteCookies.length,
    byPurpose: Object.fromEntries(
      Object.entries(cookiesByPurpose).map(([key, value]) => [key, value.length])
    ),
    byRelationship: Object.fromEntries(
      Object.entries(cookiesByRelationship).map(([key, value]) => [key, value.length])
    )
  });
  
  // Enable tooltips if any
  if (typeof updateTooltips === "function") {
    updateTooltips();
  }
}

// Process and categorize cookies
function processCookies(cookies, domain) {
  // Process each cookie to categorize it
  const processed = cookies.map(cookie => {
    // Add relationship category (primary, secondary, third-party)
    const cookieDomain = cookie.domain.replace(/^\\./, "");
    let relationship = "thirdParty";
    
    if (cookieDomain === domain || cookie.domain === "." + domain) {
      relationship = "primary";
    } else if (cookieDomain.endsWith(domain) || domain.endsWith(cookieDomain)) {
      relationship = "secondary";
    }
    
    // Add purpose category based on name, domain, etc.
    let purpose = determineCookiePurpose(cookie);
    
    return { 
      ...cookie, 
      relationship, 
      purpose 
    };
  });
  
  // Store processed cookies
  siteCookies = processed;
  
  // Group cookies by categories
  cookiesByPurpose = groupCookiesByPurpose(processed);
  cookiesByRelationship = groupCookiesByRelationship(processed);
  
  return processed;
}

// Helper function to determine cookie purpose
function determineCookiePurpose(cookie) {
  const name = cookie.name.toLowerCase();
  const domain = cookie.domain.toLowerCase();
  
  // Necessary cookies patterns
  if (
    name.includes("csrf") ||
    name.includes("sessionid") ||
    name.includes("auth") ||
    name.includes("xsrf") ||
    name.includes("token") ||
    name.includes("logged_in") ||
    name.includes("security") ||
    name.includes("session") ||
    name === "sid" ||
    name === "phpsessid"
  ) {
    return "necessary";
  }
  
  // Preferences cookies patterns
  if (
    name.includes("theme") ||
    name.includes("color") ||
    name.includes("setting") ||
    name.includes("lang") ||
    name.includes("prefs") ||
    name.includes("local") ||
    name.includes("timezone")
  ) {
    return "preferences";
  }
  
  // Analytics cookies patterns
  if (
    name.includes("analytic") ||
    name.includes("stats") ||
    name.includes("metric") ||
    name.includes("_ga") ||
    name.includes("_gid") ||
    name.includes("hotjar") ||
    domain.includes("google-analytics") ||
    domain.includes("googletagmanager") ||
    name.includes("utma") ||
    name.includes("utmb") ||
    name.includes("utmc") ||
    name.includes("utmz")
  ) {
    return "analytics";
  }
  
  // Marketing cookies patterns
  if (
    name.includes("ad") ||
    name.includes("doubleclick") ||
    name.includes("campaign") ||
    name.includes("promotion") ||
    name.includes("marketing") ||
    name.includes("targeting") ||
    domain.includes("doubleclick") ||
    domain.includes("adservice") ||
    domain.includes("advertising")
  ) {
    return "marketing";
  }
  
  // Social media cookies patterns
  if (
    domain.includes("facebook") ||
    domain.includes("twitter") ||
    domain.includes("linkedin") ||
    domain.includes("youtube") ||
    domain.includes("instagram") ||
    name.includes("fb") ||
    name.includes("tw_") ||
    name.includes("pin_")
  ) {
    return "social";
  }
  
  // Default to unknown if no match
  return "unknown";
}

// Group cookies by purpose
function groupCookiesByPurpose(cookies) {
  const result = {};
  
  // Initialize all purpose categories to ensure they appear in UI even if empty
  Object.keys(purposeNames).forEach(purpose => {
    result[purpose] = [];
  });
  
  // Add cookies to their purpose groups
  cookies.forEach(cookie => {
    const purpose = cookie.purpose || "unknown";
    
    if (!result[purpose]) {
      result[purpose] = [];
    }
    
    result[purpose].push(cookie);
  });
  
  return result;
}

// Group cookies by relationship to domain
function groupCookiesByRelationship(cookies) {
  const result = {
    primary: [],
    secondary: [],
    thirdParty: []
  };
  
  // Add cookies to their relationship groups
  cookies.forEach(cookie => {
    const relationship = cookie.relationship || "thirdParty";
    
    if (!result[relationship]) {
      result[relationship] = [];
    }
    
    result[relationship].push(cookie);
  });
  
  return result;
}

// Clear existing charts before creating new ones
function clearExistingCharts() {
  if (window.chartInstances) {
    Object.keys(window.chartInstances).forEach(id => {
      if (window.chartInstances[id]) {
        try {
          window.chartInstances[id].destroy();
          console.log(`Destroyed chart: ${id}`);
        } catch (e) {
          console.error(`Error destroying chart ${id}:`, e);
        }
      }
    });
    window.chartInstances = {};
  }
}

// Initialize tabs function already implemented

// Setup tabs function
function setupTabs() {
  try {
    console.log("Setting up tabs");
    
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");
    
    if (!tabs || tabs.length === 0) {
      console.warn("No tabs found for setup");
      return;
    }
    
    console.log(`Found ${tabs.length} tabs`);
    
    // Add improved click handling for tabs
    tabs.forEach(tab => {
      tab.addEventListener("click", function() {
        // Visual feedback on click
        this.classList.add('tab-clicked');
        setTimeout(() => this.classList.remove('tab-clicked'), 200);
        
        // Get the target content ID
        const tabId = this.getAttribute("data-tab");
        
        if (!tabId) {
          console.error("Tab is missing data-tab attribute");
          return;
        }
        
        // Hide all tab contents with a smooth transition
        tabContents.forEach(content => {
          content.style.opacity = "0";
          setTimeout(() => {
            content.style.display = "none";
            content.classList.remove("active");
          }, 150);
        });
        
        // Remove active class from all tabs
        tabs.forEach(t => {
          t.classList.remove("active");
        });
        
        // Show the selected tab content with a smooth transition
        const selectedContent = document.getElementById(tabId);
        if (selectedContent) {
          setTimeout(() => {
            selectedContent.style.display = "block";
            selectedContent.classList.add("active");
            // Short delay before fading in for smoother transition
            setTimeout(() => {
              selectedContent.style.opacity = "1";
            }, 50);
          }, 150);
          
          this.classList.add("active");
        } else {
          console.error(`Tab content with id ${tabId} not found`);
        }
      });
    });
    
    // Set first tab as active by default if none is active
    if (!document.querySelector(".tab.active") && tabs[0]) {
      tabs[0].click();
    }
    
  } catch (e) {
    console.error("Error in setupTabs:", e);
  }
}

// Handle cookie scan response
function handleScanResponse(response) {
  console.log("Handling scan response:", response ? (response.success ? "success" : "failure") : "no response");
  
  // Get UI elements
  const loadingIndicator = document.getElementById("loadingIndicator");
  const noCookies = document.getElementById("noCookies");
  const statusMessage = document.getElementById("statusMessage");
  
  // Hide loading indicator regardless of response
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }
  
  // Handle errors or empty responses
  if (!response || !response.success) {
    console.error("Error scanning cookies:", response ? response.error : "No response received");
    
    if (response && response.error && statusMessage) {
      statusMessage.textContent = response.error;
      statusMessage.style.display = "block";
    } else if (statusMessage) {
      statusMessage.textContent = "Failed to scan cookies. Please try again.";
      statusMessage.style.display = "block";
    }
    
    // Show no cookies message
    if (noCookies) {
      noCookies.style.display = "block";
    }
    
    return;
  }
  
  // Process successful response
  console.log(`Received ${response.cookies ? response.cookies.length : 0} cookies`);
  
  // No cookies found
  if (!response.cookies || response.cookies.length === 0) {
    if (noCookies) {
      noCookies.style.display = "block";
    }
    return;
  }
  
  // Process and display cookies
  let domain;
  
  // Handle different domain sources in the response - ensure we always have a domain
  if (response.domain) {
    domain = response.domain;
  } else if (response.siteUrl) {
    try {
      domain = new URL(response.siteUrl).hostname;
    } catch (e) {
      console.error("Error parsing siteUrl:", e);
      domain = response.siteUrl; // Fallback to using siteUrl directly
    }
  } else {
    domain = siteUrl || "Unknown Site"; // Fallback to existing siteUrl or default
  }
  
  // Update global siteUrl
  siteUrl = domain;
  
  // Update site URL display
  const siteUrlDisplay = document.getElementById("siteUrl");
  if (siteUrlDisplay) {
    siteUrlDisplay.textContent = domain;
    console.log("Updated site URL display to:", domain);
  } else {
    console.error("Site URL display element not found");
  }
  
  // Process the cookies
  processCookies(response.cookies, domain);
  
  // Render the cookies in the UI
  renderCookies();
  
  // Render charts if charts tab exists
  if (document.getElementById("chartsTab")) {
    renderCharts();
  }
  
  // Setup additional UI interactions
  setupCookieCheckboxes();
  addCopyButtonsToCookieValues();
  setupDecodeButtons();
  addExpirationWarnings();
}

// Scan current site cookies function
function scanCurrentSiteCookies() {
  console.log("Scanning cookies for current site...");
  
  // Show loading indicator and hide error messages
  const loadingIndicator = document.getElementById("loadingIndicator");
  const statusMessage = document.getElementById("statusMessage");
  const noCookies = document.getElementById("noCookies");
  
  if (loadingIndicator) {
    loadingIndicator.style.display = "block";
  }
  
  if (statusMessage) {
    statusMessage.style.display = "none";
  }
  
  if (noCookies) {
    noCookies.style.display = "none";
  }
  
  // Get the active tab and load cookies for its domain
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || tabs.length === 0) {
      console.error("No active tabs found");
      showError("No active tab found. Please try again.");
      return;
    }
    
    const currentTab = tabs[0];
    const currentUrl = currentTab.url;
    
    // Check if URL is a chrome:// URL or other restricted URL
    if (currentUrl.startsWith("chrome://") || 
        currentUrl.startsWith("chrome-extension://") ||
        currentUrl.startsWith("about:") ||
        currentUrl === "newtab") {
      console.warn("Cannot access cookies on restricted page:", currentUrl);
      showError("Cannot scan cookies on this page. Please navigate to a website.");
      return;
    }
    
    try {
      // Parse the URL to get the domain
      const url = new URL(currentUrl);
      const domain = url.hostname;
      
      // Update site URL display immediately
      const siteUrlDisplay = document.getElementById("siteUrl");
      if (siteUrlDisplay) {
        siteUrlDisplay.textContent = domain;
        console.log("Set site URL display to:", domain);
      } else {
        console.error("Site URL display element not found");
      }
      
      // Set global siteUrl
      siteUrl = domain;
      
      // Request cookies for this domain
      chrome.runtime.sendMessage({
        action: "getCookiesForSite",
        url: currentUrl,
        domain: domain
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
          showError("Error communicating with background script: " + chrome.runtime.lastError.message);
          return;
        }
        handleScanResponse(response);
      });
    } catch (error) {
      console.error("Error parsing URL:", error);
      showError("Invalid URL. Please navigate to a website and try again.");
    }
  });
}

// Show error message
function showError(message) {
  console.error("Error:", message);
  
  // Hide loading indicator
  const loadingIndicator = document.getElementById("loadingIndicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }
  
  // Show toast notification instead of standard error
  showToast(message, "error");
  
  // Also update status message for accessibility
  const statusMessage = document.getElementById("statusMessage");
  if (statusMessage) {
    statusMessage.textContent = message;
    statusMessage.style.display = "block";
    // Automatically hide after 4 seconds
    setTimeout(() => {
      statusMessage.style.display = "none";
    }, 4000);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM content loaded, initializing extension...");
  
  // Store the bulk actions bar reference
  bulkActionsBar = document.getElementById("bulkActions");
  
  // Initialize tabs
  initializeTabs();
  
  // Setup category toggles for cookie groups
  setupCategoryToggles();
  
  // Setup tabs for navigation
  setupTabs();
  
  // Add helpful tooltips
  addHelpfulTooltips();
  
  // Add compact mode toggle
  addCompactModeToggle();
  
  // Enhance button feedback
  enhanceButtonFeedback();
  
  // Enhance settings menu - call this last to ensure proper initialization
  enhanceSettingsMenu();
  
  // Setup modal close buttons
  setupModalCloseHandlers();
  
  // Set up event listeners for buttons
  const refreshButton = document.getElementById("refreshButton");
  if (refreshButton) {
    // The enhanced button feedback now handles this
  }
  
  const exportButton = document.getElementById("exportButton");
  if (exportButton) {
    exportButton.addEventListener("click", exportCookies);
  }
  
  // Set up search functionality with enhanced UX
  const searchBox = document.getElementById("searchBox");
  if (searchBox) {
    // Create clear button
    const searchContainer = searchBox.parentElement;
    if (searchContainer && !searchContainer.querySelector('.clear-search')) {
      const clearButton = document.createElement('span');
      clearButton.className = 'clear-search';
      clearButton.innerHTML = '✕';
      clearButton.addEventListener('click', function() {
        searchBox.value = '';
        filterCookies('');
        searchBox.focus();
      });
      searchContainer.appendChild(clearButton);
    }
    
    // Add results count element if it doesn't exist
    const resultsCountContainer = document.getElementById('searchResultsContainer');
    if (!resultsCountContainer) {
      const countElement = document.createElement('div');
      countElement.id = 'searchResultsContainer';
      countElement.innerHTML = 'Found <span id="searchResultsCount">0</span> matching cookies';
      countElement.style.display = 'none';
      countElement.style.marginTop = '5px';
      countElement.style.fontSize = '12px';
      countElement.style.color = 'var(--text-color)';
      countElement.style.opacity = '0.8';
      
      if (searchContainer) {
        searchContainer.after(countElement);
      }
    }
    
    // Set up input events
    searchBox.addEventListener("input", function() {
      filterCookies(this.value);
    });
    
    // Handle Enter key
    searchBox.addEventListener("keyup", function(event) {
      if (event && event.key === "Enter") {
        filterCookies(this.value);
      }
    });
  }
  
  // Initialize comparison functionality if available
  if (typeof window.safeComparisonManager !== "undefined" && 
      typeof window.safeComparisonManager.init === "function") {
    window.safeComparisonManager.init();
  }
  
  // Initialize auto-refresh functionality if available
  if (typeof window.autoRefresh !== "undefined" && 
      typeof window.autoRefresh.init === "function") {
    window.autoRefresh.init();
  }
  
  // Setup dark mode toggle
  setupDarkModeToggle();
  
  // Load cookies on startup
  loadCookies();
});

// Setup handlers for closing modals
function setupModalCloseHandlers() {
  // Tutorial modal close handlers
  const tutorialModal = document.getElementById("tutorialModal");
  const closeTutorial = document.getElementById("closeTutorial");
  const finishTutorial = document.getElementById("finishTutorial");
  
  if (tutorialModal) {
    // Close tutorial when clicking the X button
    if (closeTutorial) {
      closeTutorial.addEventListener("click", function() {
        tutorialModal.style.display = "none";
      });
    }
    
    // Close tutorial when clicking the finish button
    if (finishTutorial) {
      finishTutorial.addEventListener("click", function() {
        tutorialModal.style.display = "none";
        showToast("Tutorial completed", "success");
      });
    }
    
    // Close when clicking outside the modal content
    tutorialModal.addEventListener("click", function(e) {
      if (e.target === tutorialModal) {
        tutorialModal.style.display = "none";
      }
    });
  }
  
  // Settings modal close handlers
  const settingsModal = document.getElementById("settingsModal");
  const closeSettings = document.getElementById("closeSettings");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  
  if (settingsModal) {
    // Close settings when clicking the X button
    if (closeSettings) {
      closeSettings.addEventListener("click", function() {
        settingsModal.style.display = "none";
      });
    }
    
    // Close settings when clicking the save button
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener("click", function() {
        // Here you would save settings
        settingsModal.style.display = "none";
        showToast("Settings saved", "success");
      });
    }
    
    // Close when clicking outside the modal content
    settingsModal.addEventListener("click", function(e) {
      if (e.target === settingsModal) {
        settingsModal.style.display = "none";
      }
    });
  }
}

// Function to filter cookies by search term
function filterCookies(searchTerm) {
  const searchContainer = document.querySelector('.search-container');
  
  if (!searchTerm || searchTerm.trim() === '') {
    // If search term is empty, show all cookies
    document.querySelectorAll(".cookie-item").forEach(item => {
      item.style.display = "block";
    });
    
    // Remove has-value class from search container
    if (searchContainer) {
      searchContainer.classList.remove('has-value');
    }
    
    return;
  }
  
  // Add has-value class to search container
  if (searchContainer) {
    searchContainer.classList.add('has-value');
  }
  
  searchTerm = searchTerm.toLowerCase().trim();
  let matchCount = 0;
  
  // Filter cookies based on search term
  document.querySelectorAll(".cookie-item").forEach(item => {
    const cookieName = item.querySelector(".cookie-name").textContent.toLowerCase();
    const cookieValue = item.querySelector(".cookie-value").textContent.toLowerCase();
    const cookieDetails = item.querySelector(".cookie-details").textContent.toLowerCase();
    
    if (cookieName.includes(searchTerm) || 
        cookieValue.includes(searchTerm) || 
        cookieDetails.includes(searchTerm)) {
      item.style.display = "block";
      // Highlight the matching text
      highlightMatchingText(item, searchTerm);
      matchCount++;
    } else {
      item.style.display = "none";
      // Remove any previous highlights
      removeHighlights(item);
    }
  });
  
  // Update the search results count
  const resultsCount = document.getElementById('searchResultsCount');
  if (resultsCount) {
    resultsCount.textContent = matchCount;
    resultsCount.parentElement.style.display = matchCount > 0 ? 'block' : 'none';
  }
}

// Helper function to highlight matching text
function highlightMatchingText(cookieItem, searchTerm) {
  // Remove any previous highlights first
  removeHighlights(cookieItem);
  
  // Text elements to search in
  const textElements = [
    cookieItem.querySelector(".cookie-name"),
    cookieItem.querySelector(".cookie-value"),
    cookieItem.querySelector(".cookie-details")
  ];
  
  textElements.forEach(element => {
    if (!element) return;
    
    const originalText = element.textContent;
    const lowerText = originalText.toLowerCase();
    let lastIndex = 0;
    let newHtml = '';
    
    // Find all instances of the search term
    while ((lastIndex = lowerText.indexOf(searchTerm, lastIndex)) !== -1) {
      // Add text before the match
      newHtml += originalText.substring(newHtml.length === 0 ? 0 : lastIndex + searchTerm.length, lastIndex);
      
      // Add the highlighted match
      newHtml += `<span class="search-highlight">${originalText.substring(lastIndex, lastIndex + searchTerm.length)}</span>`;
      
      lastIndex += searchTerm.length;
    }
    
    // Add any remaining text
    if (newHtml) {
      newHtml += originalText.substring(lastIndex);
      element.innerHTML = newHtml;
    }
  });
}

// Helper function to remove highlights
function removeHighlights(cookieItem) {
  const highlightElements = cookieItem.querySelectorAll(".search-highlight");
  highlightElements.forEach(el => {
    const parent = el.parentNode;
    parent.replaceChild(document.createTextNode(el.textContent), el);
    parent.normalize();
  });
}

// Export cookies to a file
function exportCookies() {
  if (!siteCookies || siteCookies.length === 0) {
    alert("No cookies to export.");
    return;
  }
  
  // Create export data
  const exportData = {
    timestamp: new Date().toISOString(),
    site: siteUrl,
    cookies: siteCookies
  };
  
  // Convert to JSON
  const jsonData = JSON.stringify(exportData, null, 2);
  
  // Create a Blob with the data
  const blob = new Blob([jsonData], { type: "application/json" });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cookies_${siteUrl.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.json`;
  
  // Trigger the download
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

// Setup category toggles for expandable/collapsible sections
function setupCategoryToggles() {
  console.log("Setting up category toggles with improved animations");
  // Get all category headers
  document.querySelectorAll(".category-header").forEach(header => {
    // Initialize aria attributes for accessibility
    header.setAttribute('tabindex', '0');
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
    
    header.addEventListener("click", function(e) {
      // Don't toggle if clicking on a button inside the header
      if (e.target.tagName === "BUTTON") return;
      
      const cookies = this.nextElementSibling;
      if (cookies && cookies.classList.contains("category-cookies")) {
        // Toggle the open class for animation
        cookies.classList.toggle("open");
        
        // Update aria-expanded for accessibility
        const isOpen = cookies.classList.contains("open");
        this.setAttribute('aria-expanded', isOpen.toString());
        
        // Add visual feedback
        this.classList.add('clicked');
        setTimeout(() => this.classList.remove('clicked'), 300);
      }
    });
    
    // Add keyboard accessibility
    header.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
}

// Add updateTooltips function near line 547
function updateTooltips() {
  console.log("Updating tooltips");
  
  // Add tooltips to purpose badges
  const purposeBadges = document.querySelectorAll(".purpose-item");
  purposeBadges.forEach(badge => {
    const purpose = badge.classList[1]; // Get the second class which should be the purpose
    if (purpose) {
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      
      let description = "";
      switch (purpose) {
        case "necessary":
          description = "Essential for website functionality. Without these, the site may not work properly.";
          break;
        case "preferences":
          description = "Store your site preferences, like language or theme choices.";
          break;
        case "analytics":
          description = "Track how users interact with the site to improve the experience.";
          break;
        case "marketing":
          description = "Used for advertising and marketing purposes to show targeted content.";
          break;
        case "social":
          description = "Enable social media features like sharing or comment sections.";
          break;
        case "unknown":
          description = "Purpose couldn't be automatically determined.";
          break;
      }
      
      tooltip.textContent = description;
      badge.querySelector(".category-header").appendChild(tooltip);
    }
  });
}

// Make sure initializeTabs function is present and implemented
function initializeTabs() {
  try {
    // First check if we're using the new tab navigation structure
    const tabCategories = document.querySelectorAll(".category-tabs .tab");
    if (tabCategories && tabCategories.length > 0) {
      console.log(`Found ${tabCategories.length} category tabs`);
      
      // Set up the new tab structure
      tabCategories.forEach(tab => {
        tab.addEventListener("click", function() {
          const tabId = this.getAttribute("data-tab");
          if (!tabId) {
            console.error("Tab missing data-tab attribute");
            return;
          }
          
          // Update current tab display
          const currentTabName = document.getElementById("currentTabName");
          if (currentTabName) {
            currentTabName.textContent = this.textContent.trim();
          }
          
          // Update active states
          document.querySelectorAll(".category-tabs .tab").forEach(t => {
            t.classList.remove("active");
          });
          this.classList.add("active");
          
          // Show the selected content
          document.querySelectorAll(".tab-content").forEach(content => {
            content.style.display = "none";
          });
          
          const selectedContent = document.getElementById(tabId);
          if (selectedContent) {
            selectedContent.style.display = "block";
          } else {
            console.error(`Tab content with id ${tabId} not found`);
          }
        });
      });
      
      // Set first tab as active by default if none is active
      if (!document.querySelector(".category-tabs .tab.active") && tabCategories[0]) {
        tabCategories[0].click();
      }
      
      return; // Exit early, we've set up the new tab structure
    }
    
    // Check for the simpler tab structure
    const simpleTabs = document.querySelectorAll(".tab");
    if (simpleTabs && simpleTabs.length > 0) {
      console.log(`Found ${simpleTabs.length} simple tabs`);
      
      simpleTabs.forEach(tab => {
        tab.addEventListener("click", function() {
          const tabId = this.getAttribute("data-tab");
          if (!tabId) {
            console.error("Tab missing data-tab attribute");
            return;
          }
          
          // Hide all tab contents
          document.querySelectorAll(".tab-content").forEach(content => {
            content.style.display = "none";
          });
          
          // Remove active class from all tabs
          simpleTabs.forEach(t => {
            t.classList.remove("active");
          });
          
          // Show selected tab
          const selectedTab = document.getElementById(tabId);
          if (selectedTab) {
            selectedTab.style.display = "block";
          } else {
            console.error(`Tab content with id ${tabId} not found`);
          }
          
          // Set active class on selected tab
          this.classList.add("active");
        });
      });
      
      // Set first tab as active by default if none is active
      if (!document.querySelector(".tab.active") && simpleTabs[0]) {
        simpleTabs[0].click();
      }
      
      return;
    }
    
    console.log("No tab structure found that matches known patterns");
  } catch (e) {
    console.error("Error in initializeTabs:", e);
  }
}

// Setup dark mode toggle functionality
function setupDarkModeToggle() {
  console.log("Setting up dark mode toggle");
  const themeToggle = document.getElementById("themeToggle");
  
  if (themeToggle) {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem("theme");
    let currentTheme = savedTheme;
    
    // If no saved preference, check system preference
    if (!currentTheme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      currentTheme = prefersDark ? "dark" : "light";
    }
    
    // Apply theme
    applyTheme(currentTheme);
    
    // Add click listener for toggle
    themeToggle.addEventListener("click", function() {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      
      applyTheme(newTheme);
      
      // Save preference
      localStorage.setItem("theme", newTheme);
      
      console.log(`Theme changed to ${newTheme} mode`);
    });
    
    console.log("Dark mode toggle setup complete");
  } else {
    console.error("Theme toggle element not found");
  }
}

// Helper function to apply theme to document
function applyTheme(theme) {
  console.log("Applying theme:", theme);
  // Set on html element
  document.documentElement.setAttribute("data-theme", theme);
  
  // Add/remove class for additional styling if needed
  if (theme === "dark") {
    document.documentElement.classList.add("dark-theme");
    document.body.classList.add("dark-theme");
  } else {
    document.documentElement.classList.remove("dark-theme");
    document.body.classList.remove("dark-theme");
  }
}

// Add tooltips to help users understand the interface
function addHelpfulTooltips() {
  console.log("Adding helpful tooltips");
  
  // Define elements that need tooltips
  const tooltips = [
    {
      selector: '#totalCookies',
      text: 'Total number of cookies found on this site',
      position: 'top'
    },
    {
      selector: '.necessary',
      text: 'Essential cookies required for the website to function properly',
      position: 'top'
    },
    {
      selector: '.preferences',
      text: 'Cookies that store your preferences and settings',
      position: 'top'
    },
    {
      selector: '.analytics',
      text: 'Cookies used to collect data about your browsing behavior',
      position: 'top'
    },
    {
      selector: '.marketing',
      text: 'Cookies used for advertising and marketing purposes',
      position: 'top'
    },
    {
      selector: '.social',
      text: 'Cookies from social media platforms and sharing tools',
      position: 'top'
    },
    {
      selector: '.unknown',
      text: 'Cookies whose purpose could not be determined automatically',
      position: 'top'
    },
    {
      selector: '#exportButton',
      text: 'Export cookie data in JSON format',
      position: 'bottom'
    },
    {
      selector: '#refreshButton',
      text: 'Rescan the page for updated cookie information',
      position: 'bottom'
    }
  ];
  
  // Create and append tooltips
  tooltips.forEach(tooltip => {
    const elements = document.querySelectorAll(tooltip.selector);
    
    elements.forEach(element => {
      // Skip if element already has a tooltip container
      if (element.parentNode.classList.contains('tooltip-container')) {
        return;
      }
      
      // Create tooltip container
      const container = document.createElement('div');
      container.className = 'tooltip-container';
      
      // Replace element with the container
      element.parentNode.insertBefore(container, element);
      container.appendChild(element);
      
      // Create tooltip trigger
      const trigger = document.createElement('span');
      trigger.className = 'tooltip-trigger';
      trigger.textContent = 'ⓘ';
      container.appendChild(trigger);
      
      // Create tooltip content
      const content = document.createElement('div');
      content.className = 'tooltip-content';
      content.textContent = tooltip.text;
      if (tooltip.position) {
        content.classList.add(`tooltip-${tooltip.position}`);
      }
      container.appendChild(content);
    });
  });
}

// Add compact mode toggle to settings menu
function addCompactModeToggle() {
  console.log("Adding compact mode toggle");
  
  const settingsMenu = document.getElementById("settingsMenu");
  if (!settingsMenu) {
    console.warn("Settings menu not found for compact mode toggle");
    return;
  }
  
  // Create compact mode toggle item
  const compactModeItem = document.createElement("div");
  compactModeItem.className = "settings-menu-item";
  compactModeItem.id = "compactModeToggle";
  
  // Force disable compact mode initially to ensure proper display size
  localStorage.setItem("compactMode", "false");
  document.body.classList.remove("compact-mode");
  compactModeItem.textContent = "Enable Compact Mode";
  
  // Add click handler
  compactModeItem.addEventListener("click", function() {
    const isNowCompact = document.body.classList.toggle("compact-mode");
    localStorage.setItem("compactMode", isNowCompact.toString());
    this.textContent = isNowCompact ? "Disable Compact Mode" : "Enable Compact Mode";
    
    // Show toast notification
    showToast(isNowCompact ? "Compact mode enabled" : "Compact mode disabled", "info", 2000);
  });
  
  // Add to menu, right after the show tutorial option
  const tutorialBtn = document.getElementById("showTutorialBtn");
  if (tutorialBtn) {
    settingsMenu.insertBefore(compactModeItem, tutorialBtn.nextSibling);
  } else {
    settingsMenu.appendChild(compactModeItem);
  }
}

// Enhance refresh button with better feedback
function enhanceButtonFeedback() {
  console.log("Enhancing button feedback");
  
  // Enhance the refresh button
  const refreshButton = document.getElementById("refreshButton");
  if (refreshButton) {
    const originalText = refreshButton.textContent;
    refreshButton.addEventListener("click", function() {
      // Don't proceed if already loading
      if (this.disabled) return;
      
      // Show loading state
      this.innerHTML = '<div class="loading-spinner" style="display:inline-block;margin-right:6px;"></div> Scanning...';
      this.disabled = true;
      
      // Call the original function
      loadCookies();
      
      // Reset after a reasonable timeout
      setTimeout(() => {
        this.innerHTML = originalText;
        this.disabled = false;
      }, 2000);
    }, { once: false });
  }
  
  // Add ripple effect to all buttons
  document.querySelectorAll("button").forEach(button => {
    if (!button.classList.contains("has-ripple")) {
      button.classList.add("has-ripple");
      
      button.addEventListener("click", function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement("span");
        ripple.className = "ripple";
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        this.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    }
  });
}

// Function to enhance the settings menu with animations
function enhanceSettingsMenu() {
  console.log("Enhancing settings menu");
  
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsMenu = document.getElementById("settingsMenu");
  
  if (!settingsBtn || !settingsMenu) {
    console.warn("Settings elements not found");
    return;
  }
  
  // Make sure we're using display none initially
  settingsMenu.style.display = "none";
  
  // Simple direct toggle approach
  settingsBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    
    // Toggle menu visibility
    const isVisible = settingsMenu.style.display === "block";
    settingsMenu.style.display = isVisible ? "none" : "block";
    settingsBtn.setAttribute("aria-expanded", (!isVisible).toString());
    
    // Only add outside click listener if menu is now visible
    if (!isVisible) {
      setTimeout(() => {
        document.addEventListener("click", function closeMenu(event) {
          if (!settingsMenu.contains(event.target) && event.target !== settingsBtn) {
            settingsMenu.style.display = "none";
            settingsBtn.setAttribute("aria-expanded", "false");
            document.removeEventListener("click", closeMenu);
          }
        });
      }, 10);
    }
  });
  
  // Add keyboard support
  settingsBtn.setAttribute("aria-controls", "settingsMenu");
  settingsBtn.setAttribute("aria-expanded", "false");
  settingsBtn.setAttribute("role", "button");
  settingsBtn.setAttribute("tabindex", "0");
  
  settingsBtn.addEventListener("keydown", function(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.click();
    } else if (e.key === "Escape" && settingsMenu.style.display === "block") {
      settingsMenu.style.display = "none";
      this.setAttribute("aria-expanded", "false");
    }
  });
  
  // Add specific handlers for menu items
  const showTutorialBtn = document.getElementById("showTutorialBtn");
  if (showTutorialBtn) {
    showTutorialBtn.addEventListener("click", function() {
      // Hide settings menu
      settingsMenu.style.display = "none";
      settingsBtn.setAttribute("aria-expanded", "false");
      
      // Show tutorial modal
      const tutorialModal = document.getElementById("tutorialModal");
      if (tutorialModal) {
        tutorialModal.style.display = "block";
      }
      
      // Show success toast
      showToast("Tutorial opened", "info");
    });
  }
  
  const openSettingsBtn = document.getElementById("openSettingsBtn");
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener("click", function() {
      // Hide settings menu
      settingsMenu.style.display = "none";
      settingsBtn.setAttribute("aria-expanded", "false");
      
      // Show settings modal
      const settingsModal = document.getElementById("settingsModal");
      if (settingsModal) {
        settingsModal.style.display = "block";
      }
      
      // Show success toast
      showToast("Settings opened", "info");
    });
  }
  
  // Make menu items accessible
  const menuItems = settingsMenu.querySelectorAll(".settings-menu-item");
  menuItems.forEach((item, index) => {
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "menuitem");
    
    item.addEventListener("keydown", function(e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.click();
      } else if (e.key === "Escape") {
        settingsMenu.style.display = "none";
        settingsBtn.setAttribute("aria-expanded", "false");
        settingsBtn.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextItem = menuItems[index + 1] || menuItems[0];
        nextItem.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevItem = menuItems[index - 1] || menuItems[menuItems.length - 1];
        prevItem.focus();
      }
    });
  });
}

// Toast notification system
function showToast(message, type = "info", duration = 4000) {
  console.log(`Showing toast: ${message} (${type})`);
  
  // Create toast container if it doesn't exist
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  
  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  // Create icon
  let icon = "";
  switch (type) {
    case "success": icon = "✓"; break;
    case "warning": icon = "⚠"; break;
    case "error": icon = "✕"; break;
    default: icon = "ℹ"; break;
  }
  
  // Create toast content
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${message}</div>
    <div class="toast-close">✕</div>
  `;
  
  // Add to container
  container.appendChild(toast);
  
  // Setup close button
  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.addEventListener("click", () => {
    toast.style.animation = "toast-in-right 0.3s reverse forwards";
    setTimeout(() => {
      container.removeChild(toast);
      // Remove container if empty
      if (container.children.length === 0) {
        document.body.removeChild(container);
      }
    }, 300);
  });
  
  // Auto remove after duration
  setTimeout(() => {
    // Only remove if the toast still exists
    if (document.body.contains(toast)) {
      toast.style.animation = "toast-in-right 0.3s reverse forwards";
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
          // Remove container if empty
          if (container.children.length === 0) {
            document.body.removeChild(container);
          }
        }
      }, 300);
    }
  }, duration);
  
  // Make toast accessible
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  
  return toast;
}

// Update the loadCookies function to show a success message
let originalLoadCookies = loadCookies;
loadCookies = function() {
  originalLoadCookies();
  
  // Show a toast when scan starts
  showToast("Scanning cookies...", "info");
};

// Update handleScanResponse to show a success message
let originalHandleScanResponse = handleScanResponse;
handleScanResponse = function(response) {
  originalHandleScanResponse(response);
  
  if (response && response.success) {
    const count = response.cookies ? response.cookies.length : 0;
    showToast(`Found ${count} cookies on this site`, "success");
  }
};
