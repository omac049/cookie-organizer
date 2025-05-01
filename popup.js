// Cookie Organizer Popup Script
/* global Chart */

// Initialize critical global variables first
window.safeComparisonManager = {
  formatDate: function (timestamp) {
    if (!timestamp) return "Session cookie";
    return new Date(timestamp * 1000).toLocaleString();
  },
  snapshots: [],
  selectedSnapshots: [],
  init: function () {
    console.log("Safe comparison manager initialized");

    // Get DOM elements
    const takeSnapshotBtn = document.getElementById("takeSnapshotBtn");
    const clearSnapshotsBtn = document.getElementById("clearSnapshotsBtn");
    const snapshotsList = document.getElementById("snapshotsList");
    const compareTypeFilter = document.getElementById("compareTypeFilter");

    // Load previously saved snapshots
    this.loadSnapshots();

    // Event listeners
    if (takeSnapshotBtn) {
      takeSnapshotBtn.addEventListener("click", () => this.takeSnapshot());
    }

    if (clearSnapshotsBtn) {
      clearSnapshotsBtn.addEventListener("click", () => this.clearSnapshots());
    }

    if (compareTypeFilter) {
      compareTypeFilter.addEventListener("change", () => {
        if (this.selectedSnapshots.length === 2) {
          this.compareSnapshots(
            this.selectedSnapshots[0],
            this.selectedSnapshots[1],
            compareTypeFilter.value,
          );
        }
      });
    }

    // Initial render
    this.renderSnapshotsList();
  },
  loadSnapshots: function () {
    try {
      console.log("Loading saved snapshots");
      const savedSnapshots = localStorage.getItem("cookieOrganizerSnapshots");
      if (savedSnapshots) {
        this.snapshots = JSON.parse(savedSnapshots);
        console.log(`Loaded ${this.snapshots.length} snapshots`);
      } else {
        console.log("No saved snapshots found");
        this.snapshots = [];
      }
    } catch (error) {
      console.error("Error loading snapshots:", error);
      this.snapshots = [];
    }
  },
  saveSnapshots: function () {
    try {
      localStorage.setItem(
        "cookieOrganizerSnapshots",
        JSON.stringify(this.snapshots),
      );
    } catch (error) {
      console.error("Error saving snapshots:", error);
    }
  },
  renderSnapshotsList: function () {
    console.log("Rendering snapshots list");
  },
  selectSnapshot: function () {},
  deselectSnapshot: function () {},
  compareSnapshots: function () {},
  takeSnapshot: function () {},
  clearSnapshots: function () {},
};

// Initialize autoRefresh once
window.autoRefresh = {
  init: function () {
    console.log("Auto-refresh initialized");
  },
  start: function (interval) {
    console.log(`Starting auto-refresh with interval: ${interval} seconds`);
    // Call the global startAutoRefresh function if it exists
    if (typeof window.startAutoRefresh === "function") {
      window.startAutoRefresh(interval);
    }
  },
  stop: function () {
    console.log("Stopping auto-refresh");
    // Call the global stopAutoRefresh function if it exists
    if (typeof window.stopAutoRefresh === "function") {
      window.stopAutoRefresh();
    }
  },
};
window.autoRefreshInterval = null;

// Define global startAutoRefresh and stopAutoRefresh functions
window.startAutoRefresh = function(interval) {
  console.log(`Starting auto-refresh with interval: ${interval} seconds`);

  // Clear any existing interval
  if (window.autoRefreshInterval) {
    clearInterval(window.autoRefreshInterval);
  }

  // Set up new interval
  window.autoRefreshInterval = setInterval(() => {
    console.log("Auto-refreshing cookies...");
    if (typeof loadCookies === "function") {
      loadCookies();
    }
    if (typeof scanCurrentSiteCookies === "function") {
      scanCurrentSiteCookies();
    }
  }, interval * 1000);
};

window.stopAutoRefresh = function() {
  if (window.autoRefreshInterval) {
    clearInterval(window.autoRefreshInterval);
    window.autoRefreshInterval = null;
  }
};

// Define critical variables at the very beginning of the file
const relationshipNames = {
  primary: "Primary/First-Party",
  secondary: "Secondary",
  thirdParty: "Third-Party",
};

// Define purpose description function at root level
function getPurposeDescription(purpose) {
  return purposeNames[purpose] || purpose;
}

// Add purpose category names
const purposeNames = {
  necessary: "Necessary",
  preferences: "Preferences",
  analytics: "Analytics",
  marketing: "Marketing",
  social: "Social Media",
  unknown: "Unknown",
};

// Define global variables for selection and UI elements
let selectedCookies = new Set();
let bulkActionsBar;

// Initialize these variables in the DOMContentLoaded event
document.addEventListener("DOMContentLoaded", function () {
  bulkActionsBar = document.getElementById("bulkActions");
});

// Initialize autoRefresh once
window.autoRefresh = {
  init: function () {
    console.log("Auto-refresh initialized");
  },
  start: function (interval) {
    console.log(`Starting auto-refresh with interval: ${interval} seconds`);
    // Call the global startAutoRefresh function if it exists
    if (typeof window.startAutoRefresh === "function") {
      window.startAutoRefresh(interval);
    }
  },
  stop: function () {
    console.log("Stopping auto-refresh");
    // Call the global stopAutoRefresh function if it exists
    if (typeof window.stopAutoRefresh === "function") {
      window.stopAutoRefresh();
    }
  },
};
window.autoRefreshInterval = null;

// Initialize global objects that might be referenced before declaration
window.autoRefresh = window.autoRefresh || {};

// Define initializeTheme function at the beginning
function initializeTheme() {
  try {
    const savedTheme = localStorage.getItem("cookieOrganizerTheme");

    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
      if (typeof updateThemeIcon === "function") {
        updateThemeIcon(savedTheme);
      }
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.documentElement.setAttribute("data-theme", "dark");
      if (typeof updateThemeIcon === "function") {
        updateThemeIcon("dark");
      }
    }
  } catch (error) {
    console.error("Error initializing theme:", error);
  }
}

// Define updateThemeIcon function
function updateThemeIcon(theme) {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return; // Early return if element doesn't exist

  const toggleIcon = themeToggle.querySelector(".toggle-icon");
  if (!toggleIcon) return; // Early return if icon element doesn't exist

  toggleIcon.textContent = theme === "dark" ? "☀️" : "🌙";
}

// Define scanCurrentSiteCookies function at the very top of the file, before any event listeners
function scanCurrentSiteCookies() {
  console.log("Scanning current site cookies...");

  // Return a Promise that resolves when cookies are loaded
  return new Promise((resolve, reject) => {
    // Show loading indicator if it exists
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) {
      loadingIndicator.style.display = "block";
    }

    // Get the currently active tab via Chrome API
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      function (tabs) {
        if (!tabs || !tabs[0]) {
          console.error("No active tab found");
          if (loadingIndicator) loadingIndicator.style.display = "none";

          // Display error message to user
          const errorMsg = document.createElement("div");
          errorMsg.className = "error-message";
          errorMsg.textContent = "Unable to get active tab information.";
          document.body.appendChild(errorMsg);
          reject(new Error("No active tab found"));
          return;
        }

        const currentTab = tabs[0];
        siteUrl = currentTab.url;

        console.log("Getting cookies for URL:", siteUrl);

        // Send the actual URL to the background script
        chrome.runtime.sendMessage(
          {
            action: "scanCurrentSiteCookies",
            url: siteUrl,
          },
          function (response) {
            if (chrome.runtime.lastError) {
              console.error("Error getting cookies:", chrome.runtime.lastError);
              if (loadingIndicator) loadingIndicator.style.display = "none";

              // Display error message to user
              const errorMsg = document.createElement("div");
              errorMsg.className = "error-message";
              errorMsg.textContent =
                "Error communicating with the background script: " +
                chrome.runtime.lastError.message;
              document.body.appendChild(errorMsg);
              reject(chrome.runtime.lastError);
              return;
            }

            if (!response) {
              console.error("No response from background script");
              if (loadingIndicator) loadingIndicator.style.display = "none";

              // Display error message to user
              const errorMsg = document.createElement("div");
              errorMsg.className = "error-message";
              errorMsg.textContent =
                "No response from background script. Please check the extension permissions.";
              document.body.appendChild(errorMsg);
              reject(new Error("No response from background script"));
              return;
            }

            if (!response.success) {
              console.error("Error from background script:", response.error);
              if (loadingIndicator) loadingIndicator.style.display = "none";

              // Display error message to user
              const errorMsg = document.createElement("div");
              errorMsg.className = "error-message";
              errorMsg.textContent =
                "Error scanning cookies: " +
                (response.error || "Unknown error");
              document.body.appendChild(errorMsg);
              reject(new Error(response.error || "Unknown error"));
              return;
            }

            console.log(
              "Received cookies:",
              response.cookies ? response.cookies.length : 0,
            );

            // Store cookies and update UI
            siteCookies = response.cookies || [];
            cookiesByPurpose = response.cookiesByPurpose || {};
            cookiesByRelationship = response.cookiesByRelationship || {};

            // Update statistics with comprehensive stats
            if (response.stats && typeof updateStats === "function") {
              updateStats(response.stats);
            }

            // Render cookies in the UI
            if (typeof renderCookies === "function") {
              renderCookies();
            }

            // Hide loading indicator
            if (loadingIndicator) loadingIndicator.style.display = "none";

            // Add expiration warnings if applicable
            if (typeof addExpirationWarnings === "function") {
              addExpirationWarnings();
            }

            // Set up cookie checkbox functionality
            if (typeof setupCookieCheckboxes === "function") {
              setupCookieCheckboxes();
            }

            // Add copy buttons to cookie values
            if (typeof addCopyButtonsToCookieValues === "function") {
              addCopyButtonsToCookieValues();
            }

            // Set up decode buttons for encoded values
            if (typeof setupDecodeButtons === "function") {
              setupDecodeButtons();
            }

            // Resolve the promise with the cookies
            resolve(siteCookies);
          },
        );
      },
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // UI Elements
  const refreshButton = document.getElementById("refreshButton");
  const exportButton = document.getElementById("exportButton");
  const totalCookiesEl = document.getElementById("totalCookies");
  const primaryCountEl = document.getElementById("primaryCount");
  const thirdPartyCountEl = document.getElementById("thirdPartyCount");
  const siteUrlEl = document.getElementById("siteUrl");
  const searchBox = document.getElementById("searchBox");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const noCookies = document.getElementById("noCookies");
  const byPurposeTab = document.getElementById("byPurposeTab");
  const byRelationshipTab = document.getElementById("byRelationshipTab");
  const allCookiesTab = document.getElementById("allCookiesTab");
  const chartsTab = document.getElementById("chartsTab");
  const eduDomainHelp = document.getElementById("eduDomainHelp");
  const themeToggle = document.getElementById("themeToggle");
  const filterToggle = document.getElementById("filterToggle");
  const advancedFilters = document.getElementById("advancedFilters");
  const resetFiltersBtn = document.getElementById("resetFilters");

  // Bulk management elements
  const bulkActionsBar = document.getElementById("bulkActions");
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const selectedCountDisplay = document.getElementById("selectedCount");
  const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
  const selectVisibleBtn = document.getElementById("selectVisibleBtn");
  const deselectAllBtn = document.getElementById("deselectAllBtn");

  // Chart canvases
  const purposeChartCanvas = document.getElementById("purposeChart");
  const relationshipChartCanvas = document.getElementById("relationshipChart");
  const securityChartCanvas = document.getElementById("securityChart");
  const sessionChartCanvas = document.getElementById("sessionChart");

  // Chart instances
  let purposeChart = null;
  let relationshipChart = null;
  let securityChart = null;
  let sessionChart = null;

  // Create Set for selected cookies early
  let selectedCookies = new Set();

  // Tutorial manager for onboarding experience - defining it early to avoid reference errors
  const tutorialManager = {
    init: function () {
      // Check if this is the first run
      chrome.storage.local.get("tutorialComplete", (result) => {
        if (!result.tutorialComplete) {
          this.startTutorial();
        }
      });
    },

    startTutorial: function () {
      console.log("Starting tutorial...");

      // Create tutorial overlay container if it doesn't exist
      let tutorialOverlay = document.getElementById("tutorialOverlay");
      if (!tutorialOverlay) {
        tutorialOverlay = document.createElement("div");
        tutorialOverlay.id = "tutorialOverlay";
        tutorialOverlay.className = "tutorial-overlay";
        document.body.appendChild(tutorialOverlay);

        // Add CSS for tutorial overlay
        const style = document.createElement("style");
        style.textContent = `
          .tutorial-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0.7);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .tutorial-content {
            background-color: var(--card-bg);
            color: var(--text-color);
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          .tutorial-step {
            display: none;
          }
          .tutorial-step.active {
            display: block;
          }
          .tutorial-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
          }
          .tutorial-buttons button {
            width: auto;
            margin: 0 5px;
          }
        `;
        document.head.appendChild(style);

        // Create tutorial content
        const tutorialContent = document.createElement("div");
        tutorialContent.className = "tutorial-content";
        tutorialOverlay.appendChild(tutorialContent);

        // Add tutorial steps
        const steps = [
          {
            title: "Welcome to Cookie Organizer!",
            content:
              "This extension helps you understand and manage the cookies used by websites you visit. Let's take a quick tour.",
          },
          {
            title: "Cookie Categories",
            content:
              "Cookies are organized by their purpose (necessary, preferences, analytics, etc.) and their relationship to the site (primary or third-party).",
          },
          {
            title: "Advanced Features",
            content:
              "You can search for specific cookies, filter by attributes, and even decode complex cookie values like JWT tokens.",
          },
          {
            title: "Cookie Management",
            content:
              "Easily delete individual cookies or use bulk actions to manage multiple cookies at once.",
          },
          {
            title: "Data Visualization",
            content:
              "The Charts tab provides visual insights into the cookies used by the site.",
          },
          {
            title: "You're all set!",
            content:
              "You now know the basics of Cookie Organizer. Happy browsing!",
          },
        ];

        // Create tutorial steps
        steps.forEach((step, index) => {
          const stepElement = document.createElement("div");
          stepElement.className = `tutorial-step ${index === 0 ? "active" : ""}`;
          stepElement.innerHTML = `
            <h2>${step.title}</h2>
            <p>${step.content}</p>
            <div class="tutorial-progress">${index + 1} of ${steps.length}</div>
          `;
          tutorialContent.appendChild(stepElement);
        });

        // Add navigation buttons
        const buttonsContainer = document.createElement("div");
        buttonsContainer.className = "tutorial-buttons";

        const prevButton = document.createElement("button");
        prevButton.textContent = "Previous";
        prevButton.style.display = "none"; // Hide initially
        prevButton.addEventListener("click", () => this.navigateStep(-1));

        const nextButton = document.createElement("button");
        nextButton.textContent = "Next";
        nextButton.addEventListener("click", () => this.navigateStep(1));

        const skipButton = document.createElement("button");
        skipButton.textContent = "Skip Tutorial";
        skipButton.style.backgroundColor = "transparent";
        skipButton.style.color = "var(--text-color)";
        skipButton.style.border = "1px solid var(--border-color)";
        skipButton.addEventListener("click", () => this.endTutorial());

        buttonsContainer.appendChild(skipButton);
        buttonsContainer.appendChild(prevButton);
        buttonsContainer.appendChild(nextButton);
        tutorialContent.appendChild(buttonsContainer);

        // Store tutorial elements for later use
        this.tutorialOverlay = tutorialOverlay;
        this.tutorialSteps = document.querySelectorAll(".tutorial-step");
        this.prevButton = prevButton;
        this.nextButton = nextButton;
        this.currentStep = 0;
        this.totalSteps = steps.length;
      }
    },

    navigateStep: function (direction) {
      const newStep = this.currentStep + direction;

      // Validate step range
      if (newStep >= 0 && newStep < this.totalSteps) {
        // Hide current step
        this.tutorialSteps[this.currentStep].classList.remove("active");

        // Show new step
        this.currentStep = newStep;
        this.tutorialSteps[this.currentStep].classList.add("active");

        // Update button visibility
        this.prevButton.style.display = this.currentStep > 0 ? "block" : "none";

        if (this.currentStep === this.totalSteps - 1) {
          this.nextButton.textContent = "Finish";
        } else {
          this.nextButton.textContent = "Next";
        }
      } else if (newStep === this.totalSteps) {
        // User reached the end
        this.endTutorial();
      }
    },

    endTutorial: function () {
      if (this.tutorialOverlay) {
        this.tutorialOverlay.remove();
      }

      // Mark tutorial as complete
      chrome.storage.local.set({
        tutorialComplete: true,
      });
    },
  };

  // Tab navigation
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  // Initialize tabs if they exist
  if (tabs && tabs.length > 0) {
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        // Remove active class from all tabs and contents
        tabs.forEach((t) => t.classList.remove("active"));
        tabContents.forEach((c) => c.classList.remove("active"));

        // Add active class to clicked tab and corresponding content
        tab.classList.add("active");
        const tabId = tab.getAttribute("data-tab");

        if (tabId === "by-purpose") {
          byPurposeTab.classList.add("active");
        } else if (tabId === "by-relationship") {
          byRelationshipTab.classList.add("active");
        } else if (tabId === "all-cookies") {
          allCookiesTab.classList.add("active");
        } else if (tabId === "charts") {
          chartsTab.classList.add("active");
          // If charts tab is clicked, render/update the charts
          renderCharts();
        }
      });
    });
  }

  // Store cookie data
  let siteUrl = "";
  let cookiesByRelationship = null;
  let cookiesByPurpose = null;
  let siteCookies = null;
  let searchDebounceTimeout = null;

  // Purpose category names for display
  const purposeNames = {
    necessary: "Necessary",
    preferences: "Preferences",
    analytics: "Analytics",
    marketing: "Marketing",
    social: "Social Media",
    unknown: "Unknown",
  };

  // Relationship category names for display
  const relationshipNames = {
    primary: "Primary/First-Party",
    secondary: "Secondary",
    thirdParty: "Third-Party",
  };

  // Store filter state
  let activeFilters = {
    secure: true,
    httpOnly: true,
    session: true,
    purpose: [
      "necessary",
      "preferences",
      "analytics",
      "marketing",
      "social",
      "unknown",
    ],
    relationship: ["primary", "secondary", "thirdParty"],
  };

  // Format date from timestamp
  function formatDate(timestamp) {
    if (!timestamp) return "Session cookie";
    return new Date(timestamp * 1000).toLocaleString();
  }

  // Debounce function for search to prevent excessive re-renders
  function debounce(func, delay) {
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    };
  }

  // Theme management
  function initializeTheme() {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem("cookieOrganizerTheme");

    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
      updateThemeIcon(savedTheme);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      // If no saved preference, use system preference
      document.documentElement.setAttribute("data-theme", "dark");
      updateThemeIcon("dark");
    }
  }

  function updateThemeIcon(theme) {
    const toggleIcon = themeToggle.querySelector(".toggle-icon");
    toggleIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  // Toggle between light and dark theme
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("cookieOrganizerTheme", newTheme);
    updateThemeIcon(newTheme);

    // Update charts if they exist
    if (purposeChart || relationshipChart || securityChart || sessionChart) {
      setTimeout(renderCharts, 100); // Short delay to allow CSS variables to update
    }
  }

  // Event listener for theme toggle
  document.addEventListener("DOMContentLoaded", () => {
    const themeToggleElement = document.getElementById("themeToggle");
    if (themeToggleElement) {
      themeToggleElement.addEventListener("click", toggleTheme);
    }

    // Initialize theme on load
    initializeTheme();
  });

  // Copy cookie value to clipboard
  function addCopyButton(cookieValue, cookieValueElement) {
    const copyBtn = document.createElement("span");
    copyBtn.className = "copy-btn";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      // Copy to clipboard
      navigator.clipboard
        .writeText(cookieValue)
        .then(() => {
          // Visual feedback
          copyBtn.textContent = "Copied!";
          setTimeout(() => {
            copyBtn.textContent = "Copy";
          }, 1500);
        })
        .catch((err) => {
          console.error("Could not copy text: ", err);
          copyBtn.textContent = "Error";
          setTimeout(() => {
            copyBtn.textContent = "Copy";
          }, 1500);
        });
    });

    cookieValueElement.appendChild(copyBtn);
  }

  // Add copy buttons to all cookie values on the page
  function addCopyButtonsToCookieValues() {
    document.querySelectorAll(".cookie-value").forEach((element) => {
      const cookieValue = element.getAttribute("data-value");
      if (cookieValue) {
        addCopyButton(cookieValue, element);
      }
    });
  }

  // Define createCookieItemHTML function to fix the reference error
  function createCookieItemHTML(cookie) {
    if (!cookie) return "";

    // Format expiration date
    let expirationText = "Session cookie";
    let expirationWarning = "";

    if (cookie.expirationDate) {
      const expDate = new Date(cookie.expirationDate * 1000);
      expirationText = expDate.toLocaleString();

      // Add warning for cookies expiring within 3 days
      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000,
      );

      if (expDate < threeDaysFromNow) {
        expirationWarning =
          "<span class=\"expiration-warning\" title=\"This cookie will expire soon\">⚠️</span>";
      }
    }

    // Create badges for cookie attributes
    const badges = [];
    if (cookie.secure) badges.push("<span class=\"badge secure\">Secure</span>");
    if (cookie.httpOnly)
      badges.push("<span class=\"badge httponly\">HttpOnly</span>");
    if (!cookie.expirationDate)
      badges.push("<span class=\"badge session\">Session</span>");

    // Add relationship badge if available
    if (cookie.relationshipCategory) {
      badges.push(
        `<span class="badge ${cookie.relationshipCategory}">${getRelationshipDescription(cookie.relationshipCategory)}</span>`,
      );
    }

    // Add purpose badge if available
    if (cookie.purposeCategory) {
      badges.push(
        `<span class="badge ${cookie.purposeCategory}">${
          typeof getPurposeDescription === "function"
            ? getPurposeDescription(cookie.purposeCategory)
            : cookie.purposeCategory
        }</span>`,
      );
    }

    // Generate cookie ID for selection
    const cookieId = `${cookie.name}_${cookie.domain}_${cookie.path || "/"}`;

    // Generate cookie item HTML
    return `
      <div class="cookie-item" data-cookie-id="${cookieId}">
        <input type="checkbox" class="cookie-checkbox" data-cookie-id="${cookieId}">
        <div class="cookie-content">
          <div class="cookie-header">
            <div class="cookie-name-container">
              <span class="cookie-name">${cookie.name}</span>
              ${expirationWarning}
            </div>
            <div class="cookie-actions">
              <button class="delete" data-cookie-name="${cookie.name}" data-cookie-domain="${cookie.domain}" data-cookie-path="${cookie.path || "/"}">Delete</button>
            </div>
          </div>
          <div class="cookie-metadata">
            ${badges.join("")}
          </div>
          <div class="cookie-details">
            Domain: ${cookie.domain} | Path: ${cookie.path || "/"} | Expires: ${expirationText}
          </div>
          <div class="cookie-value" data-original-value="${encodeURIComponent(cookie.value || "")}">
            ${cookie.value || "(empty value)"}
          </div>
        </div>
      </div>
    `;
  }

  // Get description for cookie relationship
  function getRelationshipDescription(relationship) {
    return relationshipNames[relationship] || relationship;
  }

  // Define a cookie value interpreter that can decode common formats
  const cookieValueInterpreter = {
    interpret: function (value) {
      if (!value) {
        return {
          success: false,
          result: "Empty value",
          type: null,
        };
      }

      try {
        // Try to decode as JSON
        if (
          (value.startsWith("{") && value.endsWith("}")) ||
          (value.startsWith("[") && value.endsWith("]"))
        ) {
          try {
            const parsed = JSON.parse(value);
            return {
              success: true,
              result: `<pre class="json-value">${JSON.stringify(parsed, null, 2)}</pre>`,
              type: "json",
            };
          } catch (e) {
            // Not valid JSON, continue to other checks
          }
        }

        // Try to decode as Base64
        if (/^[A-Za-z0-9+/=]+$/.test(value) && value.length % 4 === 0) {
          try {
            const decoded = atob(value);
            // Check if decoded result is printable
            if (/^[\x20-\x7E]*$/.test(decoded)) {
              return {
                success: true,
                result: `<div class="decoded-value">Base64 decoded: <pre>${decoded}</pre></div>`,
                type: "base64",
              };
            }
          } catch (e) {
            // Not valid Base64, continue to other checks
          }
        }

        // Try to decode as JWT (JSON Web Token)
        if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) {
          try {
            const parts = value.split(".");
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));

            return {
              success: true,
              result: `<div class="decoded-value jwt-value">
                <div class="jwt-section">
                  <h4>Header</h4>
                  <pre>${JSON.stringify(header, null, 2)}</pre>
                </div>
                <div class="jwt-section">
                  <h4>Payload</h4>
                  <pre>${JSON.stringify(payload, null, 2)}</pre>
                </div>
                <div class="jwt-section">
                  <h4>Signature</h4>
                  <code>${parts[2]}</code>
                </div>
              </div>`,
              type: "jwt",
            };
          } catch (e) {
            // Not a valid JWT, continue to other checks
          }
        }

        // Try to decode as URL-encoded
        if (value.includes("=") && value.includes("&")) {
          try {
            const decoded = decodeURIComponent(value);
            if (decoded !== value) {
              return {
                success: true,
                result: `<div class="decoded-value">URL decoded: <pre>${decoded}</pre></div>`,
                type: "url",
              };
            }
          } catch (e) {
            // Not valid URL-encoded, continue to other checks
          }
        }

        // If no specific format detected, just return the original value
        return {
          success: false,
          result: value,
          type: null,
        };
      } catch (error) {
        console.error("Error interpreting cookie value:", error);
        return {
          success: false,
          result: "Error decoding value",
          type: null,
        };
      }
    },
  };

  function handleDecodeButtonClick(e) {
    const btn = e.target;
    const cookieItem = btn.closest(".cookie-item");
    const valueContainer = cookieItem.querySelector(".cookie-value");
    const originalValue = valueContainer.getAttribute("data-value");

    // Toggle between original and decoded view
    if (btn.textContent === "Decode") {
      // Decode the cookie value
      const decodedData = cookieValueInterpreter.interpret(originalValue);

      if (decodedData.success) {
        // Save original HTML and show decoded value
        valueContainer.setAttribute(
          "data-original-html",
          valueContainer.innerHTML,
        );
        valueContainer.innerHTML = decodedData.result;
        btn.textContent = "Show Original";
        btn.classList.add("decoded");

        // Add class to indicate decoded format
        if (decodedData.type) {
          cookieItem.setAttribute("data-decoded-type", decodedData.type);
        }
      } else {
        btn.textContent = "Cannot Decode";
        setTimeout(() => {
          btn.textContent = "Decode";
        }, 2000);
      }
    } else {
      // Restore original view
      const originalHTML = valueContainer.getAttribute("data-original-html");
      if (originalHTML) {
        valueContainer.innerHTML = originalHTML;
      } else {
        valueContainer.textContent = originalValue;
      }
      btn.textContent = "Decode";
      btn.classList.remove("decoded");
      cookieItem.removeAttribute("data-decoded-type");
    }
  }

  // Fix string quotes in this function
  function setupDecodeButtons() {
    document.querySelectorAll(".decode-btn").forEach((btn) => {
      // Remove existing listeners before adding new ones
      btn.removeEventListener("click", handleDecodeButtonClick);
      btn.addEventListener("click", handleDecodeButtonClick);
    });
  }

  // Cookie editing functionality
  const cookieEditor = {
    modal: null,
    closeBtn: null,
    cancelBtn: null,
    saveBtn: null,
    form: null,
    expTypeSelect: null,
    relativeInputs: null,
    absoluteInputs: null,
    currentCookie: null,

    // Initialize cookie editor
    init: function () {
      this.modal = document.getElementById("editCookieModal");
      this.closeBtn = document.querySelector(".close-modal");
      this.cancelBtn = document.getElementById("cancelEditBtn");
      this.saveBtn = document.getElementById("saveCookieBtn");
      this.form = document.getElementById("cookieEditForm");
      this.expTypeSelect = document.getElementById("editCookieExpType");
      this.relativeInputs = document.getElementById("relativeExpirationInputs");
      this.absoluteInputs = document.getElementById("absoluteExpirationInputs");

      // Add event listeners
      if (this.closeBtn) {
        this.closeBtn.addEventListener("click", () => this.hideModal());
      }

      if (this.cancelBtn) {
        this.cancelBtn.addEventListener("click", () => this.hideModal());
      }

      if (this.form) {
        this.form.addEventListener("submit", (e) => {
          e.preventDefault();
          this.saveCookieChanges();
        });
      }

      if (this.expTypeSelect) {
        this.expTypeSelect.addEventListener("change", () =>
          this.toggleExpirationInputs(),
        );
      }

      // Close modal when clicking outside of it
      window.addEventListener("click", (e) => {
        if (e.target === this.modal) {
          this.hideModal();
        }
      });
    },

    // Setup edit buttons after rendering cookies
    setupEditButtons: function () {
      const editButtons = document.querySelectorAll(".edit-btn");
      editButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const cookieId = button.getAttribute("data-cookie-id");
          this.openCookieEditor(cookieId);
        });
      });
    },

    // Open cookie editor for a specific cookie
    openCookieEditor: function (cookieId) {
      if (!siteCookies) return;

      // Find the cookie data
      const cookieParts = cookieId.split("_");
      if (cookieParts.length < 2) return;

      const cookieName = cookieParts[0];
      const cookieDomain = cookieParts[1];
      const cookiePath =
        cookieParts.length > 2 ? cookieParts.slice(2).join("_") : "/";

      // Find the cookie object
      const cookie = siteCookies.find(
        (c) =>
          c.name === cookieName &&
          c.domain === cookieDomain &&
          (c.path || "/") === cookiePath,
      );

      if (!cookie) {
        console.error("Cookie not found:", cookieId);
        return;
      }

      // Store the current cookie
      this.currentCookie = cookie;

      // Fill the form with cookie data
      document.getElementById("editCookieId").value = cookieId;
      document.getElementById("editCookieName").value = cookie.name;
      document.getElementById("editCookieDomain").value = cookie.domain;
      document.getElementById("editCookiePath").value = cookie.path || "/";
      document.getElementById("editCookieValue").value = cookie.value || "";
      document.getElementById("editCookieSecure").checked =
        cookie.secure || false;
      document.getElementById("editCookieHttpOnly").checked =
        cookie.httpOnly || false;

      // Set up expiration fields
      if (!cookie.expirationDate) {
        // Session cookie
        document.getElementById("editCookieExpType").value = "session";
        this.relativeInputs.style.display = "none";
        this.absoluteInputs.style.display = "none";
      } else {
        // Default to absolute date/time
        document.getElementById("editCookieExpType").value = "absolute";
        this.relativeInputs.style.display = "none";
        this.absoluteInputs.style.display = "flex";

        // Convert Unix timestamp to local datetime
        const expirationDate = new Date(cookie.expirationDate * 1000);
        const dateTimeStr = this.formatDateTimeForInput(expirationDate);
        document.getElementById("editCookieExpDateTime").value = dateTimeStr;
      }

      // Show the modal
      this.modal.style.display = "block";
    },

    // Hide the modal
    hideModal: function () {
      this.modal.style.display = "none";
      this.currentCookie = null;
    },

    // Toggle expiration inputs based on selected type
    toggleExpirationInputs: function () {
      const selectedType = this.expTypeSelect.value;

      switch (selectedType) {
      case "session":
        this.relativeInputs.style.display = "none";
        this.absoluteInputs.style.display = "none";
        break;
      case "relative":
        this.relativeInputs.style.display = "flex";
        this.absoluteInputs.style.display = "none";
        break;
      case "absolute":
        this.relativeInputs.style.display = "none";
        this.absoluteInputs.style.display = "flex";
        break;
      }
    },

    // Format date for datetime-local input
    formatDateTimeForInput: function (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    // Calculate expiration timestamp based on form inputs
    calculateExpirationTimestamp: function () {
      const expType = this.expTypeSelect.value;

      if (expType === "session") {
        return null; // Session cookie, no expiration
      } else if (expType === "relative") {
        const value = parseInt(
          document.getElementById("editCookieExpValue").value,
          10,
        );
        const unit = document.getElementById("editCookieExpUnit").value;
        const now = new Date();

        // Add the relative time
        switch (unit) {
        case "seconds":
          now.setSeconds(now.getSeconds() + value);
          break;
        case "minutes":
          now.setMinutes(now.getMinutes() + value);
          break;
        case "hours":
          now.setHours(now.getHours() + value);
          break;
        case "days":
          now.setDate(now.getDate() + value);
          break;
        case "months":
          now.setMonth(now.getMonth() + value);
          break;
        case "years":
          now.setFullYear(now.getFullYear() + value);
          break;
        }

        return Math.floor(now.getTime() / 1000);
      } else if (expType === "absolute") {
        const dateTimeStr = document.getElementById(
          "editCookieExpDateTime",
        ).value;
        if (!dateTimeStr) return null;

        const expDate = new Date(dateTimeStr);
        return Math.floor(expDate.getTime() / 1000);
      }

      return null;
    },

    // Save cookie changes
    saveCookieChanges: function () {
      if (!this.currentCookie) return;

      // Get form values
      const newValue = document.getElementById("editCookieValue").value;
      const newSecure = document.getElementById("editCookieSecure").checked;
      const newHttpOnly = document.getElementById("editCookieHttpOnly").checked;
      const newExpiration = this.calculateExpirationTimestamp();

      // Create updated cookie object
      const updatedCookie = {
        name: this.currentCookie.name,
        domain: this.currentCookie.domain,
        path: this.currentCookie.path || "/",
        secure: newSecure,
        httpOnly: newHttpOnly,
        expirationDate: newExpiration,
        value: newValue,
        storeId: this.currentCookie.storeId,
      };

      // Calculate URL for cookie
      const url = `${updatedCookie.secure ? "https" : "http"}://${updatedCookie.domain.replace(/^\./, "")}${updatedCookie.path}`;

      // Show loading state
      this.saveBtn.textContent = "Saving...";
      this.saveBtn.disabled = true;

      // Send update request to background script
      chrome.runtime.sendMessage(
        {
          action: "updateCookie",
          siteUrl: siteUrl,
          cookie: {
            ...updatedCookie,
            url: url,
          },
        },
        (response) => {
          if (response && response.success) {
            // Update our cookie data
            cookiesByRelationship = response.cookiesByRelationship;
            cookiesByPurpose = response.cookiesByPurpose;
            siteCookies = response.siteCookies;

            // Update stats
            if (response.stats) {
              updateStats(response.stats);
            }

            // Re-render with current search term
            renderCookies(searchBox.value);

            // Hide the modal
            this.hideModal();
          } else {
            // Show error
            alert(
              "Error updating cookie: " +
                (response ? response.error : "Unknown error"),
            );
            this.saveBtn.textContent = "Save Changes";
            this.saveBtn.disabled = false;
          }
        },
      );
    },
  };

  // Initialize the cookie editor when DOM is loaded
  if (
    typeof cookieEditor !== "undefined" &&
    cookieEditor &&
    cookieEditor.init
  ) {
    cookieEditor.init();
  }

  // Initialize auto-refresh functionality
  if (typeof autoRefresh !== "undefined" && autoRefresh && autoRefresh.init) {
    autoRefresh.init();
  }

  // Initialize the tutorial
  if (
    typeof tutorialManager !== "undefined" &&
    tutorialManager &&
    tutorialManager.init
  ) {
    tutorialManager.init();
  }

  // Initialize logs viewer
  const logsViewer = {
    init: function () {
      console.log("Logs viewer initialized");
      // Initialize logs viewer UI
      const logsTab = document.getElementById("logsTab");
      if (logsTab) {
        const refreshLogsBtn = document.getElementById("refreshLogsBtn");
        const clearLogsBtn = document.getElementById("clearLogsBtn");
        const exportLogsBtn = document.getElementById("exportLogsBtn");
        const logLevelSelect = document.getElementById("logLevelSelect");
        // Define logsTableBody properly here
        const logsTableBody = document.getElementById("logsTableBody");

        // Add event listeners if elements exist
        if (refreshLogsBtn) {
          refreshLogsBtn.addEventListener("click", this.refreshLogs);
        }

        if (clearLogsBtn) {
          clearLogsBtn.addEventListener("click", this.clearLogs);
        }

        if (exportLogsBtn) {
          exportLogsBtn.addEventListener("click", this.exportLogs);
        }

        if (logLevelSelect) {
          logLevelSelect.addEventListener("change", (e) => {
            this.setLogLevel(e.target.value);
          });
        }

        // Initial logs load
        this.refreshLogs();
      }
    },

    refreshLogs: function () {
      console.log("Refreshing logs");
      chrome.runtime.sendMessage(
        {
          action: "getLogs",
        },
        (response) => {
          if (response && response.success && response.logs) {
            this.displayLogs(response.logs);
          } else {
            console.error("Failed to get logs");
          }
        },
      );
    },

    displayLogs: function (logs) {
      const logsTableBody = document.getElementById("logsTableBody");
      if (!logsTableBody) return;

      if (!logs || logs.length === 0) {
        logsTableBody.innerHTML =
          "<tr><td colspan=\"3\" class=\"no-logs-message\">No logs found</td></tr>";
        return;
      }

      logsTableBody.innerHTML = "";
      logs.forEach((log) => {
        const row = document.createElement("tr");
        row.className = `log-level-${log.level.toLowerCase()}`;

        row.innerHTML = `
          <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
          <td><span class="log-level ${log.level.toLowerCase()}">${log.level}</span></td>
          <td>${log.message}</td>
        `;

        logsTableBody.appendChild(row);
      });
    },

    clearLogs: function () {
      console.log("Clearing logs");
      chrome.runtime.sendMessage(
        {
          action: "clearLogs",
        },
        (response) => {
          if (response && response.success) {
            const logsTableBody = document.getElementById("logsTableBody");
            if (logsTableBody) {
              logsTableBody.innerHTML =
                "<tr><td colspan=\"3\" class=\"no-logs-message\">No logs found</td></tr>";
            }
          }
        },
      );
    },

    exportLogs: function () {
      console.log("Exporting logs");
      chrome.runtime.sendMessage(
        {
          action: "getLogs",
        },
        (response) => {
          if (response && response.success && response.logs) {
            const logs = response.logs;

            // Format logs as JSON
            const logsJson = JSON.stringify(logs, null, 2);

            // Create download
            const blob = new Blob([logsJson], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);

            // Create download link
            const a = document.createElement("a");
            a.href = url;
            a.download = `cookie_organizer_logs_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();

            // Clean up
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 100);
          }
        },
      );
    },

    setLogLevel: function (level) {
      console.log("Setting log level to:", level);
      chrome.runtime.sendMessage({
        action: "setLogLevel",
        level: parseInt(level),
      });
    },
  };

  // Initialize the tutorial
  if (
    typeof tutorialManager !== "undefined" &&
    tutorialManager &&
    tutorialManager.init
  ) {
    tutorialManager.init();
  }

  // Add placeholder functions if they don't exist
  // Render cookies by relationship
  if (typeof renderCookiesByRelationship !== "function") {
    window.renderCookiesByRelationship = function (
      data,
      searchTerm = "",
      page = 1,
    ) {
      console.log("renderCookiesByRelationship is not fully implemented");
      if (byRelationshipTab) {
        byRelationshipTab.innerHTML =
          "<div class='info-message'>Relationship view is not available</div>";
      }
    };
  }

  // Render all cookies
  if (typeof renderAllCookies !== "function") {
    window.renderAllCookies = function (cookies, searchTerm = "", page = 1) {
      console.log("renderAllCookies is not fully implemented");
      if (allCookiesTab) {
        allCookiesTab.innerHTML =
          "<div class='info-message'>All cookies view is not available</div>";
      }
    };
  }

  // Add placeholder function for restoreCheckboxSelections if it doesn't exist
  if (typeof restoreCheckboxSelections !== "function") {
    window.restoreCheckboxSelections = function () {
      // This function would normally restore checkbox states from a saved state
      // We'll leave it as a no-op for now
    };
  }

  // Settings manager to handle user preferences
  window.settingsManager = {
    // Default settings
    defaults: {
      showCookieCount: true,
      expandCategories: false,
      defaultTab: "byPurposeTab",
      autoRefresh: false,
      refreshInterval: 60,
      confirmDeletion: true,
      logLevel: 1,
      showDevTools: false,
    },

    // Current settings
    current: {},

    // Initialize settings
    init: function () {
      const settingsBtn = document.getElementById("settingsBtn");
      const settingsMenu = document.getElementById("settingsMenu");
      const openSettingsBtn = document.getElementById("openSettingsBtn");
      const settingsModal = document.getElementById("settingsModal");
      const closeSettings = document.getElementById("closeSettings");
      const resetSettingsBtn = document.getElementById("resetSettingsBtn");
      const saveSettingsBtn = document.getElementById("saveSettingsBtn");

      // Load saved settings
      this.loadSettings();

      // Settings button click
      if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
          settingsMenu.style.display =
            settingsMenu.style.display === "block" ? "none" : "block";
        });
      }

      // Open settings modal
      if (openSettingsBtn) {
        openSettingsBtn.addEventListener("click", () => {
          settingsMenu.style.display = "none";
          this.populateSettingsForm();
          settingsModal.style.display = "block";
        });
      }

      // Close settings modal
      if (closeSettings) {
        closeSettings.addEventListener("click", () => {
          settingsModal.style.display = "none";
        });
      }

      // Reset settings to defaults
      if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener("click", () => {
          this.resetToDefaults();
          this.populateSettingsForm();
        });
      }

      // Save settings
      if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", () => {
          this.saveSettingsFromForm();
          settingsModal.style.display = "none";
          this.applySettings();
        });
      }

      // Apply settings on load
      this.applySettings();
    },

    // Load settings from storage
    loadSettings: function () {
      chrome.storage.local.get("settings", (result) => {
        if (result.settings) {
          this.current = {
            ...this.defaults,
            ...result.settings,
          };
        } else {
          this.current = {
            ...this.defaults,
          };
        }
      });
    },

    // Save settings to storage
    saveSettings: function () {
      chrome.storage.local.set({
        settings: this.current,
      });
    },

    // Reset settings to defaults
    resetToDefaults: function () {
      this.current = {
        ...this.defaults,
      };
      this.saveSettings();
    },

    // Populate form with current settings
    populateSettingsForm: function () {
      document.getElementById("setting-showCookieCount").checked =
        this.current.showCookieCount;
      document.getElementById("setting-expandCategories").checked =
        this.current.expandCategories;
      document.getElementById("setting-defaultTab").value =
        this.current.defaultTab;
      document.getElementById("setting-autoRefresh").checked =
        this.current.autoRefresh;
      document.getElementById("setting-refreshInterval").value =
        this.current.refreshInterval;
      document.getElementById("setting-confirmDeletion").checked =
        this.current.confirmDeletion;
      document.getElementById("setting-logLevel").value = this.current.logLevel;
      document.getElementById("setting-showDevTools").checked =
        this.current.showDevTools;
    },

    // Save settings from form
    saveSettingsFromForm: function () {
      this.current.showCookieCount = document.getElementById(
        "setting-showCookieCount",
      ).checked;
      this.current.expandCategories = document.getElementById(
        "setting-expandCategories",
      ).checked;
      this.current.defaultTab =
        document.getElementById("setting-defaultTab").value;
      this.current.autoRefresh = document.getElementById(
        "setting-autoRefresh",
      ).checked;
      this.current.refreshInterval = parseInt(
        document.getElementById("setting-refreshInterval").value,
      );
      this.current.confirmDeletion = document.getElementById(
        "setting-confirmDeletion",
      ).checked;
      this.current.logLevel = parseInt(
        document.getElementById("setting-logLevel").value,
      );
      this.current.showDevTools = document.getElementById(
        "setting-showDevTools",
      ).checked;

      this.saveSettings();
    },

    // Apply current settings to UI
    applySettings: function () {
      // Apply default tab
      if (this.current.defaultTab) {
        const tabs = document.querySelectorAll(".category-tab");
        const tabContents = document.querySelectorAll(".tab-content");

        tabs.forEach((tab) => {
          tab.classList.remove("active");
          if (tab.dataset.tab === this.current.defaultTab) {
            tab.classList.add("active");
          }
        });

        tabContents.forEach((content) => {
          content.classList.remove("active");
          if (content.id === this.current.defaultTab) {
            content.classList.add("active");
          }
        });
      }

      // Apply auto-refresh
      if (this.current.autoRefresh) {
        startAutoRefresh(this.current.refreshInterval);
      } else {
        stopAutoRefresh();
      }

      // Apply log level
      chrome.runtime.sendMessage({
        action: "setLogLevel",
        level: this.current.logLevel,
      });

      // Apply cookie count visibility
      const cookieCountElements = document.querySelectorAll(".cookie-count");
      cookieCountElements.forEach((element) => {
        element.style.display = this.current.showCookieCount ? "block" : "none";
      });

      // Apply expandCategories if needed
      if (this.current.expandCategories) {
        document.querySelectorAll(".category-cookies").forEach((element) => {
          element.classList.add("open");
        });
      }
    },
  };

  // Add expiration warnings to cookies that are expiring soon
  function addExpirationWarnings() {
    const cookieItems = document.querySelectorAll(".cookie-item");

    cookieItems.forEach((item) => {
      // Get expiration information from the cookie details
      const detailsElement = item.querySelector(".cookie-details");
      if (!detailsElement) return;

      const expiresMatch = detailsElement.textContent.match(/Expires: ([^|]+)/);
      if (!expiresMatch) return;

      const expiresText = expiresMatch[1].trim();
      if (expiresText === "Session") return; // Skip session cookies

      const expiresDate = new Date(expiresText);
      const now = new Date();

      // Calculate time difference in days
      const timeDiffMs = expiresDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiffMs / (1000 * 3600 * 24));

      // Add warning for cookies expiring within 3 days
      if (daysDiff <= 3 && daysDiff > 0) {
        const namePart = item.querySelector(".cookie-name");
        if (namePart) {
          namePart.classList.add("expiring-soon");

          const warningSymbol = document.createElement("span");
          warningSymbol.className = "expiration-warning";
          warningSymbol.textContent = "⚠️";
          namePart.appendChild(warningSymbol);

          const tooltip = document.createElement("span");
          tooltip.className = "expiration-tooltip";
          tooltip.textContent = `Expires in ${daysDiff} day${daysDiff !== 1 ? "s" : ""}`;
          namePart.appendChild(tooltip);
        }
      }
    });
  }

  // Auto-refresh cookies periodically
  let autoRefreshInterval = null;

  function startAutoRefresh(seconds) {
    // Call the global function
    window.startAutoRefresh(seconds);
  }

  function stopAutoRefresh() {
    // Call the global function
    window.stopAutoRefresh();
  }

  // Initialize settings manager
  if (
    typeof window.settingsManager !== "undefined" &&
    window.settingsManager &&
    window.settingsManager.init
  ) {
    window.settingsManager.init();
  }

  // Add other existing initializations...
});

// Initialize the extension when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Cookie Organizer extension loaded");

  // Access elements
  const refreshButton = document.getElementById("refreshButton");
  const searchBox = document.getElementById("searchBox");
  const themeToggle = document.getElementById("themeToggle");

  // Initialize theme using the function we've defined properly
  if (typeof initializeTheme === "function") {
    initializeTheme();
  } else {
    console.error("initializeTheme function not found");
    // Fallback to the safe implementation
    safeInitializeTheme();
  }

  // Initialize the comparison manager
  if (typeof window.safeComparisonManager !== "undefined" && window.safeComparisonManager) {
    window.safeComparisonManager.init();
  }

  // Set up event listeners for the Scan Cookies button
  if (refreshButton) {
    console.log("Setting up click handler for refresh button");
    refreshButton.addEventListener("click", function () {
      console.log("Refresh button clicked");
      // Show loading indicator if it exists
      const loadingIndicator = document.getElementById("loadingIndicator");
      if (loadingIndicator) {
        loadingIndicator.style.display = "block";
      }
      scanCurrentSiteCookies();
    });
  } else {
    console.error("Refresh button not found in the DOM");
  }

  // Set up search box handler
  if (
    searchBox &&
    typeof renderCookies === "function" &&
    typeof debounce === "function"
  ) {
    searchBox.addEventListener(
      "input",
      debounce(function () {
        renderCookies(searchBox.value);
      }, 300),
    );
  }

  // Set up theme toggle handler
  if (themeToggle && typeof toggleTheme === "function") {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Set up tab navigation
  document.querySelectorAll(".category-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      // Get current active tab
      const currentActiveTab = document.querySelector(".category-tab.active");
      const currentActiveContent = document.querySelector(
        ".tab-content.active",
      );

      // Get clicked tab and corresponding content
      const clickedTabId = this.getAttribute("data-tab");
      const clickedContent = document.getElementById(clickedTabId);

      // Remove active class from current tab/content
      if (currentActiveTab) currentActiveTab.classList.remove("active");
      if (currentActiveContent) currentActiveContent.classList.remove("active");

      // Add active class to clicked tab/content
      this.classList.add("active");
      if (clickedContent) clickedContent.classList.add("active");

      // If Charts tab is clicked, render charts
      if (clickedTabId === "chartsTab" && typeof renderCharts === "function") {
        renderCharts();
      }

      // If Compare tab is clicked, make sure it's properly initialized
      if (clickedTabId === "compareTab") {
        if (
          typeof window.safeComparisonManager !== "undefined" &&
          window.safeComparisonManager
        ) {
          window.safeComparisonManager.init();
        }
      }
    });
  });

  // Initialize managers if they exist
  if (
    typeof window.settingsManager !== "undefined" &&
    window.settingsManager &&
    typeof window.settingsManager.init === "function"
  ) {
    window.settingsManager.init();
  }

  if (
    typeof tutorialManager !== "undefined" &&
    tutorialManager &&
    typeof tutorialManager.init === "function"
  ) {
    tutorialManager.init();
  }

  // Initialize comparison manager
  if (
    typeof window.safeComparisonManager !== "undefined" &&
    window.safeComparisonManager &&
    typeof window.safeComparisonManager.init === "function"
  ) {
    window.safeComparisonManager.init();
  }

  // Load cookies automatically when the popup opens
  if (typeof loadCookies === "function") {
    console.log("Auto-loading cookies when popup opens");
    loadCookies();
  } else {
    console.error("loadCookies function not found");
  }

  // Initialize copy as cURL buttons
  setTimeout(addCopyAsCurlButtons, 500);

  // Set up auto-refresh if enabled in settings
  chrome.storage.local.get(
    ["autoRefresh", "refreshInterval"],
    function (result) {
      if (result.autoRefresh) {
        const interval = result.refreshInterval || 60; // Default to 60 seconds
        if (typeof startAutoRefresh === "function") {
          console.log(
            `Starting auto-refresh with interval: ${interval} seconds`,
          );
          startAutoRefresh(interval);
        }
      }
    },
  );
});

// Ensure safeComparisonManager has access to formatDate function
if (typeof window.safeComparisonManager !== "undefined" && window.safeComparisonManager) {
  window.safeComparisonManager.formatDate = function (timestamp) {
    if (!timestamp) return "Session cookie";
    return new Date(timestamp * 1000).toLocaleString();
  };
}

// Cookie snapshot and comparison manager
// Extend the global safeComparisonManager to avoid duplicate declaration
Object.assign(window.safeComparisonManager, {
  loadSnapshots: function () {
    try {
      console.log("Loading saved snapshots");
      const savedSnapshots = localStorage.getItem("cookieOrganizerSnapshots");
      if (savedSnapshots) {
        this.snapshots = JSON.parse(savedSnapshots);
        console.log(`Loaded ${this.snapshots.length} snapshots`);
      } else {
        console.log("No saved snapshots found");
        this.snapshots = [];
      }
    } catch (error) {
      console.error("Error loading snapshots:", error);
      this.snapshots = [];
    }
  },

  init: function () {
    try {
      console.log("Initializing safe comparison manager");

      // Get DOM elements
      const takeSnapshotBtn = document.getElementById("takeSnapshotBtn");
      const clearSnapshotsBtn = document.getElementById("clearSnapshotsBtn");
      const snapshotsList = document.getElementById("snapshotsList");
      const compareTypeFilter = document.getElementById("compareTypeFilter");

      // Ensure loadSnapshots is defined before calling it
      if (typeof this.loadSnapshots !== "function") {
        console.error("loadSnapshots is not defined");
        return;
      }

      // Load previously saved snapshots
      this.loadSnapshots();

      // Event listeners
      if (takeSnapshotBtn) {
        takeSnapshotBtn.addEventListener("click", () => this.takeSnapshot());
      }

      if (clearSnapshotsBtn) {
        clearSnapshotsBtn.addEventListener("click", () =>
          this.clearSnapshots(),
        );
      }

      if (compareTypeFilter) {
        compareTypeFilter.addEventListener("change", () => {
          if (this.selectedSnapshots.length === 2) {
            this.compareSnapshots(
              this.selectedSnapshots[0],
              this.selectedSnapshots[1],
              compareTypeFilter.value,
            );
          }
        });
      }

      // Initial render
      this.renderSnapshotsList();
    } catch (error) {
      console.error("Error initializing safe comparison manager:", error);
    }
  },

  saveSnapshots: function () {
    try {
      localStorage.setItem(
        "cookieOrganizerSnapshots",
        JSON.stringify(this.snapshots),
      );
    } catch (error) {
      console.error("Error saving snapshots:", error);
    }
  },

  takeSnapshot: function () {
    if (!siteCookies || siteCookies.length === 0) {
      alert("No cookies to snapshot. Please scan a site first.");
      return;
    }

    const snapshot = {
      id: Date.now(),
      timestamp: Math.floor(Date.now() / 1000),
      url: siteUrl,
      cookies: JSON.parse(JSON.stringify(siteCookies)),
    };

    this.snapshots.push(snapshot);
    this.saveSnapshots();
    this.renderSnapshotsList();
  },

  clearSnapshots: function () {
    if (!confirm("Are you sure you want to delete all snapshots?")) return;

    this.snapshots = [];
    this.selectedSnapshots = [];
    this.saveSnapshots();
    this.renderSnapshotsList();

    // Clear comparison results
    const comparisonResults = document.getElementById("comparisonResults");
    if (comparisonResults) {
      comparisonResults.innerHTML = "";
    }
  },

  renderSnapshotsList: function () {
    const snapshotsList = document.getElementById("snapshotsList");
    if (!snapshotsList) return;

    snapshotsList.innerHTML = "";

    if (this.snapshots.length === 0) {
      snapshotsList.innerHTML =
        "<div class='no-snapshots'>No snapshots available. Take a snapshot to compare changes over time.</div>";
      return;
    }

    // Sort snapshots by timestamp (newest first)
    const sortedSnapshots = [...this.snapshots].sort(
      (a, b) => b.timestamp - a.timestamp,
    );

    sortedSnapshots.forEach((snapshot) => {
      const snapshotEl = document.createElement("div");
      snapshotEl.className = "snapshot-item";

      // Check if snapshot is selected
      if (this.selectedSnapshots.find((s) => s.id === snapshot.id)) {
        snapshotEl.classList.add("selected");
      }

      let hostname = "Unknown site";
      try {
        hostname = new URL(snapshot.url).hostname;
      } catch (e) {
        hostname = snapshot.url || "Unknown site";
      }

      snapshotEl.innerHTML = `
        <input type="checkbox" class="snapshot-checkbox" data-id="${snapshot.id}" 
            ${this.selectedSnapshots.find((s) => s.id === snapshot.id) ? "checked" : ""}>
        <div class="snapshot-info">
          <div class="snapshot-title">${hostname}</div>
          <div class="snapshot-meta">
            <span class="snapshot-time">${this.formatDate(snapshot.timestamp)}</span>
            <span class="snapshot-count">${snapshot.cookies.length} cookies</span>
          </div>
        </div>
      `;

      // Handle snapshot selection
      const checkbox = snapshotEl.querySelector(".snapshot-checkbox");
      if (checkbox) {
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            this.selectSnapshot(snapshot);
          } else {
            this.deselectSnapshot(snapshot);
          }
        });
      }

      snapshotsList.appendChild(snapshotEl);
    });
  },

  selectSnapshot: function (snapshot) {
    // Maximum of 2 snapshots can be selected for comparison
    if (this.selectedSnapshots.length >= 2) {
      // Remove the first (oldest) selection
      this.selectedSnapshots.shift();
    }

    this.selectedSnapshots.push(snapshot);
    this.renderSnapshotsList();

    // If 2 snapshots are selected, compare them
    if (this.selectedSnapshots.length === 2) {
      const compareTypeFilter = document.getElementById("compareTypeFilter");
      this.compareSnapshots(
        this.selectedSnapshots[0],
        this.selectedSnapshots[1],
        compareTypeFilter ? compareTypeFilter.value : "all",
      );
    } else {
      // Clear comparison results
      const comparisonResults = document.getElementById("comparisonResults");
      if (comparisonResults) {
        comparisonResults.innerHTML = "";
      }
    }
  },

  deselectSnapshot: function (snapshot) {
    this.selectedSnapshots = this.selectedSnapshots.filter(
      (s) => s.id !== snapshot.id,
    );
    this.renderSnapshotsList();

    // If 2 snapshots are still selected, compare them
    if (this.selectedSnapshots.length === 2) {
      const compareTypeFilter = document.getElementById("compareTypeFilter");
      this.compareSnapshots(
        this.selectedSnapshots[0],
        this.selectedSnapshots[1],
        compareTypeFilter ? compareTypeFilter.value : "all",
      );
    } else {
      // Clear comparison results
      const comparisonResults = document.getElementById("comparisonResults");
      if (comparisonResults) {
        comparisonResults.innerHTML = "";
      }
    }
  },

  compareSnapshots: function (snapshot1, snapshot2, filterType = "all") {
    const comparisonResults = document.getElementById("comparisonResults");
    if (!comparisonResults) return;

    // Sort snapshots by timestamp (oldest first)
    let oldSnapshot, newSnapshot;
    if (snapshot1.timestamp < snapshot2.timestamp) {
      oldSnapshot = snapshot1;
      newSnapshot = snapshot2;
    } else {
      oldSnapshot = snapshot2;
      newSnapshot = snapshot1;
    }

    // Find added, removed and modified cookies
    const added = newSnapshot.cookies.filter(
      (newCookie) =>
        !oldSnapshot.cookies.find(
          (oldCookie) =>
            oldCookie.name === newCookie.name &&
            oldCookie.domain === newCookie.domain,
        ),
    );

    const removed = oldSnapshot.cookies.filter(
      (oldCookie) =>
        !newSnapshot.cookies.find(
          (newCookie) =>
            newCookie.name === oldCookie.name &&
            newCookie.domain === oldCookie.domain,
        ),
    );

    const modified = newSnapshot.cookies.filter((newCookie) => {
      const oldCookie = oldSnapshot.cookies.find(
        (oldCookie) =>
          oldCookie.name === newCookie.name &&
          oldCookie.domain === newCookie.domain,
      );

      if (!oldCookie) return false;

      // Check if any property has changed
      return (
        newCookie.value !== oldCookie.value ||
        newCookie.expirationDate !== oldCookie.expirationDate ||
        newCookie.path !== oldCookie.path ||
        newCookie.secure !== oldCookie.secure ||
        newCookie.httpOnly !== oldCookie.httpOnly ||
        newCookie.sameSite !== oldCookie.sameSite
      );
    });

    // Clear previous results
    comparisonResults.innerHTML = "";

    // Create header with snapshots info
    const header = document.createElement("div");
    header.className = "comparison-header";

    let oldHostname = "Unknown site";
    let newHostname = "Unknown site";

    try {
      oldHostname = new URL(oldSnapshot.url).hostname;
      newHostname = new URL(newSnapshot.url).hostname;
    } catch (e) {
      oldHostname = oldSnapshot.url || "Unknown site";
      newHostname = newSnapshot.url || "Unknown site";
    }

    header.innerHTML = `
      <div class="comparison-title">Comparing Snapshots</div>
      <div class="comparison-snapshots">
        <div class="comparison-snapshot old">
          <div>Before: ${oldHostname}</div>
          <div class="snapshot-time">${this.formatDate(oldSnapshot.timestamp)}</div>
        </div>
        <div class="comparison-snapshot new">
          <div>After: ${newHostname}</div>
          <div class="snapshot-time">${this.formatDate(newSnapshot.timestamp)}</div>
        </div>
      </div>
      <div class="comparison-summary">
        <div class="summary-item added">${added.length} added</div>
        <div class="summary-item removed">${removed.length} removed</div>
        <div class="summary-item modified">${modified.length} modified</div>
      </div>
    `;

    comparisonResults.appendChild(header);

    // Filter cookies based on selected type
    let cookiesToShow = [];

    switch (filterType) {
    case "added":
      cookiesToShow = added.map((cookie) => ({
        type: "added",
        cookie,
      }));
      break;
    case "removed":
      cookiesToShow = removed.map((cookie) => ({
        type: "removed",
        cookie,
      }));
      break;
    case "modified":
      cookiesToShow = modified.map((cookie) => {
        const oldCookie = oldSnapshot.cookies.find(
          (oldCookie) =>
            oldCookie.name === cookie.name &&
              oldCookie.domain === cookie.domain,
        );
        return {
          type: "modified",
          cookie,
          oldCookie,
        };
      });
      break;
    case "all":
    default:
      cookiesToShow = [
        ...added.map((cookie) => ({
          type: "added",
          cookie,
        })),
        ...removed.map((cookie) => ({
          type: "removed",
          cookie,
        })),
        ...modified.map((cookie) => {
          const oldCookie = oldSnapshot.cookies.find(
            (oldCookie) =>
              oldCookie.name === cookie.name &&
                oldCookie.domain === cookie.domain,
          );
          return {
            type: "modified",
            cookie,
            oldCookie,
          };
        }),
      ];
    }

    // No changes to show
    if (cookiesToShow.length === 0) {
      const noChanges = document.createElement("div");
      noChanges.className = "no-changes";
      noChanges.textContent =
        "No cookie changes found with the selected filter.";
      comparisonResults.appendChild(noChanges);
      return;
    }

    // Create cookie comparison list
    const cookieList = document.createElement("div");
    cookieList.className = "cookie-comparison-list";

    cookiesToShow.forEach((item) => {
      const cookieItem = document.createElement("div");
      cookieItem.className = `cookie-comparison-item ${item.type}`;

      let itemContent = "";
      let changes; // Declare changes variable outside the switch statement

      switch (item.type) {
      case "added":
        itemContent = `
            <div class="comparison-badge added">+</div>
            <div class="cookie-info">
              <div class="cookie-name">${item.cookie.name}</div>
              <div class="cookie-domain">${item.cookie.domain}</div>
              <div class="cookie-value">${item.cookie.value}</div>
            </div>
          `;
        break;
      case "removed":
        itemContent = `
            <div class="comparison-badge removed">-</div>
            <div class="cookie-info">
              <div class="cookie-name">${item.cookie.name}</div>
              <div class="cookie-domain">${item.cookie.domain}</div>
              <div class="cookie-value">${item.cookie.value}</div>
            </div>
          `;
        break;
      case "modified":
        // Highlight changed properties
        changes = {
          value: item.cookie.value !== item.oldCookie.value,
          expirationDate:
              item.cookie.expirationDate !== item.oldCookie.expirationDate,
          path: item.cookie.path !== item.oldCookie.path,
          secure: item.cookie.secure !== item.oldCookie.secure,
          httpOnly: item.cookie.httpOnly !== item.oldCookie.httpOnly,
          sameSite: item.cookie.sameSite !== item.oldCookie.sameSite,
        };

        itemContent = `
            <div class="comparison-badge modified">~</div>
            <div class="cookie-info">
              <div class="cookie-name">${item.cookie.name}</div>
              <div class="cookie-domain">${item.cookie.domain}</div>
              ${
  changes.value
    ? `
                <div class="diff-container">
                  <div class="diff-label">Value:</div>
                  <div class="diff-content">
                    <div class="diff-old">${item.oldCookie.value}</div>
                    <div class="diff-new">${item.cookie.value}</div>
                  </div>
                </div>
              `
    : `<div class="cookie-value">${item.cookie.value}</div>`
}
              
              ${
  changes.expirationDate
    ? `
                <div class="diff-container">
                  <div class="diff-label">Expires:</div>
                  <div class="diff-content">
                    <div class="diff-old">${this.formatDate(item.oldCookie.expirationDate)}</div>
                    <div class="diff-new">${this.formatDate(item.cookie.expirationDate)}</div>
                  </div>
                </div>
              `
    : ""
}
              
              ${
  changes.path
    ? `
                <div class="diff-container">
                  <div class="diff-label">Path:</div>
                  <div class="diff-content">
                    <div class="diff-old">${item.oldCookie.path}</div>
                    <div class="diff-new">${item.cookie.path}</div>
                  </div>
                </div>
              `
    : ""
}
              
              ${
  changes.secure || changes.httpOnly || changes.sameSite
    ? `
                <div class="diff-container">
                  <div class="diff-label">Security:</div>
                  <div class="diff-content">
                    <div class="diff-old">
                      ${item.oldCookie.secure ? "Secure " : ""}
                      ${item.oldCookie.httpOnly ? "HttpOnly " : ""}
                      ${item.oldCookie.sameSite ? `SameSite=${item.oldCookie.sameSite}` : ""}
                    </div>
                    <div class="diff-new">
                      ${item.cookie.secure ? "Secure " : ""}
                      ${item.cookie.httpOnly ? "HttpOnly " : ""}
                      ${item.cookie.sameSite ? `SameSite=${item.cookie.sameSite}` : ""}
                    </div>
                  </div>
                </div>
              `
    : ""
}
            </div>
          `;
        break;
      }

      cookieItem.innerHTML = itemContent;
      cookieList.appendChild(cookieItem);
    });

    comparisonResults.appendChild(cookieList);
  },
});

// Initialize safe comparison manager
if (
  typeof safeComparisonManager !== "undefined" &&
  safeComparisonManager.init
) {
  safeComparisonManager.init();
}

// Implement a proper renderCookiesByRelationship function
function renderCookiesByRelationship(data, searchTerm = "", page = 1) {
  // Check if tab exists
  const byRelationshipTab = document.getElementById("byRelationshipTab");
  if (!byRelationshipTab) return;

  byRelationshipTab.innerHTML = "";

  if (!data || Object.keys(data).length === 0) {
    byRelationshipTab.innerHTML =
      "<div class='no-cookies'>No cookies found for this site.</div>";
    return;
  }

  // Order of relationship categories
  const relationshipOrder = ["primary", "secondary", "thirdParty"];

  // Filter and display relationships in order
  relationshipOrder.forEach((relationship) => {
    if (!data[relationship] || data[relationship].length === 0) return;

    const cookies = data[relationship];

    // Filter cookies based on search term and advanced filters - use the safe function
    const filteredCookies = cookies.filter((cookie) =>
      safeApplyCookieFilters(cookie, searchTerm),
    );

    if (filteredCookies.length === 0) return;

    // Create relationship category item
    const relationshipItem = document.createElement("div");
    relationshipItem.className = `domain-item ${relationship}`;

    // Relationship header
    const relationshipHeader = document.createElement("div");
    relationshipHeader.className = "category-header";
    relationshipHeader.dataset.relationship = relationship;
    relationshipHeader.innerHTML = `
      <div>${relationshipNames[relationship] || relationship}</div>
      <div class="category-cookie-count">${filteredCookies.length} cookie${filteredCookies.length !== 1 ? "s" : ""}</div>
    `;

    // Add relationship item to container first
    relationshipItem.appendChild(relationshipHeader);

    // Container for cookies in this relationship
    const cookiesContainer = document.createElement("div");
    cookiesContainer.className = "category-cookies";
    cookiesContainer.dataset.relationship = relationship;
    relationshipItem.appendChild(cookiesContainer);

    // Add to DOM before adding cookies
    byRelationshipTab.appendChild(relationshipItem);

    // Add individual cookies
    filteredCookies.forEach((cookie) => {
      // Use window.createCookieItemHTML to ensure global access
      const cookieHTML = window.createCookieItemHTML(cookie);
      cookiesContainer.insertAdjacentHTML("beforeend", cookieHTML);
    });
  });

  // If no cookies match filters, show message
  if (byRelationshipTab.children.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "no-cookies";
    noResults.textContent = "No cookies match your current filters.";
    byRelationshipTab.appendChild(noResults);
  }

  // Add expiration warnings after rendering
  addExpirationWarnings();

  // Setup event handlers
  setupCategoryToggles();
  addCopyButtonsToCookieValues();
  setupCookieCheckboxes();
  setupDecodeButtons();

  // Setup event listeners for delete buttons
  document.querySelectorAll(".delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const cookieName = btn.dataset.cookieName;
      const cookieDomain = btn.dataset.cookieDomain;
      const cookiePath = btn.dataset.cookiePath;

      deleteCookie({
        name: cookieName,
        domain: cookieDomain,
        path: cookiePath,
      });
    });
  });
}

// Implement a proper renderAllCookies function
function renderAllCookies(cookies, searchTerm = "", page = 1) {
  // Check if tab exists
  const allCookiesTab = document.getElementById("allCookiesTab");
  if (!allCookiesTab) return;

  allCookiesTab.innerHTML = "";

  if (!cookies || cookies.length === 0) {
    allCookiesTab.innerHTML =
      "<div class='no-cookies'>No cookies found for this site.</div>";
    return;
  }

  // Filter cookies based on search term and advanced filters - use the safe function
  const filteredCookies = cookies.filter((cookie) =>
    safeApplyCookieFilters(cookie, searchTerm),
  );

  if (filteredCookies.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "no-cookies";
    noResults.textContent = "No cookies match your current filters.";
    allCookiesTab.appendChild(noResults);
    return;
  }

  // Create container for all cookies
  const cookiesContainer = document.createElement("div");
  cookiesContainer.className = "all-cookies-container";
  allCookiesTab.appendChild(cookiesContainer);

  // Add individual cookies
  filteredCookies.forEach((cookie) => {
    // Use window.createCookieItemHTML to ensure global access
    const cookieHTML = window.createCookieItemHTML(cookie);
    cookiesContainer.insertAdjacentHTML("beforeend", cookieHTML);
  });

  // Add expiration warnings after rendering
  addExpirationWarnings();

  // Setup event handlers
  addCopyButtonsToCookieValues();
  setupCookieCheckboxes();
  setupDecodeButtons();

  // Setup event listeners for delete buttons
  document.querySelectorAll(".delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const cookieName = btn.dataset.cookieName;
      const cookieDomain = btn.dataset.cookieDomain;
      const cookiePath = btn.dataset.cookiePath;

      deleteCookie({
        name: cookieName,
        domain: cookieDomain,
        path: cookiePath,
      });
    });
  });
}

// Fix the tab switching functionality
document.addEventListener("DOMContentLoaded", function () {
  // Set up tab navigation
  document.querySelectorAll(".category-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      // Get current active tab
      const currentActiveTab = document.querySelector(".category-tab.active");
      const currentActiveContent = document.querySelector(
        ".tab-content.active",
      );

      // Get clicked tab and corresponding content
      const clickedTabId = this.getAttribute("data-tab");
      const clickedContent = document.getElementById(clickedTabId);

      // Remove active class from current tab/content
      if (currentActiveTab) currentActiveTab.classList.remove("active");
      if (currentActiveContent) currentActiveContent.classList.remove("active");

      // Add active class to clicked tab/content
      this.classList.add("active");
      if (clickedContent) clickedContent.classList.add("active");

      // If Charts tab is clicked, render charts
      if (clickedTabId === "chartsTab" && typeof renderCharts === "function") {
        renderCharts();
      }
    });
  });
});

// Implement a proper function to restore checkbox selections
function restoreCheckboxSelections() {
  // If there are selected cookies, check their checkboxes
  if (selectedCookies && selectedCookies.size > 0) {
    // Find all cookie checkboxes
    const checkboxes = document.querySelectorAll(".cookie-checkbox");

    // For each checkbox, check if its cookie is in the selectedCookies set
    checkboxes.forEach((checkbox) => {
      const cookieName = checkbox.getAttribute("data-cookie-name");
      const cookieDomain = checkbox.getAttribute("data-cookie-domain");
      const cookiePath = checkbox.getAttribute("data-cookie-path") || "/";

      // Create a unique ID for this cookie
      const cookieId = `${cookieName}_${cookieDomain}_${cookiePath}`;

      // Set checkbox state based on selection
      checkbox.checked = selectedCookies.has(cookieId);

      // Set the data-cookie-id attribute for easier reference
      checkbox.setAttribute("data-cookie-id", cookieId);
    });

    // Show bulk actions bar if there are selections
    if (bulkActionsBar) {
      bulkActionsBar.style.display = selectedCookies.size > 0 ? "flex" : "none";
    }
  }
}

// Change the problematic condition that's throwing an error
if (typeof safeComparisonManager !== "undefined" && safeComparisonManager) {
  safeComparisonManager.formatDate = function (timestamp) {
    if (!timestamp) return "Session cookie";
    return new Date(timestamp * 1000).toLocaleString();
  };
}

// Replace with:
// Create a simple formatDate function available everywhere
function formatCookieDate(timestamp) {
  if (!timestamp) return "Session cookie";
  return new Date(timestamp * 1000).toLocaleString();
}

// Initialize theme as a standalone function to avoid reference errors
function safeInitializeTheme() {
  try {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem("cookieOrganizerTheme");

    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
      // Update theme icon if function exists
      if (typeof updateThemeIcon === "function") {
        updateThemeIcon(savedTheme);
      }
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      // If no saved preference, use system preference
      document.documentElement.setAttribute("data-theme", "dark");
      if (typeof updateThemeIcon === "function") {
        updateThemeIcon("dark");
      }
    }
  } catch (error) {
    console.error("Error initializing theme:", error);
  }
}

// Safely apply cookie filters with fallback
function safeApplyCookieFilters(cookie, searchTerm = "") {
  try {
    // If the real function exists, use it
    if (typeof applyCookieFilters === "function") {
      return applyCookieFilters(cookie, searchTerm);
    }

    // Otherwise use a simple fallback that just matches the search term
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        cookie.name.toLowerCase().includes(searchTermLower) ||
        cookie.domain.toLowerCase().includes(searchTermLower) ||
        (cookie.value && cookie.value.toLowerCase().includes(searchTermLower))
      );
    }

    return true; // No filtering
  } catch (error) {
    console.error("Error applying cookie filters:", error);
    return true; // Allow all cookies if there's an error
  }
}

// Update the DOMContentLoaded event listener to use the safe functions
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM content loaded - using safe functions");

  // Initialize tab visibility and event listeners
  initializeTabs();

  // Initialize purpose stats visibility based on active tab
  const activeTabId = document.querySelector(".tab-content.active")?.id;
  const purposeStats = document.querySelector(".category-stats:nth-of-type(2)");
  if (purposeStats) {
    if (activeTabId === "byPurposeTab") {
      purposeStats.style.display = "flex";
      setTimeout(() => {
        purposeStats.style.opacity = "1";
      }, 10);
    } else {
      purposeStats.style.opacity = "0";
      setTimeout(() => {
        if (activeTabId !== "byPurposeTab") {
          purposeStats.style.display = "none";
        }
      }, 300);
    }
  }

  // Set up event listeners for tab switching
  document.querySelectorAll(".category-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      // Get clicked tab and corresponding content
      const clickedTabId = this.getAttribute("data-tab");

      // Update purpose stats visibility
      const purposeStats = document.querySelector(
        ".category-stats:nth-of-type(2)",
      );
      if (purposeStats) {
        if (clickedTabId === "byPurposeTab") {
          purposeStats.style.display = "flex";
          setTimeout(() => {
            purposeStats.style.opacity = "1";
          }, 10);
        } else {
          purposeStats.style.opacity = "0";
          setTimeout(() => {
            if (clickedTabId !== "byPurposeTab") {
              purposeStats.style.display = "none";
            }
          }, 300);
        }
      }

      // If Compare tab is clicked, make sure it's properly initialized
      if (clickedTabId === "compareTab") {
        safeComparisonManager.init();
      }

      // Show the selected tab
      showTab(clickedTabId);
    });
  });
});

// Define a basic applyCookieFilters function if it doesn't exist
function applyCookieFilters(cookie, searchTerm = "") {
  // Apply search filtering
  if (searchTerm) {
    const searchTermLower = searchTerm.toLowerCase();
    if (
      !cookie.name.toLowerCase().includes(searchTermLower) &&
      !cookie.domain.toLowerCase().includes(searchTermLower) &&
      !(cookie.value && cookie.value.toLowerCase().includes(searchTermLower))
    ) {
      return false;
    }
  }

  // Check if we have active filters
  const secureFilter = document.getElementById("secureFilter");
  const httpOnlyFilter = document.getElementById("httpOnlyFilter");
  const sessionFilter = document.getElementById("sessionFilter");

  // Apply checkbox filters if they exist
  if (secureFilter && secureFilter.checked && !cookie.secure) {
    return false;
  }

  if (httpOnlyFilter && httpOnlyFilter.checked && !cookie.httpOnly) {
    return false;
  }

  if (sessionFilter && sessionFilter.checked && cookie.expirationDate) {
    return false;
  }

  // If all filters pass, show the cookie
  return true;
}

// Define global variables for sharing across functions
let siteCookies = [];
let cookiesByPurpose = {};
let cookiesByRelationship = {};
let siteUrl = "";

// Define a function for cookie purpose descriptions
// Add this section after the getPurposeDescription function
// Define missing functions required for cookie loading
function loadCookies() {
  // Call scanCurrentSiteCookies to load cookies from the current site
  scanCurrentSiteCookies();
}

function renderCookies(searchTerm = "") {
  console.log("Rendering cookies...");

  // Get the active tab content
  const activeTabContent = document.querySelector(".tab-content.active");
  const activeTabId = activeTabContent ? activeTabContent.id : "";

  // Clear loading indicator
  const loadingIndicator = document.getElementById("loadingIndicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }

  // Show "no cookies" message if there are no cookies
  const noCookiesEl = document.getElementById("noCookies");
  if (!siteCookies || siteCookies.length === 0) {
    if (noCookiesEl) noCookiesEl.style.display = "block";
    return;
  } else {
    if (noCookiesEl) noCookiesEl.style.display = "none";
  }

  // Manage visibility of purpose stats based on active tab
  const purposeStats = document.querySelector(".category-stats:nth-of-type(2)");
  if (purposeStats) {
    if (activeTabId === "byPurposeTab") {
      purposeStats.style.display = "flex";
      setTimeout(() => {
        purposeStats.style.opacity = "1";
      }, 10);
    } else {
      purposeStats.style.opacity = "0";
      setTimeout(() => {
        if (activeTabId !== "byPurposeTab") {
          purposeStats.style.display = "none";
        }
      }, 300);
    }
  }

  // Render cookies based on active tab
  if (activeTabId === "byPurposeTab" && cookiesByPurpose) {
    // Use renderCookiesByPurpose if it exists, otherwise log error
    if (typeof renderCookiesByPurpose === "function") {
      renderCookiesByPurpose(cookiesByPurpose, searchTerm);
    } else {
      console.error("renderCookiesByPurpose function is not defined");
      document.getElementById("byPurposeTab").innerHTML =
        "<div class='error-message'>Cannot render cookies by purpose. Function not defined.</div>";
    }
  } else if (activeTabId === "byRelationshipTab" && cookiesByRelationship) {
    // Use renderCookiesByRelationship if it exists, otherwise log error
    if (typeof renderCookiesByRelationship === "function") {
      renderCookiesByRelationship(cookiesByRelationship, searchTerm);
    } else {
      console.error("renderCookiesByRelationship function is not defined");
      document.getElementById("byRelationshipTab").innerHTML =
        "<div class='error-message'>Cannot render cookies by relationship. Function not defined.</div>";
    }
  } else if (activeTabId === "allCookiesTab" && siteCookies) {
    // Use renderAllCookies if it exists, otherwise log error
    if (typeof renderAllCookies === "function") {
      renderAllCookies(siteCookies, searchTerm);
    } else {
      console.error("renderAllCookies function is not defined");
      document.getElementById("allCookiesTab").innerHTML =
        "<div class='error-message'>Cannot render all cookies. Function not defined.</div>";
    }
  }
}

// Define basic implementations of other missing functions
function updateStats(stats) {
  console.log("Updating cookie stats:", stats);

  if (!stats) return;

  // Update total and relationship counts
  const totalCookiesEl = document.getElementById("totalCookies");
  const primaryCountEl = document.getElementById("primaryCount");
  const secondaryCountEl = document.getElementById("secondaryCount");
  const thirdPartyCountEl = document.getElementById("thirdPartyCount");
  const siteUrlEl = document.getElementById("siteUrl");

  if (totalCookiesEl) totalCookiesEl.textContent = stats.total || 0;
  if (primaryCountEl) primaryCountEl.textContent = stats.primary || 0;
  if (secondaryCountEl) secondaryCountEl.textContent = stats.secondary || 0;
  if (thirdPartyCountEl) thirdPartyCountEl.textContent = stats.thirdParty || 0;

  // Update purpose counts if they exist
  if (stats.byPurpose) {
    const necessaryCountEl = document.getElementById("necessaryCount");
    const preferencesCountEl = document.getElementById("preferencesCount");
    const analyticsCountEl = document.getElementById("analyticsCount");
    const marketingCountEl = document.getElementById("marketingCount");
    const socialCountEl = document.getElementById("socialCount");
    const unknownCountEl = document.getElementById("unknownCount");

    if (necessaryCountEl)
      necessaryCountEl.textContent = stats.byPurpose.necessary || 0;
    if (preferencesCountEl)
      preferencesCountEl.textContent = stats.byPurpose.preferences || 0;
    if (analyticsCountEl)
      analyticsCountEl.textContent = stats.byPurpose.analytics || 0;
    if (marketingCountEl)
      marketingCountEl.textContent = stats.byPurpose.marketing || 0;
    if (socialCountEl) socialCountEl.textContent = stats.byPurpose.social || 0;
    if (unknownCountEl)
      unknownCountEl.textContent = stats.byPurpose.unknown || 0;
  }

  // Update site URL
  if (siteUrlEl && siteUrl) {
    try {
      const url = new URL(siteUrl);
      siteUrlEl.textContent = url.hostname;
    } catch (e) {
      siteUrlEl.textContent = siteUrl;
    }
  }
}

// Define placeholder for required but missing functions
function setupCookieCheckboxes() {
  console.log("setupCookieCheckboxes called");
  // Basic implementation to prevent errors
}

function addExpirationWarnings() {
  console.log("addExpirationWarnings called");
  // Basic implementation to prevent errors
}

function addCopyButtonsToCookieValues() {
  console.log("addCopyButtonsToCookieValues called");
  // Basic implementation to prevent errors
}

function setupDecodeButtons() {
  console.log("setupDecodeButtons called");
  // Basic implementation to prevent errors
}

function deleteCookie(cookie) {
  console.log("Deleting cookie:", cookie);

  if (!cookie || !cookie.name || !cookie.domain) {
    console.error("Invalid cookie data for deletion");
    return;
  }

  // Send delete request to background script
  chrome.runtime.sendMessage(
    {
      action: "deleteCookie",
      cookie: cookie,
    },
    function (response) {
      if (chrome.runtime.lastError) {
        console.error("Error deleting cookie:", chrome.runtime.lastError);
        return;
      }

      if (response && response.success) {
        console.log("Cookie deleted successfully");
        // Refresh cookies
        scanCurrentSiteCookies();
      } else {
        console.error(
          "Failed to delete cookie:",
          response ? response.error : "Unknown error",
        );
      }
    },
  );
}

// Add basic implementation of renderCookiesByPurpose
function renderCookiesByPurpose(data, searchTerm = "") {
  console.log("Rendering cookies by purpose");

  // Get the tab content element
  const byPurposeTab = document.getElementById("byPurposeTab");
  if (!byPurposeTab) return;

  // Clear existing content
  byPurposeTab.innerHTML = "";

  if (!data || Object.keys(data).length === 0) {
    byPurposeTab.innerHTML =
      "<div class='no-cookies'>No cookies found for this site.</div>";
    return;
  }

  // Purpose categories in order of display
  const purposeOrder = [
    "necessary",
    "preferences",
    "analytics",
    "marketing",
    "social",
    "unknown",
  ];

  // Process each category
  purposeOrder.forEach((purpose) => {
    if (!data[purpose] || data[purpose].length === 0) return;

    const cookies = data[purpose];

    // Filter cookies based on search term and advanced filters
    const filteredCookies = cookies.filter((cookie) =>
      safeApplyCookieFilters(cookie, searchTerm),
    );

    if (filteredCookies.length === 0) return;

    // Create purpose category item
    const purposeItem = document.createElement("div");
    purposeItem.className = `purpose-item ${purpose}`;

    // Purpose header
    const purposeHeader = document.createElement("div");
    purposeHeader.className = "category-header";
    purposeHeader.dataset.purpose = purpose;
    purposeHeader.innerHTML = `
      <div><span class="purpose-icon ${purpose}"></span>${purposeNames[purpose] || purpose}</div>
      <div class="category-cookie-count">${filteredCookies.length} cookie${filteredCookies.length !== 1 ? "s" : ""}</div>
    `;

    // Add purpose item to container first
    purposeItem.appendChild(purposeHeader);

    // Container for cookies in this purpose
    const cookiesContainer = document.createElement("div");
    cookiesContainer.className = "category-cookies";
    cookiesContainer.dataset.purpose = purpose;
    purposeItem.appendChild(cookiesContainer);

    // Add to DOM before adding cookies
    byPurposeTab.appendChild(purposeItem);

    // Add individual cookies
    filteredCookies.forEach((cookie) => {
      const cookieHTML = createCookieItemHTML(cookie);
      cookiesContainer.insertAdjacentHTML("beforeend", cookieHTML);
    });
  });

  // If no cookies match filters, show message
  if (byPurposeTab.children.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "no-cookies";
    noResults.textContent = "No cookies match your current filters.";
    byPurposeTab.appendChild(noResults);
  }

  // Add expiration warnings after rendering
  addExpirationWarnings();

  // Setup event handlers
  setupCategoryToggles();
  addCopyButtonsToCookieValues();
  setupCookieCheckboxes();
  setupDecodeButtons();

  // Setup event listeners for delete buttons
  document.querySelectorAll(".delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const cookieName = btn.dataset.cookieName;
      const cookieDomain = btn.dataset.cookieDomain;
      const cookiePath = btn.dataset.cookiePath;

      deleteCookie({
        name: cookieName,
        domain: cookieDomain,
        path: cookiePath,
      });
    });
  });
}

// Add utility function for debouncing
function debounce(func, delay) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

// Add utility function for toggling theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("cookieOrganizerTheme", newTheme);

  // Update theme icon if function exists
  if (typeof updateThemeIcon === "function") {
    updateThemeIcon(newTheme);
  }
}

// Add a basic implementation of renderCharts
function renderCharts() {
  console.log("Rendering charts...");

  // Get chart canvas elements
  const purposeChartCanvas = document.getElementById("purposeChart");
  const relationshipChartCanvas = document.getElementById("relationshipChart");
  const securityChartCanvas = document.getElementById("securityChart");
  const sessionChartCanvas = document.getElementById("sessionChart");

  // Clear existing charts
  clearExistingCharts();

  // Skip if chart canvas elements don't exist
  if (
    !purposeChartCanvas ||
    !relationshipChartCanvas ||
    !securityChartCanvas ||
    !sessionChartCanvas
  ) {
    console.warn("Chart canvas elements not found");
    return;
  }

  // Skip if no cookies available
  if (!siteCookies || siteCookies.length === 0) {
    displayNoDataMessage();
    console.warn("No cookies available for charts");
    return;
  }

  console.log("Rendering charts with", siteCookies.length, "cookies");

  // Chart colors
  const chartColors = {
    necessary: "rgba(25, 135, 84, 0.7)", // Green
    preferences: "rgba(13, 110, 253, 0.7)", // Blue
    analytics: "rgba(255, 193, 7, 0.7)", // Yellow
    marketing: "rgba(220, 53, 69, 0.7)", // Red
    social: "rgba(111, 66, 193, 0.7)", // Purple
    unknown: "rgba(108, 117, 125, 0.7)", // Gray

    primary: "rgba(25, 135, 84, 0.7)", // Green
    secondary: "rgba(13, 110, 253, 0.7)", // Blue
    thirdParty: "rgba(220, 53, 69, 0.7)", // Red

    secure: "rgba(25, 135, 84, 0.7)", // Green
    notSecure: "rgba(220, 53, 69, 0.7)", // Red
    httpOnly: "rgba(13, 110, 253, 0.7)", // Blue
    notHttpOnly: "rgba(255, 193, 7, 0.7)", // Yellow

    session: "rgba(13, 110, 253, 0.7)", // Blue
    persistent: "rgba(111, 66, 193, 0.7)", // Purple
  };

  // Create Purpose Chart (Pie)
  createPurposeChart(purposeChartCanvas, chartColors);

  // Create Relationship Chart (Pie)
  createRelationshipChart(relationshipChartCanvas, chartColors);

  // Create Security Chart (Bar)
  createSecurityChart(securityChartCanvas, chartColors);

  // Create Session vs Persistent Chart (Pie)
  createSessionChart(sessionChartCanvas, chartColors);
}

// Helper function to clear existing charts
function clearExistingCharts() {
  // Get all chart canvases
  const chartCanvases = document.querySelectorAll(".chart-wrapper canvas");

  // Destroy existing Chart instances to prevent memory leaks
  chartCanvases.forEach((canvas) => {
    const chartInstance = Chart.getChart(canvas);
    if (chartInstance) {
      chartInstance.destroy();
    }
  });
}

// Helper function to display no data message
function displayNoDataMessage() {
  const chartSections = document.querySelectorAll(".chart-section");

  chartSections.forEach((section) => {
    const canvas = section.querySelector("canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "14px Arial";
      ctx.fillStyle = getComputedStyle(
        document.documentElement,
      ).getPropertyValue("--text-color");
      ctx.textAlign = "center";
      ctx.fillText(
        "No cookie data available",
        canvas.width / 2,
        canvas.height / 2,
      );
    }
  });
}

// Helper function to create the Purpose Chart
function createPurposeChart(canvas, colors) {
  // Count cookies by purpose
  const purposeCounts = {
    necessary: 0,
    preferences: 0,
    analytics: 0,
    marketing: 0,
    social: 0,
    unknown: 0,
  };

  // Fix for createPurposeChart
  siteCookies.forEach((cookie) => {
    const purpose = cookie.purposeCategory || "unknown";
    if (Object.prototype.hasOwnProperty.call(purposeCounts, purpose)) {
      purposeCounts[purpose]++;
    } else {
      purposeCounts.unknown++;
    }
  });

  // Create dataset
  const data = {
    labels: [
      "Necessary",
      "Preferences",
      "Analytics",
      "Marketing",
      "Social",
      "Unknown",
    ],
    datasets: [
      {
        data: [
          purposeCounts.necessary,
          purposeCounts.preferences,
          purposeCounts.analytics,
          purposeCounts.marketing,
          purposeCounts.social,
          purposeCounts.unknown,
        ],
        backgroundColor: [
          colors.necessary,
          colors.preferences,
          colors.analytics,
          colors.marketing,
          colors.social,
          colors.unknown,
        ],
        borderWidth: 1,
      },
    ],
  };

  // Remove categories with zero cookies
  const filteredLabels = [];
  const filteredData = [];
  const filteredColors = [];

  for (let i = 0; i < data.labels.length; i++) {
    if (data.datasets[0].data[i] > 0) {
      filteredLabels.push(data.labels[i]);
      filteredData.push(data.datasets[0].data[i]);
      filteredColors.push(data.datasets[0].backgroundColor[i]);
    }
  }

  // Update dataset with filtered data
  data.labels = filteredLabels;
  data.datasets[0].data = filteredData;
  data.datasets[0].backgroundColor = filteredColors;

  // Create chart
  new Chart(canvas, {
    type: "pie",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-color",
            ),
          },
        },
      },
    },
  });

  // Create chart for relationship chart
  new Chart(canvas, {
    type: "doughnut",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-color",
            ),
          },
        },
      },
    },
  });

  // Create chart for security chart
  new Chart(canvas, {
    type: "bar",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-color",
            ),
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--border-color",
            ),
          },
        },
        x: {
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-color",
            ),
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--border-color",
            ),
          },
        },
      },
    },
  });

  // Create chart for session chart
  new Chart(canvas, {
    type: "pie",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-color",
            ),
          },
        },
      },
    },
  });
}

// Helper function to create the Relationship Chart
function createRelationshipChart(canvas, colors) {
  // Count cookies by relationship
  const relationshipCounts = {
    primary: 0,
    secondary: 0,
    thirdParty: 0,
  };

  // Fix for createRelationshipChart
  siteCookies.forEach((cookie) => {
    const relationship = cookie.relationshipCategory || "thirdParty";
    if (
      Object.prototype.hasOwnProperty.call(relationshipCounts, relationship)
    ) {
      relationshipCounts[relationship]++;
    } else {
      relationshipCounts.thirdParty++;
    }
  });

  // Create dataset
  const data = {
    labels: ["Primary Domain", "Secondary (Subdomain)", "Third Party"],
    datasets: [
      {
        data: [
          relationshipCounts.primary,
          relationshipCounts.secondary,
          relationshipCounts.thirdParty,
        ],
        backgroundColor: [colors.primary, colors.secondary, colors.thirdParty],
        borderWidth: 1,
      },
    ],
  };

  // Create chart
  new Chart(canvas, {
    type: "doughnut",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-color",
            ),
          },
        },
      },
    },
  });
}

// Helper function to create the Security Chart
function createSecurityChart(canvas, colors) {
  // Count security attributes
  let secureCount = 0;
  let notSecureCount = 0;
  let httpOnlyCount = 0;
  let notHttpOnlyCount = 0;

  siteCookies.forEach((cookie) => {
    if (cookie.secure) {
      secureCount++;
    } else {
      notSecureCount++;
    }

    if (cookie.httpOnly) {
      httpOnlyCount++;
    } else {
      notHttpOnlyCount++;
    }
  });

  // Create dataset
  const data = {
    labels: ["Secure", "Not Secure", "HttpOnly", "Not HttpOnly"],
    datasets: [
      {
        data: [secureCount, notSecureCount, httpOnlyCount, notHttpOnlyCount],
        backgroundColor: [
          colors.secure,
          colors.notSecure,
          colors.httpOnly,
          colors.notHttpOnly,
        ],
        borderWidth: 1,
      },
    ],
  };

  // Create chart
  new Chart(canvas, {
    type: "bar",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-color",
            ),
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--border-color",
            ),
          },
        },
        x: {
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-color",
            ),
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--border-color",
            ),
          },
        },
      },
    },
  });
}

// Helper function to create the Session vs Persistent Chart
function createSessionChart(canvas, colors) {
  // Count session vs persistent cookies
  let sessionCount = 0;
  let persistentCount = 0;

  siteCookies.forEach((cookie) => {
    if (cookie.expirationDate) {
      persistentCount++;
    } else {
      sessionCount++;
    }
  });

  // Create dataset
  const data = {
    labels: ["Session Cookies", "Persistent Cookies"],
    datasets: [
      {
        data: [sessionCount, persistentCount],
        backgroundColor: [colors.session, colors.persistent],
        borderWidth: 1,
      },
    ],
  };

  // Create chart
  new Chart(canvas, {
    type: "pie",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-color",
            ),
          },
        },
      },
    },
  });
}

// Update the document.addEventListener("DOMContentLoaded") section to ensure it calls loadCookies
document.addEventListener("DOMContentLoaded", function () {
  console.log("Cookie Organizer extension loaded");

  // Access elements
  const refreshButton = document.getElementById("refreshButton");
  const searchBox = document.getElementById("searchBox");
  const themeToggle = document.getElementById("themeToggle");

  // Initialize theme using the function we've defined properly
  if (typeof initializeTheme === "function") {
    initializeTheme();
  } else {
    console.error("initializeTheme function not found");
    // Fallback to the safe implementation
    safeInitializeTheme();
  }

  // Add this explicit call to loadCookies to ensure cookies load on popup open
  if (typeof loadCookies === "function") {
    console.log("Loading cookies automatically...");
    loadCookies();
  } else {
    console.error("loadCookies function not found");
    // Fallback to direct scan
    if (typeof scanCurrentSiteCookies === "function") {
      console.log("Scanning cookies directly...");
      scanCurrentSiteCookies();
    }
  }

  // Set up event listeners
  if (refreshButton) {
    refreshButton.addEventListener("click", function () {
      console.log("Refresh button clicked");
      if (typeof scanCurrentSiteCookies === "function") {
        scanCurrentSiteCookies();
      }
    });
  }

  if (searchBox) {
    searchBox.addEventListener("input", function () {
      if (
        typeof debounce === "function" &&
        typeof renderCookies === "function"
      ) {
        debounce(function () {
          renderCookies(searchBox.value);
        }, 300)();
      } else {
        console.error("debounce or renderCookies function not found");
      }
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      if (typeof toggleTheme === "function") {
        toggleTheme();
      } else {
        console.error("toggleTheme function not found");
      }
    });
  }

  // Set up tab navigation
  document.querySelectorAll(".category-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      // Get current active tab
      const currentActiveTab = document.querySelector(".category-tab.active");
      const currentActiveContent = document.querySelector(
        ".tab-content.active",
      );

      // Get clicked tab and corresponding content
      const clickedTabId = this.getAttribute("data-tab");
      const clickedContent = document.getElementById(clickedTabId);

      // Remove active class from current tab/content
      if (currentActiveTab) currentActiveTab.classList.remove("active");
      if (currentActiveContent) currentActiveContent.classList.remove("active");

      // Add active class to clicked tab/content
      this.classList.add("active");
      if (clickedContent) clickedContent.classList.add("active");

      // If Charts tab is clicked, render charts
      if (clickedTabId === "chartsTab" && typeof renderCharts === "function") {
        renderCharts();
      }

      // If Compare tab is clicked, make sure it's properly initialized
      if (clickedTabId === "compareTab") {
        if (
          typeof window.safeComparisonManager !== "undefined" &&
          window.safeComparisonManager
        ) {
          window.safeComparisonManager.init();
        }
      }
    });
  });

  // Initialize managers if they exist
  if (
    typeof window.settingsManager !== "undefined" &&
    window.settingsManager &&
    typeof window.settingsManager.init === "function"
  ) {
    window.settingsManager.init();
  }

  if (
    typeof tutorialManager !== "undefined" &&
    tutorialManager &&
    typeof tutorialManager.init === "function"
  ) {
    tutorialManager.init();
  }

  // Initialize comparison manager
  if (
    typeof window.safeComparisonManager !== "undefined" &&
    window.safeComparisonManager &&
    typeof window.safeComparisonManager.init === "function"
  ) {
    window.safeComparisonManager.init();
  }

  // Load cookies automatically when the popup opens
  if (typeof loadCookies === "function") {
    console.log("Auto-loading cookies when popup opens");
    loadCookies();
  } else {
    console.error("loadCookies function not found");
  }

  // Initialize copy as cURL buttons
  setTimeout(addCopyAsCurlButtons, 500);

  // Set up auto-refresh if enabled in settings
  chrome.storage.local.get(
    ["autoRefresh", "refreshInterval"],
    function (result) {
      if (result.autoRefresh) {
        const interval = result.refreshInterval || 60; // Default to 60 seconds
        if (typeof startAutoRefresh === "function") {
          console.log(
            `Starting auto-refresh with interval: ${interval} seconds`,
          );
          startAutoRefresh(interval);
        }
      }
    },
  );
});

// Add implementation of setupCategoryToggles function
function setupCategoryToggles() {
  console.log("Setting up category toggles");

  // Get all category headers
  const categoryHeaders = document.querySelectorAll(".category-header");

  // Add click event to toggle category content
  categoryHeaders.forEach((header) => {
    header.addEventListener("click", function () {
      const cookiesContainer =
        this.parentNode.querySelector(".category-cookies");
      if (cookiesContainer) {
        cookiesContainer.classList.toggle("open");
      }
    });
  });
}

// Add auto-refresh functionality
const autoRefresh = {
  intervalId: null,

  init: function () {
    const autoRefreshToggle = document.getElementById("autoRefreshToggle");
    const autoRefreshInterval = document.getElementById("autoRefreshInterval");

    if (autoRefreshToggle) {
      autoRefreshToggle.addEventListener("change", () => {
        if (autoRefreshToggle.checked) {
          const seconds = parseInt(autoRefreshInterval.value) || 30;
          this.start(seconds);
        } else {
          this.stop();
        }
      });
    }

    if (autoRefreshInterval) {
      autoRefreshInterval.addEventListener("change", () => {
        if (autoRefreshToggle.checked) {
          const seconds = parseInt(autoRefreshInterval.value) || 30;
          this.stop();
          this.start(seconds);
        }
      });
    }
  },

  start: function (seconds) {
    this.stop();
    console.log(`Starting auto-refresh every ${seconds} seconds`);

    this.intervalId = setInterval(() => {
      console.log("Auto-refreshing cookies...");
      if (typeof scanCurrentSiteCookies === "function") {
        scanCurrentSiteCookies();
      }
    }, seconds * 1000);

    // Show notification
    const notification = document.getElementById("autoRefreshNotification");
    if (notification) {
      notification.textContent = `Auto-refresh active: ${seconds}s`;
      notification.style.display = "block";
    }
  },

  stop: function () {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;

      // Hide notification
      const notification = document.getElementById("autoRefreshNotification");
      if (notification) {
        notification.style.display = "none";
      }

      console.log("Auto-refresh stopped");
    }
  },
};

// Ensure the createCookieItemHTML is accessible globally
// Make the createCookieItemHTML function accessible globally by moving it outside any closures
window.createCookieItemHTML = function (cookie) {
  if (!cookie) return "";

  // Format expiration date
  let expirationText = "Session cookie";
  let expirationWarning = "";

  if (cookie.expirationDate) {
    const expDate = new Date(cookie.expirationDate * 1000);
    expirationText = expDate.toLocaleString();

    // Add warning for cookies expiring within 3 days
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    if (expDate < threeDaysFromNow) {
      expirationWarning =
        "<span class=\"expiration-warning\" title=\"This cookie will expire soon\">⚠️</span>";
    }
  }

  // Create badges for cookie attributes
  const badges = [];
  if (cookie.secure) badges.push("<span class=\"badge secure\">Secure</span>");
  if (cookie.httpOnly)
    badges.push("<span class=\"badge httponly\">HttpOnly</span>");
  if (!cookie.expirationDate)
    badges.push("<span class=\"badge session\">Session</span>");

  // Add relationship badge if available
  if (cookie.relationshipCategory) {
    badges.push(
      `<span class="badge ${cookie.relationshipCategory}">${getRelationshipDescription(cookie.relationshipCategory)}</span>`,
    );
  }

  // Add purpose badge if available
  if (cookie.purposeCategory) {
    badges.push(
      `<span class="badge ${cookie.purposeCategory}">${
        typeof getPurposeDescription === "function"
          ? getPurposeDescription(cookie.purposeCategory)
          : cookie.purposeCategory
      }</span>`,
    );
  }

  // Generate cookie ID for selection
  const cookieId = `${cookie.name}_${cookie.domain}_${cookie.path || "/"}`;

  // Generate cookie item HTML
  return `
    <div class="cookie-item" data-cookie-id="${cookieId}">
      <input type="checkbox" class="cookie-checkbox" data-cookie-id="${cookieId}">
      <div class="cookie-content">
        <div class="cookie-header">
          <div class="cookie-name-container">
            <span class="cookie-name">${cookie.name}</span>
            ${expirationWarning}
          </div>
          <div class="cookie-actions">
            <button class="delete" data-cookie-name="${cookie.name}" data-cookie-domain="${cookie.domain}" data-cookie-path="${cookie.path || "/"}">Delete</button>
          </div>
        </div>
        <div class="cookie-metadata">
          ${badges.join("")}
        </div>
        <div class="cookie-details">
          Domain: ${cookie.domain} | Path: ${cookie.path || "/"} | Expires: ${expirationText}
        </div>
        <div class="cookie-value" data-original-value="${encodeURIComponent(cookie.value || "")}">
          ${cookie.value || "(empty value)"}
        </div>
      </div>
    </div>
  `;
};

// Make the getRelationshipDescription function available globally
function getRelationshipDescription(relationship) {
  return relationshipNames[relationship] || relationship;
}

// Helper function to initialize tabs
function initializeTabs() {
  // Get all tab elements
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const currentTabName = document.getElementById("currentTabName");
  const tabActionsBtn = document.getElementById("tabActionsBtn");
  const tabActionsMenu = document.getElementById("tabActionsMenu");

  // Set default active tab if none is active
  const activeTab = document.querySelector(".tab.active");
  if (!activeTab && tabs.length > 0) {
    tabs[0].classList.add("active");
    const firstTabId = tabs[0].dataset.tab;
    const tabContent = document.getElementById(firstTabId);
    if (tabContent) {
      tabContent.classList.add("active");
      if (currentTabName) {
        currentTabName.textContent = tabs[0].textContent.trim();
      }
    }
  }

  // Add click event listeners to all tabs
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      showTab(tabId);
    });
  });

  // Tab actions menu toggle
  if (tabActionsBtn && tabActionsMenu) {
    tabActionsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      tabActionsMenu.classList.toggle("visible");
    });

    // Close menu when clicking outside
    document.addEventListener("click", () => {
      tabActionsMenu.classList.remove("visible");
    });

    // Prevent menu close when clicking inside menu
    tabActionsMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Handle tab action buttons
    const exportCurrentViewBtn = document.getElementById("exportCurrentView");
    const refreshCurrentViewBtn = document.getElementById("refreshCurrentView");

    if (exportCurrentViewBtn) {
      exportCurrentViewBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // Trigger export dropdown for current view
        document.getElementById("exportButton").click();
        tabActionsMenu.classList.remove("visible");
      });
    }

    if (refreshCurrentViewBtn) {
      refreshCurrentViewBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // Refresh current view
        document.getElementById("refreshButton").click();
        tabActionsMenu.classList.remove("visible");
      });
    }
  }
}

// Helper function to show a specific tab
function showTab(tabId) {
  if (!tabId) return;

  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const currentTabName = document.getElementById("currentTabName");

  // Hide all tabs and remove active class
  tabs.forEach((tab) => {
    tab.classList.remove("active");
  });

  tabContents.forEach((content) => {
    content.classList.remove("active");
  });

  // Show the selected tab
  const selectedTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
  const selectedContent = document.getElementById(tabId);

  if (selectedTab) {
    selectedTab.classList.add("active");
  }

  if (selectedContent) {
    selectedContent.classList.add("active");
  }

  // Update the current tab indicator
  if (currentTabName && selectedTab) {
    currentTabName.textContent = selectedTab.textContent.trim();
  }

  // Perform tab-specific actions
  if (tabId === "chartsTab") {
    console.log("Charts tab selected, rendering charts...");
    // Make sure siteCookies is available
    if (!siteCookies || siteCookies.length === 0) {
      // If we don't have cookies yet, scan them first then render charts
      scanCurrentSiteCookies()
        .then(() => {
          setTimeout(renderCharts, 500); // Short delay to ensure data is processed
        })
        .catch((error) => {
          console.error("Error loading cookies for charts:", error);
          displayNoDataMessage();
        });
    } else {
      // We have cookies, render charts directly
      renderCharts();
    }
  } else if (tabId === "logsTab") {
    // Refresh logs when tab is shown
    document.getElementById("refreshLogsBtn")?.click();
  } else if (tabId === "monitoringTab") {
    // Initialize monitoring tab if it's not already initialized
    if (typeof initMonitoringTab === "function") {
      initMonitoringTab();
    }
  } else if (tabId === "compareTab") {
    // Initialize comparison view if available
    try {
      // Safely check and call initialization function for comparison tab
      const compareTabContent = document.getElementById("compareTab");
      if (compareTabContent && typeof initCompareTab === "function") {
        initCompareTab();
      }
    } catch (error) {
      console.error("Error initializing compare tab:", error);
    }
  }

  // Render cookies for the active tab with current search term
  renderCookies(document.getElementById("searchBox")?.value || "");
}

/****************************/
/* Cookie Monitoring Feature */
/****************************/

// Initialize monitoring tab functionality
function initMonitoringTab() {
  // DOM elements
  const enableMonitoringToggle = document.getElementById("enableMonitoring");
  const domainToMonitorInput = document.getElementById("domainToMonitor");
  const addDomainBtn = document.getElementById("addDomainBtn");
  const monitorCurrentSiteBtn = document.getElementById("monitorCurrentSite");
  const domainsList = document.getElementById("domainsList");
  const noDomains = document.getElementById("noDomains");
  const historyDomainSelect = document.getElementById("historyDomainSelect");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const historyTableBody = document.getElementById("historyTableBody");
  const noHistory = document.getElementById("noHistory");
  const historyContainer = document.getElementById("historyContainer");

  const notifyOnAdd = document.getElementById("notifyOnAdd");
  const notifyOnModify = document.getElementById("notifyOnModify");
  const notifyOnRemove = document.getElementById("notifyOnRemove");

  // Current state
  let monitoredDomains = [];
  let monitoringEnabled = false;
  let currentSiteBaseDomain = "";

  // Get current site domain
  function getCurrentSiteDomain() {
    if (siteUrl) {
      try {
        const url = new URL(siteUrl);
        const hostname = url.hostname;
        // Extract base domain (remove www. if present)
        currentSiteBaseDomain = hostname.replace(/^www\./, "");
        return currentSiteBaseDomain;
      } catch (e) {
        console.error("Error parsing URL:", e);
        return "";
      }
    }
    return "";
  }

  // Initialize monitoring settings
  function initMonitoring() {
    // Get the current site domain
    getCurrentSiteDomain();

    // Get monitoring status from background script
    chrome.runtime.sendMessage(
      {
        action: "getCookieMonitorStatus",
      },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error(
            "Error getting monitoring status:",
            chrome.runtime.lastError,
          );
          return;
        }

        if (!response || !response.success) {
          console.error("Invalid response from background script");
          return;
        }

        // Update UI with current status
        monitoringEnabled = response.enabled;
        enableMonitoringToggle.checked = monitoringEnabled;

        // Update notification settings
        notifyOnAdd.checked = response.settings.notifyOnAdd;
        notifyOnModify.checked = response.settings.notifyOnModify;
        notifyOnRemove.checked = response.settings.notifyOnRemove;

        // Update domains list
        monitoredDomains = response.monitoredDomains || [];
        updateDomainsList();
        updateHistoryDomainSelect();

        // Load history for the first domain if available
        if (monitoredDomains.length > 0) {
          loadCookieHistory(monitoredDomains[0]);
        }
      },
    );
  }

  // Update the list of monitored domains
  function updateDomainsList() {
    // Clear the list
    domainsList.innerHTML = "";

    // Show/hide empty state
    if (monitoredDomains.length === 0) {
      noDomains.style.display = "block";
      domainsList.style.display = "none";
      return;
    }

    noDomains.style.display = "none";
    domainsList.style.display = "block";

    // Add each domain to the list
    monitoredDomains.forEach((domain) => {
      const listItem = document.createElement("li");
      listItem.className = "domain-item";

      const domainName = document.createElement("div");
      domainName.className = "domain-name";
      domainName.textContent = domain;

      const domainActions = document.createElement("div");
      domainActions.className = "domain-actions";

      const viewHistoryBtn = document.createElement("button");
      viewHistoryBtn.className = "btn-secondary";
      viewHistoryBtn.textContent = "View History";
      viewHistoryBtn.addEventListener("click", () => {
        historyDomainSelect.value = domain;
        loadCookieHistory(domain);
      });

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn-danger";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        removeDomainFromMonitoring(domain);
      });

      domainActions.appendChild(viewHistoryBtn);
      domainActions.appendChild(removeBtn);

      listItem.appendChild(domainName);
      listItem.appendChild(domainActions);

      domainsList.appendChild(listItem);
    });
  }

  // Update the domain select dropdown for history
  function updateHistoryDomainSelect() {
    // Clear the dropdown except for the default option
    while (historyDomainSelect.options.length > 1) {
      historyDomainSelect.remove(1);
    }

    // Add each domain to the dropdown
    monitoredDomains.forEach((domain) => {
      const option = document.createElement("option");
      option.value = domain;
      option.textContent = domain;
      historyDomainSelect.appendChild(option);
    });
  }

  // Add a domain to monitoring
  function addDomainToMonitoring(domain) {
    // Trim the domain to handle whitespace
    const trimmedDomain = domain ? domain.trim() : "";

    if (!trimmedDomain) {
      // Show error to user instead of just logging to console
      const errorMsg = document.createElement("div");
      errorMsg.className = "error-message";
      errorMsg.textContent = "Please enter a valid domain name";

      // Find the nearest container to show the error
      const container = domainToMonitorInput.parentElement;
      const existingError = container.querySelector(".error-message");

      // Remove any existing error first
      if (existingError) {
        existingError.remove();
      }

      // Add the error message
      container.appendChild(errorMsg);

      // Remove error after 3 seconds
      setTimeout(() => {
        if (errorMsg.parentNode) {
          errorMsg.remove();
        }
      }, 3000);

      console.error("No domain specified");
      return;
    }

    // Send request to background script
    chrome.runtime.sendMessage(
      {
        action: "addDomainToMonitor",
        domain: trimmedDomain,
      },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error(
            "Error adding domain to monitoring:",
            chrome.runtime.lastError,
          );

          // Show error to user
          const errorMsg = document.createElement("div");
          errorMsg.className = "error-message";
          errorMsg.textContent =
            "Failed to add domain: " + chrome.runtime.lastError.message;
          domainToMonitorInput.parentElement.appendChild(errorMsg);

          setTimeout(() => {
            if (errorMsg.parentNode) {
              errorMsg.remove();
            }
          }, 3000);

          return;
        }

        if (!response || !response.success) {
          console.error("Failed to add domain to monitoring");

          // Show error to user
          const errorMsg = document.createElement("div");
          errorMsg.className = "error-message";
          errorMsg.textContent =
            "Failed to add domain: " +
            (response && response.error ? response.error : "Unknown error");
          domainToMonitorInput.parentElement.appendChild(errorMsg);

          setTimeout(() => {
            if (errorMsg.parentNode) {
              errorMsg.remove();
            }
          }, 3000);

          return;
        }

        // Update domains list
        monitoredDomains = response.monitoredDomains;
        updateDomainsList();
        updateHistoryDomainSelect();

        // Clear the input
        domainToMonitorInput.value = "";

        // Load history for this domain
        loadCookieHistory(trimmedDomain);
      },
    );
  }

  // Remove a domain from monitoring
  function removeDomainFromMonitoring(domain) {
    // Send request to background script
    chrome.runtime.sendMessage(
      {
        action: "removeDomainFromMonitor",
        domain: domain,
      },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error(
            "Error removing domain from monitoring:",
            chrome.runtime.lastError,
          );
          return;
        }

        if (!response || !response.success) {
          console.error("Failed to remove domain from monitoring");
          return;
        }

        // Update domains list
        monitoredDomains = response.monitoredDomains;
        updateDomainsList();
        updateHistoryDomainSelect();

        // If this was the selected domain, clear history view
        if (historyDomainSelect.value === domain) {
          historyDomainSelect.value = "";
          clearHistoryTable();
        }
      },
    );
  }

  // Load cookie history for a domain
  function loadCookieHistory(domain) {
    if (!domain) {
      clearHistoryTable();
      return;
    }

    // Send request to background script
    chrome.runtime.sendMessage(
      {
        action: "getCookieHistory",
        domain: domain,
      },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error(
            "Error getting cookie history:",
            chrome.runtime.lastError,
          );
          return;
        }

        if (!response || !response.success) {
          console.error("Failed to get cookie history");
          return;
        }

        // Update history table
        updateHistoryTable(response.history);
      },
    );
  }

  // Clear the history table
  function clearHistoryTable() {
    historyTableBody.innerHTML = "";
    historyContainer.style.display = "none";
    noHistory.style.display = "block";
  }

  // Update the history table with data
  function updateHistoryTable(history) {
    // Clear the table
    historyTableBody.innerHTML = "";

    // Show/hide empty state
    if (!history || history.length === 0) {
      historyContainer.style.display = "none";
      noHistory.style.display = "block";
      return;
    }

    historyContainer.style.display = "block";
    noHistory.style.display = "none";

    // Add each history entry to the table
    history.forEach((entry) => {
      const row = document.createElement("tr");

      // Time column
      const timeCell = document.createElement("td");
      const date = new Date(entry.timestamp);
      timeCell.textContent = date.toLocaleTimeString();
      timeCell.title = date.toLocaleString();

      // Cookie name column
      const cookieCell = document.createElement("td");
      cookieCell.textContent = entry.cookie.name;
      cookieCell.title = `Path: ${entry.cookie.path}`;

      // Change type column
      const changeCell = document.createElement("td");
      changeCell.textContent = entry.changeType;
      changeCell.className = `change-${entry.changeType}`;

      // Details column
      const detailsCell = document.createElement("td");
      if (entry.changeType === "added" || entry.changeType === "modified") {
        const value = entry.cookie.value;
        // Truncate the value if it's too long
        detailsCell.textContent =
          value.length > 20 ? value.substring(0, 20) + "..." : value;
        detailsCell.title = value;
      } else if (entry.changeType === "removed") {
        detailsCell.textContent = "Cookie removed";
      } else if (entry.changeType === "expired") {
        detailsCell.textContent = "Cookie expired";
      } else if (entry.changeType === "initial") {
        detailsCell.textContent = "Initial snapshot";
      } else {
        detailsCell.textContent = entry.changeType;
      }

      // Add cells to row
      row.appendChild(timeCell);
      row.appendChild(cookieCell);
      row.appendChild(changeCell);
      row.appendChild(detailsCell);

      // Add row to table
      historyTableBody.appendChild(row);
    });
  }

  // Update monitoring settings
  function updateMonitorSettings() {
    const settings = {
      notifyOnAdd: notifyOnAdd.checked,
      notifyOnModify: notifyOnModify.checked,
      notifyOnRemove: notifyOnRemove.checked,
    };

    // Send settings to background script
    chrome.runtime.sendMessage(
      {
        action: "updateMonitorSettings",
        settings: settings,
      },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error(
            "Error updating monitoring settings:",
            chrome.runtime.lastError,
          );
          return;
        }

        if (!response || !response.success) {
          console.error("Failed to update monitoring settings");
          return;
        }

        console.log("Monitoring settings updated");
      },
    );
  }

  // Toggle cookie monitoring
  function toggleMonitoring() {
    const enabled = enableMonitoringToggle.checked;

    // Send request to background script
    chrome.runtime.sendMessage(
      {
        action: "toggleCookieMonitoring",
        enabled: enabled,
      },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error("Error toggling monitoring:", chrome.runtime.lastError);
          return;
        }

        if (!response || !response.success) {
          console.error("Failed to toggle monitoring");
          return;
        }

        monitoringEnabled = response.enabled;
        enableMonitoringToggle.checked = monitoringEnabled;
      },
    );
  }

  // Clear cookie history for a domain
  function clearCookieHistory() {
    const domain = historyDomainSelect.value;

    // Send request to background script
    chrome.runtime.sendMessage(
      {
        action: "clearCookieHistory",
        domain: domain,
      },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error("Error clearing history:", chrome.runtime.lastError);
          return;
        }

        if (!response || !response.success) {
          console.error("Failed to clear history");
          return;
        }

        // Clear history table
        clearHistoryTable();
      },
    );
  }

  // Event listeners
  enableMonitoringToggle.addEventListener("change", toggleMonitoring);

  addDomainBtn.addEventListener("click", () => {
    addDomainToMonitoring(domainToMonitorInput.value.trim());
  });

  monitorCurrentSiteBtn.addEventListener("click", () => {
    const currentDomain = getCurrentSiteDomain();
    if (currentDomain) {
      addDomainToMonitoring(currentDomain);
    }
  });

  domainToMonitorInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      addDomainToMonitoring(domainToMonitorInput.value.trim());
    }
  });

  historyDomainSelect.addEventListener("change", () => {
    loadCookieHistory(historyDomainSelect.value);
  });

  clearHistoryBtn.addEventListener("click", clearCookieHistory);

  notifyOnAdd.addEventListener("change", updateMonitorSettings);
  notifyOnModify.addEventListener("change", updateMonitorSettings);
  notifyOnRemove.addEventListener("change", updateMonitorSettings);

  // Listen for cookie history updates from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "cookieHistoryUpdated") {
      // If this is the current selected domain, update the history table
      if (historyDomainSelect.value === message.domain) {
        updateHistoryTable(message.history);
      }
    } else if (message.action === "cookieMonitoringToggled") {
      monitoringEnabled = message.enabled;
      enableMonitoringToggle.checked = monitoringEnabled;
    }
  });

  // Initialize
  initMonitoring();
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  try {
    // Initialize all modules
    scanCurrentSiteCookies();
    initializeTabs();
    setupCategoryToggles();
    initializeTheme();

    // Add event listener for tab actions menu items
    const tabActionsBtn = document.getElementById("tabActionsBtn");
    const tabActionsMenu = document.getElementById("tabActionsMenu");

    if (tabActionsBtn && tabActionsMenu) {
      tabActionsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        tabActionsMenu.classList.toggle("visible");
      });

      // Close menu when clicking outside
      document.addEventListener("click", () => {
        tabActionsMenu.classList.remove("visible");
      });
    }

    // Setup export and refresh actions
    document
      .getElementById("exportCurrentView")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("exportButton")?.click();
      });

    document
      .getElementById("refreshCurrentView")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("refreshButton")?.click();
      });

    // Initialize specialized tabs when needed
    const activeTab = document.querySelector(".tab.active");
    if (activeTab) {
      const activeTabId = activeTab.dataset.tab;

      if (
        activeTabId === "monitoringTab" &&
        typeof initMonitoringTab === "function"
      ) {
        initMonitoringTab();
      } else if (activeTabId === "chartsTab") {
        renderCharts();
      }
    }
  } catch (e) {
    console.error("Error initializing extension:", e);

    // Display error to user
    const errorMsg = document.createElement("div");
    errorMsg.className = "error-message";
    errorMsg.textContent = "Error initializing extension: " + e.message;
    document.body.appendChild(errorMsg);
  }
});

// Create a safe comparison manager if it doesn't exist to avoid reference errors
if (typeof safeComparisonManager === "undefined") {
  window.safeComparisonManager = {
    init: function () {
      console.log("Safe comparison manager initialized");
    },
    formatDate: function (timestamp) {
      if (!timestamp) return "Session cookie";
      return new Date(timestamp * 1000).toLocaleString();
    },
  };
}

// Create a utility object for the compare tab functionality
if (typeof initCompareTab === "undefined") {
  window.initCompareTab = function () {
    console.log("Compare tab initialized");
    if (
      typeof safeComparisonManager !== "undefined" &&
      safeComparisonManager.init
    ) {
      safeComparisonManager.init();
    }
  };
}

// Create settings manager if it doesn't exist
if (typeof window.settingsManager === "undefined") {
  window.settingsManager = {
    init: function () {
      console.log("Settings manager initialized");
    },
  };
}

// Create tutorial manager if it doesn't exist
if (typeof window.tutorialManager === "undefined") {
  window.tutorialManager = {
    init: function () {
      console.log("Tutorial manager initialized");
    },
    startTutorial: function () {
      console.log("Tutorial started");
    },
  };
}

// Generate cURL command for a cookie
function generateCurlCommand(cookie) {
  if (!cookie) return "";

  const domain = cookie.domain.startsWith(".")
    ? cookie.domain.substring(1)
    : cookie.domain;
  const protocol = cookie.secure ? "https" : "http";
  const cookieValue = encodeURIComponent(cookie.value || "");
  const expires = cookie.expirationDate
    ? new Date(cookie.expirationDate * 1000).toUTCString()
    : "";

  let curlCmd = `curl -X GET "${protocol}://${domain}${cookie.path || "/"}" \\
  -H "Cookie: ${cookie.name}=${cookieValue}"`;

  // Add -k flag for secure connections
  if (cookie.secure) {
    curlCmd += " \\\n  -k";
  }

  return curlCmd;
}

// Add copy as cURL button to a cookie item
function addCopyAsCurlButton(cookie, containerElement) {
  const actionsContainer = containerElement.querySelector(".cookie-actions");

  if (!actionsContainer) return;

  const curlBtn = document.createElement("button");
  curlBtn.className = "curl-btn";
  curlBtn.textContent = "Copy as cURL";
  curlBtn.title = "Copy as cURL command";

  curlBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    const curlCommand = generateCurlCommand(cookie);

    // Copy to clipboard
    navigator.clipboard
      .writeText(curlCommand)
      .then(() => {
        // Visual feedback
        curlBtn.textContent = "Copied!";
        setTimeout(() => {
          curlBtn.textContent = "Copy as cURL";
        }, 1500);
      })
      .catch((err) => {
        console.error("Could not copy cURL command: ", err);
        curlBtn.textContent = "Error";
        setTimeout(() => {
          curlBtn.textContent = "Copy as cURL";
        }, 1500);
      });
  });

  actionsContainer.insertBefore(curlBtn, actionsContainer.firstChild);
}

// Add cURL buttons to all cookie items
function addCopyAsCurlButtons() {
  document.querySelectorAll(".cookie-item").forEach((cookieItem) => {
    const cookieId = cookieItem.getAttribute("data-cookie-id");
    if (cookieId) {
      const [name, domain, path] = cookieId.split("_");
      const value = cookieItem
        .querySelector(".cookie-value")
        ?.getAttribute("data-original-value");
      const secure = cookieItem.querySelector(".badge.secure") !== null;
      const httpOnly = cookieItem.querySelector(".badge.httponly") !== null;

      // Get expiration from details text
      let expirationDate = null;
      const detailsText =
        cookieItem.querySelector(".cookie-details")?.textContent || "";
      if (
        detailsText.includes("Expires:") &&
        !detailsText.includes("Session cookie")
      ) {
        const expiresMatch = detailsText.match(/Expires: (.*?)( \||$)/);
        if (expiresMatch && expiresMatch[1]) {
          try {
            expirationDate = Math.floor(
              new Date(expiresMatch[1]).getTime() / 1000,
            );
          } catch (e) {
            console.error("Could not parse expiration date", e);
          }
        }
      }

      const cookie = {
        name,
        domain,
        path,
        value: value ? decodeURIComponent(value) : "",
        secure,
        httpOnly,
        expirationDate,
      };

      addCopyAsCurlButton(cookie, cookieItem);
    }
  });
}

// Safe comparison manager for comparing cookie snapshots
// Extend the existing global comparison manager
Object.assign(window.safeComparisonManager, {
  init: function () {
    console.log("Safe comparison manager initialized");
    // Initialize comparison functionality
    const compareTab = document.getElementById("compareTab");
    if (compareTab) {
      this.setupComparisonFilters();
      this.loadSnapshots();
    }
  },

  setupComparisonFilters: function () {
    const filterButtons = document.querySelectorAll(".comparison-filter-btn");
    if (filterButtons) {
      filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          // Remove active class from all buttons
          filterButtons.forEach((b) => b.classList.remove("active"));
          // Add active class to clicked button
          btn.classList.add("active");
          // Apply filter
          const filterType = btn.getAttribute("data-filter");
          this.filterComparison(filterType);
        });
      });
    }
  },

  loadSnapshots: function () {
    // Implementation for loading snapshots
    console.log("Loading cookie snapshots for comparison");
  },

  filterComparison: function (filterType) {
    console.log(`Filtering comparison by: ${filterType}`);
    // Implementation for filtering comparison
  },
});

// Removed duplicate settingsManager definition
// Use the window.settingsManager that's already defined at line 4732

// Tutorial manager for helping first-time users
const tutorialManager = {
  init: function () {
    console.log("Tutorial manager initialized");
    // Implementation for tutorial manager
  },
};

// Load settings and initialize functionality
document.addEventListener("DOMContentLoaded", function () {
  // Load user settings
  chrome.storage.sync.get(
    ["autoRefresh", "refreshInterval"],
    function (result) {
      if (result.autoRefresh) {
        const interval = result.refreshInterval || 60; // Default to 60 seconds
        if (typeof startAutoRefresh === "function") {
          console.log(
            `Starting auto-refresh with interval: ${interval} seconds`,
          );
          startAutoRefresh(interval);
        }
      }
    },
  );
});

// Create settings manager early in the file to avoid initialization issues
window.settingsManager = window.settingsManager || {
  init: function () {
    console.log("Settings manager initialized");
  },
  // Add more methods as needed
};

if (
  typeof window.tutorialManager !== "undefined" &&
  window.tutorialManager &&
  typeof window.tutorialManager.init === "function"
) {
  window.tutorialManager.init();
}

// Create tutorial manager early in the file to avoid initialization issues
window.tutorialManager = window.tutorialManager || {
  init: function () {
    console.log("Tutorial manager initialized");
  },
  startTutorial: function () {
    console.log("Tutorial started");
  }
};
