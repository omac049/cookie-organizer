/* Cookie Organizer
 * ------------------------------------------------------
 * Scans and organizes site cookies, categorizing them by
 * relationship to the site and their purpose.
 */

// Promisify Chrome API functions with proper error handling
const p = fn => (...args) => new Promise((resolve, reject) => {
  fn(...args, result => {
    if (chrome.runtime.lastError) {
      reject(new Error(chrome.runtime.lastError.message));
    } else {
      resolve(result);
    }
  });
});

const getAllCookies = p(chrome.cookies.getAll);
const getActiveTabs = p(chrome.tabs.query);

// Logger for consistent logging across the extension
const Logger = {
  // Log levels
  LEVELS: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
  },
  
  // Current log level - default to INFO
  currentLevel: 1,
  
  // Maximum number of logs to keep
  maxLogs: 1000,
  
  // Storage key for logs
  storageKey: 'cookie_organizer_logs',
  
  // Log storage
  logs: [],
  
  // Initialize logger
  init: function() {
    // Load current log level from storage
    chrome.storage.local.get(['logLevel', this.storageKey], (result) => {
      if (result.logLevel !== undefined) {
        this.currentLevel = result.logLevel;
      }
      
      // Load existing logs
      if (result[this.storageKey]) {
        this.logs = result[this.storageKey];
      }
      
      this.info('Logger initialized with level:', this.getLevelName(this.currentLevel));
    });
    
    // Listen for log level changes
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'setLogLevel') {
        this.setLevel(message.level);
        sendResponse({ success: true });
      } else if (message.action === 'getLogs') {
        sendResponse({ success: true, logs: this.logs });
      } else if (message.action === 'clearLogs') {
        this.clearLogs();
        sendResponse({ success: true });
      }
    });
  },
  
  // Set log level
  setLevel: function(level) {
    if (typeof level === 'string') {
      // Convert string level to number
      level = this.LEVELS[level.toUpperCase()] || this.LEVELS.INFO;
    }
    
    this.currentLevel = level;
    
    // Save to storage
    chrome.storage.local.set({ logLevel: level });
    
    this.info('Log level set to:', this.getLevelName(level));
  },
  
  // Get level name from numeric value
  getLevelName: function(level) {
    for (const [name, value] of Object.entries(this.LEVELS)) {
      if (value === level) return name;
    }
    return 'UNKNOWN';
  },
  
  // Add timestamp to log
  timestamp: function() {
    return new Date().toISOString();
  },
  
  // Save logs to storage
  saveLogs: function() {
    // Trim logs if needed
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Save to storage
    chrome.storage.local.set({ [this.storageKey]: this.logs });
  },
  
  // Clear all logs
  clearLogs: function() {
    this.logs = [];
    chrome.storage.local.remove(this.storageKey);
    this.info('Logs cleared');
  },
  
  // Format log message
  formatLog: function(level, args) {
    const timestamp = this.timestamp();
    const messages = Array.from(args).map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return arg.toString();
        }
      }
      return arg;
    });
    
    return {
      timestamp,
      level: this.getLevelName(level),
      message: messages.join(' ')
    };
  },
  
  // Log methods for different levels
  debug: function(...args) {
    if (this.currentLevel <= this.LEVELS.DEBUG) {
      const logEntry = this.formatLog(this.LEVELS.DEBUG, args);
      console.debug(`[${logEntry.timestamp}] [DEBUG]`, ...args);
      this.logs.push(logEntry);
      this.saveLogs();
    }
  },
  
  info: function(...args) {
    if (this.currentLevel <= this.LEVELS.INFO) {
      const logEntry = this.formatLog(this.LEVELS.INFO, args);
      console.info(`[${logEntry.timestamp}] [INFO]`, ...args);
      this.logs.push(logEntry);
      this.saveLogs();
    }
  },
  
  warn: function(...args) {
    if (this.currentLevel <= this.LEVELS.WARN) {
      const logEntry = this.formatLog(this.LEVELS.WARN, args);
      console.warn(`[${logEntry.timestamp}] [WARN]`, ...args);
      this.logs.push(logEntry);
      this.saveLogs();
    }
  },
  
  error: function(...args) {
    if (this.currentLevel <= this.LEVELS.ERROR) {
      const logEntry = this.formatLog(this.LEVELS.ERROR, args);
      console.error(`[${logEntry.timestamp}] [ERROR]`, ...args);
      this.logs.push(logEntry);
      this.saveLogs();
    }
  }
};

// Initialize the logger
Logger.init();

// Get base domain from a URL or domain string
function getBaseDomain(urlOrDomain) {
  let hostname;
  
  // If it's a full URL, extract the hostname
  if (urlOrDomain.startsWith("http")) {
    try {
      hostname = new URL(urlOrDomain).hostname;
    } catch (e) {
      console.error("URL parsing error:", e, urlOrDomain);
      // Fall back to using the string as is if it can't be parsed
      hostname = urlOrDomain.replace(/^https?:\/\//, "").split("/")[0];
    }
  } else {
    // It's already a domain or hostname
    hostname = urlOrDomain;
  }
  
  // Remove "www." if present
  hostname = hostname.replace(/^www\./, "");
  
  // Extract the base domain (e.g., example.com from sub.example.com)
  const parts = hostname.split(".");
  if (parts.length > 2) {
    // Handle special cases like co.uk, com.au, etc.
    const tld = parts.slice(-2).join(".");
    if (["co.uk", "com.au", "co.jp", "co.nz", "org.uk", "ac.uk", "edu.au"].includes(tld)) {
      return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
  }
  return hostname;
}

// Check if a cookie domain is related to a site domain
function isDomainRelated(cookieDomain, siteDomain) {
  // Remove leading dot if present
  const cleanCookieDomain = cookieDomain.replace(/^\./, "");
  const cleanSiteDomain = siteDomain.replace(/^\./, "");
  
  // Exact match or cookie domain includes site domain
  return cleanCookieDomain === cleanSiteDomain || 
         cleanCookieDomain.endsWith("." + cleanSiteDomain) || 
         cleanSiteDomain.endsWith("." + cleanCookieDomain);
}

// Cookie purpose categories
const COOKIE_PURPOSES = {
  NECESSARY: "necessary",
  PREFERENCES: "preferences",
  ANALYTICS: "analytics",
  MARKETING: "marketing",
  SOCIAL: "social",
  UNKNOWN: "unknown"
};

// Lists of known cookie names and domains by purpose
const COOKIE_PATTERNS = {
  [COOKIE_PURPOSES.NECESSARY]: {
    names: ["__cfduid", "PHPSESSID", "JSESSIONID", "ASP.NET_SessionId", "SERVERID", "sessionid", "session", "auth", "csrftoken", "connect.sid"],
    domains: ["cloudflare.com"],
    namePatterns: ["^csrf", "^session", "^auth", "^__Host-"]
  },
  [COOKIE_PURPOSES.PREFERENCES]: {
    names: ["theme", "lang", "language", "timezone", "country", "currency", "settings"],
    namePatterns: ["^display_", "^user_", "^pref_", "^theme_", "^lang_", "^currency_"]
  },
  [COOKIE_PURPOSES.ANALYTICS]: {
    names: ["_ga", "_gid", "_gat", "__utma", "__utmb", "__utmc", "__utmt", "__utmz", "_hjid", "_hjAbsoluteSessionInProgress"],
    domains: ["google-analytics.com", "googletagmanager.com", "hotjar.com", "crazyegg.com", "optimizely.com"],
    namePatterns: ["^_ga", "^_hj", "^_pk_", "^_uet", "^__qca", "^__utm", "^_opt_"]
  },
  [COOKIE_PURPOSES.MARKETING]: {
    names: ["__gads", "_fbp", "_gcl_au", "IDE", "test_cookie", "NID", "DSID", "1P_JAR", "datr", "fr", "sb", "wd"],
    domains: ["doubleclick.net", "adservice.google.com", "googlesyndication.com", "adform.net", "facebook.com"],
    namePatterns: ["^_gcl_", "^_fbp", "^ad-id", "^ad_", "^ads_", "^__gfp_"]
  },
  [COOKIE_PURPOSES.SOCIAL]: {
    names: ["guest_id", "personalization_id", "ct0", "twid", "tfw_exp"],
    domains: ["facebook.com", "twitter.com", "linkedin.com", "instagram.com", "pinterest.com", "youtube.com"],
    namePatterns: ["^lidc", "^bcookie", "^bscookie", "^x-src"]
  }
};

// Determine cookie purpose based on name, domain and other properties
function determineCookiePurpose(cookie) {
  // Check against known patterns
  for (const [purpose, patterns] of Object.entries(COOKIE_PATTERNS)) {
    // Check against known cookie names
    if (patterns.names && patterns.names.includes(cookie.name)) {
      return purpose;
    }
    
    // Check domain
    if (patterns.domains && patterns.domains.some(domain => 
      cookie.domain.includes(domain) || getBaseDomain(cookie.domain) === domain)) {
      return purpose;
    }
    
    // Check name patterns (regex)
    if (patterns.namePatterns && patterns.namePatterns.some(pattern => 
      new RegExp(pattern).test(cookie.name))) {
      return purpose;
    }
  }

  // Check for common patterns in cookie names
  const nameLower = cookie.name.toLowerCase();
  
  if (nameLower.includes("auth") || 
      nameLower.includes("token") || 
      nameLower.includes("session") || 
      nameLower.includes("csrf") ||
      nameLower.includes("xsrf")) {
    return COOKIE_PURPOSES.NECESSARY;
  }
  
  if (nameLower.includes("pref") || 
      nameLower.includes("lang") || 
      nameLower.includes("theme") || 
      nameLower.includes("setting")) {
    return COOKIE_PURPOSES.PREFERENCES;
  }
  
  if (nameLower.includes("track") || 
      nameLower.includes("stat") || 
      nameLower.includes("metric") || 
      nameLower.includes("visit")) {
    return COOKIE_PURPOSES.ANALYTICS;
  }
  
  if (nameLower.includes("ad") || 
      nameLower.includes("promo") || 
      nameLower.includes("campaign")) {
    return COOKIE_PURPOSES.MARKETING;
  }
  
  // Some common heuristics for types not matched above
  if (cookie.secure && cookie.httpOnly) {
    // Secure and httpOnly cookies are often for authentication/sessions
    return COOKIE_PURPOSES.NECESSARY;
  }
  
  if (nameLower.includes("consent") || 
      nameLower.includes("gdpr")) {
    return COOKIE_PURPOSES.NECESSARY;
  }
  
  // Short session cookies are often necessary
  if (!cookie.expirationDate) {
    return COOKIE_PURPOSES.NECESSARY;
  }
  
  // Long-lived cookies are often for tracking
  const expirationDate = cookie.expirationDate ? new Date(cookie.expirationDate * 1000) : null;
  const now = new Date();
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  if (expirationDate && expirationDate > oneYearFromNow) {
    return COOKIE_PURPOSES.MARKETING;
  }
  
  return COOKIE_PURPOSES.UNKNOWN;
}

// Categorize a cookie based on its relation to the site
function categorizeCookie(cookie, siteUrl) {
  const siteDomain = new URL(siteUrl).hostname;
  const siteBaseDomain = getBaseDomain(siteDomain);
  const cookieDomain = cookie.domain.replace(/^\./, "");
  const cookieBaseDomain = getBaseDomain(cookieDomain);
  
  // Determine relationship category
  let relationshipCategory;
  
  // Primary: Exact domain match or www variant
  if (cookieDomain === siteDomain || 
      cookieDomain === siteDomain.replace(/^www\./, "") ||
      cookieDomain === "www." + siteDomain.replace(/^www\./, "")) {
    relationshipCategory = "primary";
  }
  // Secondary: Same base domain (subdomains)
  else if (cookieBaseDomain === siteBaseDomain) {
    relationshipCategory = "secondary";
  }
  // Third-party: Different domain
  else {
    relationshipCategory = "third-party";
  }
  
  // Determine purpose category
  const purposeCategory = determineCookiePurpose(cookie);
  
  return {
    relationship: relationshipCategory,
    purpose: purposeCategory
  };
}

// Organize cookies for a specific site
async function organizeSiteCookies(siteUrl) {
  try {
    if (!siteUrl) {
      return { success: false, error: "No site URL provided" };
    }
    
    // Validate URL format
    if (!siteUrl.startsWith("http")) {
      // Try to convert to a valid URL if possible
      if (!siteUrl.match(/^[a-zA-Z]+:\/\//)) {
        siteUrl = "https://" + siteUrl;
      } else {
        return { success: false, error: "Invalid site URL format" };
      }
    }
    
    console.time("cookieOrganization");
    
    // Parse the domain from URL
    let siteDomain;
    let siteBaseDomain;
    
    try {
      siteDomain = new URL(siteUrl).hostname;
      siteBaseDomain = getBaseDomain(siteDomain);
    } catch (error) {
      console.error("Error parsing site URL:", error, siteUrl);
      return { success: false, error: `Could not parse site URL: ${error.message}` };
    }
    
    // Special handling for education domains which may have more complex cookie setups
    const isEducationDomain = siteDomain.endsWith(".edu") || 
                            siteDomain.includes(".edu.") || 
                            siteDomain.endsWith(".ac.uk");
    
    // Get all cookies using optimized retrieval
    let allCookies = [];
    try {
      // First, try to get cookies directly related to the current site
      // This is faster and will work for most cases
      console.time("cookieRetrieval");
      let siteCookies = await getAllCookies({ url: siteUrl });
      
      // For more thorough results, add domain/subdomain cookies
      let domainCookies = await getAllCookies({ domain: siteDomain });
      
      // Create a Map to avoid duplicates - using a compound key of name+domain+path
      const cookieMap = new Map();
      
      // Efficient function to add cookies to our map
      const addCookiesToMap = (cookies) => {
        if (!cookies || !cookies.length) return;
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const key = `${cookie.name}|${cookie.domain}|${cookie.path}`;
          cookieMap.set(key, cookie);
        }
      };
      
      // Add the initial cookies
      addCookiesToMap(siteCookies);
      addCookiesToMap(domainCookies);
      
      // For education domains or sites with few cookies, perform additional lookups
      if (isEducationDomain || cookieMap.size < 5) {
        // Add base domain cookies
        const baseDomainCookies = await getAllCookies({ domain: siteBaseDomain });
        addCookiesToMap(baseDomainCookies);
        
        // For thorough scanning, if few cookies found, check all cookies but filter efficiently
        if (cookieMap.size < 10) {
          console.log("Performing thorough cookie scan for:", siteDomain);
          
          // Get all cookies in batches to prevent memory issues with very large sets
          const allSiteCookies = await getAllCookies({});
          
          // Pre-calculate the base domain outside the loop for efficiency
          const siteBaseDomainLower = siteBaseDomain.toLowerCase();
          
          // Use optimized filtering for large cookie sets
          const relevantCookies = allSiteCookies.filter(cookie => {
            // Quick check for obvious matches to avoid expensive operations
            if (cookie.domain.includes(siteDomain)) return true;
            
            const cookieDomain = cookie.domain.replace(/^\./, "").toLowerCase();
            
            // Fast check for base domain match
            if (cookieDomain.includes(siteBaseDomainLower)) return true;
            
            // Only perform more expensive check if the above failed
            return isDomainRelated(cookieDomain, siteDomain);
          });
          
          addCookiesToMap(relevantCookies);
        }
      }
      
      // Convert map back to array
      allCookies = Array.from(cookieMap.values());
      console.timeEnd("cookieRetrieval");
      console.log(`Retrieved ${allCookies.length} unique cookies for ${siteDomain}`);
    } catch (error) {
      console.error("Error getting cookies:", error);
      return { success: false, error: `Failed to retrieve cookies: ${error.message}` };
    }
    
    if (!allCookies || allCookies.length === 0) {
      return { 
        success: true, 
        siteUrl,
        stats: { 
          site: siteDomain,
          cookies: 0,
          byRelationship: { primary: 0, secondary: 0, thirdParty: 0 },
          byPurpose: {
            necessary: 0, preferences: 0, analytics: 0,
            marketing: 0, social: 0, unknown: 0
          },
          lastScan: new Date().toISOString()
        },
        cookiesByRelationship: {},
        cookiesByPurpose: {},
        siteCookies: []
      };
    }
    
    // Check if we have a large number of cookies
    const isLargeCookieSet = allCookies.length > 200;
    
    // For large sets, use more memory-efficient processing
    // Create maps for categories
    console.time("cookieCategorization");
    const cookiesByRelationship = {
      primary: [],
      secondary: [],
      thirdParty: []
    };
    
    const cookiesByPurpose = {
      [COOKIE_PURPOSES.NECESSARY]: [],
      [COOKIE_PURPOSES.PREFERENCES]: [],
      [COOKIE_PURPOSES.ANALYTICS]: [],
      [COOKIE_PURPOSES.MARKETING]: [],
      [COOKIE_PURPOSES.SOCIAL]: [],
      [COOKIE_PURPOSES.UNKNOWN]: []
    };
    
    // Optimization for large datasets - process in batches to avoid blocking
    const BATCH_SIZE = isLargeCookieSet ? 50 : allCookies.length;
    const totalBatches = Math.ceil(allCookies.length / BATCH_SIZE);
    
    // All cookies related to this site
    const siteCookies = [];
    
    // Process cookies in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, allCookies.length);
      
      // Process each cookie in this batch
      for (let i = startIdx; i < endIdx; i++) {
        const cookie = allCookies[i];
        
        // Skip null or undefined cookies (defensive programming)
        if (!cookie) continue;
        
        // Get the categories - reuse calculation for performance
        const categories = categorizeCookie(cookie, siteUrl);
        
        // Add relationship and purpose info to the cookie
        const enhancedCookie = {
          ...cookie,
          relationshipCategory: categories.relationship,
          purposeCategory: categories.purpose
        };
        
        // Add to appropriate relationship category
        cookiesByRelationship[categories.relationship].push(enhancedCookie);
        
        // Add to appropriate purpose category
        cookiesByPurpose[categories.purpose].push(enhancedCookie);
        
        // Add to all site cookies
        siteCookies.push(enhancedCookie);
        
        // For very large sets, allow UI thread to process occasionally
        if (isLargeCookieSet && (i - startIdx) % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
    console.timeEnd("cookieCategorization");
    
    // Filter out empty categories
    const filteredRelationships = {};
    Object.entries(cookiesByRelationship).forEach(([key, cookies]) => {
      if (cookies.length > 0) {
        filteredRelationships[key] = cookies;
      }
    });
    
    const filteredPurposes = {};
    Object.entries(cookiesByPurpose).forEach(([key, cookies]) => {
      if (cookies.length > 0) {
        filteredPurposes[key] = cookies;
      }
    });
    
    // Count total cookies
    const totalCookies = siteCookies.length;
    
    // Create stats
    const stats = { 
      site: siteDomain,
      cookies: totalCookies,
      byRelationship: {
        primary: cookiesByRelationship.primary.length,
        secondary: cookiesByRelationship.secondary.length,
        thirdParty: cookiesByRelationship.thirdParty.length
      },
      byPurpose: {
        necessary: cookiesByPurpose[COOKIE_PURPOSES.NECESSARY].length,
        preferences: cookiesByPurpose[COOKIE_PURPOSES.PREFERENCES].length,
        analytics: cookiesByPurpose[COOKIE_PURPOSES.ANALYTICS].length,
        marketing: cookiesByPurpose[COOKIE_PURPOSES.MARKETING].length,
        social: cookiesByPurpose[COOKIE_PURPOSES.SOCIAL].length,
        unknown: cookiesByPurpose[COOKIE_PURPOSES.UNKNOWN].length
      },
      lastScan: new Date().toISOString(),
      retrievalTime: isLargeCookieSet ? "optimized" : "standard"
    };
    
    console.timeEnd("cookieOrganization");
    console.log(`Processed ${totalCookies} cookies for ${siteDomain}`);
    
    // Save cookies and stats for this site
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ 
        cookiesByRelationship: filteredRelationships,
        cookiesByPurpose: filteredPurposes,
        siteCookies: siteCookies,
        cookieStats: stats,
        lastSiteUrl: siteUrl
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
    
    return { 
      success: true, 
      siteUrl,
      stats, 
      cookiesByRelationship: filteredRelationships,
      cookiesByPurpose: filteredPurposes,
      siteCookies
    };
  } catch (error) {
    console.error("Error organizing site cookies:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Get the current active tab URL
async function getCurrentTabUrl() {
  try {
    const tabs = await getActiveTabs({active: true, currentWindow: true});
    if (tabs && tabs.length > 0) {
      return tabs[0].url;
    }
    throw new Error("No active tab found");
  } catch (error) {
    console.error("Error getting current tab URL:", error);
    throw new Error(`Could not get current tab: ${error.message}`);
  }
}

// Scan cookies for the current active tab
async function scanActiveTabCookies(sendResponse) {
  try {
    // Get URL of the current active tab
    let tabUrl;
    try {
      tabUrl = await getCurrentTabUrl();
      console.log("Successfully got tab URL:", tabUrl);
    } catch (urlError) {
      console.error("Error getting tab URL:", urlError);
      sendResponse({ 
        success: false, 
        error: "Could not access current tab. Make sure the extension has proper permissions." 
      });
      return;
    }
    
    if (!tabUrl || tabUrl === "chrome://newtab/" || tabUrl.startsWith("chrome://") || tabUrl.startsWith("chrome-extension://")) {
      console.warn("Unsupported URL detected:", tabUrl);
      sendResponse({ 
        success: false, 
        error: "Cookies cannot be accessed on Chrome internal pages. Please navigate to a website." 
      });
      return;
    }
    
    // Get and organize cookies for the site
    console.log("Starting cookie organization for:", tabUrl);
    const result = await organizeSiteCookies(tabUrl);
    console.log("Cookie organization completed:", result.success);
    
    // Send response back to popup
    sendResponse(result);
  } catch (error) {
    console.error("Error scanning active tab cookies:", error);
    
    // Provide more specific error messages based on error type
    let errorMessage = "An unexpected error occurred while scanning cookies.";
    
    if (error.message.includes("URL") || error.message.includes("parse")) {
      errorMessage = "Invalid URL format. Please navigate to a valid website.";
    } else if (error.message.includes("permission") || error.message.includes("access")) {
      errorMessage = "Permission denied. The extension may need additional permissions to access cookies.";
    } else if (error.message.includes("timeout") || error.message.includes("network")) {
      errorMessage = "Network error. Please check your connection and try again.";
    }
    
    sendResponse({ 
      success: false, 
      error: errorMessage,
      originalError: error.message
    });
  }
}

// Delete a cookie
function deleteCookie(cookie, siteUrl, callback) {
  if (!cookie || !cookie.name || !cookie.domain) {
    callback({ success: false, error: "Invalid cookie data" });
    return;
  }
  
  try {
    // Build the URL for the cookie based on domain and path
    const protocol = cookie.secure ? "https:" : "http:";
    const path = cookie.path || "/";
    const url = `${protocol}//${cookie.domain.replace(/^\./, "")}${path}`;
    
    // Remove the cookie
    chrome.cookies.remove({
      url: url,
      name: cookie.name,
      storeId: cookie.storeId || "0"
    }, result => {
      if (chrome.runtime.lastError) {
        console.error("Error removing cookie:", chrome.runtime.lastError);
        callback({ 
          success: false, 
          error: chrome.runtime.lastError.message || "Failed to delete cookie"
        });
        return;
      }
      
      // Successfully deleted, refresh cookie list
      refreshCookieData(siteUrl, callback);
    });
  } catch (error) {
    console.error("Error in deleteCookie:", error);
    callback({ success: false, error: error.message || "Unknown error deleting cookie" });
  }
}

// Refresh cookie data without full reorganization
async function refreshCookieData(siteUrl, callback) {
  try {
    // Get the latest organized cookie data
    const result = await organizeSiteCookies(siteUrl);
    callback(result);
  } catch (error) {
    console.error("Error refreshing cookie data:", error);
    callback({ 
      success: false, 
      error: error.message || "Unknown error refreshing cookies" 
    });
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Check if message includes an action
  if (!message || !message.action) {
    sendResponse({ success: false, error: "No action specified" });
    return false;
  }
  
  try {
    // Handle different actions
    switch(message.action) {
      case "scanCurrentSiteCookies":
        // Scan cookies for current tab
        scanActiveTabCookies(sendResponse);
        return true; // Indicates we'll respond asynchronously
        
      case "deleteCookie":
        // Delete a cookie
        if (!message.cookie) {
          sendResponse({ success: false, error: "No cookie data provided" });
          return false;
        }
        deleteCookie(message.cookie, message.siteUrl, sendResponse);
        return true; // Indicates we'll respond asynchronously
        
      case "updateCookie":
        // Update a cookie
        if (!message.cookieData) {
          sendResponse({ success: false, error: "No cookie data provided" });
          return false;
        }
        updateCookie(message.cookieData, message.siteUrl, sendResponse);
        return true; // Indicates we'll respond asynchronously
        
      case "refreshCookieData":
        // Refresh cookie data
        if (!message.siteUrl) {
          sendResponse({ success: false, error: "No site URL provided" });
          return false;
        }
        refreshCookieData(message.siteUrl, sendResponse);
        return true; // Indicates we'll respond asynchronously
        
      default:
        // Unknown action
        sendResponse({ success: false, error: `Unknown action: ${message.action}` });
        return false;
    }
  } catch (error) {
    console.error(`Error handling action ${message.action}:`, error);
    sendResponse({ success: false, error: error.message || "Unknown error" });
    return false;
  }
});

// Update a cookie
function updateCookie(cookieData, siteUrl, callback) {
  if (!cookieData || !cookieData.name || !cookieData.domain) {
    callback({ success: false, error: "Invalid cookie data" });
    return;
  }
  
  try {
    // Cookie modification in Chrome first requires removing the existing cookie
    chrome.cookies.remove({
      url: cookieData.url,
      name: cookieData.name,
      storeId: cookieData.storeId || "0"
    }, removeResult => {
      if (chrome.runtime.lastError) {
        console.error("Error removing cookie:", chrome.runtime.lastError);
        callback({ 
          success: false, 
          error: chrome.runtime.lastError.message || "Failed to remove existing cookie"
        });
        return;
      }
      
      // Now set the cookie with updated values
      const newCookie = {
        url: cookieData.url,
        name: cookieData.name,
        value: cookieData.value || "",
        domain: cookieData.domain,
        path: cookieData.path || "/",
        secure: cookieData.secure || false,
        httpOnly: cookieData.httpOnly || false,
        sameSite: cookieData.sameSite || "unspecified",
        storeId: cookieData.storeId || "0"
      };
      
      // Add expiration if not a session cookie
      if (cookieData.expirationDate) {
        newCookie.expirationDate = cookieData.expirationDate;
      }
      
      // Set the updated cookie
      chrome.cookies.set(newCookie, setCookieResult => {
        if (chrome.runtime.lastError || !setCookieResult) {
          console.error("Error setting cookie:", chrome.runtime.lastError);
          callback({ 
            success: false, 
            error: chrome.runtime.lastError ? chrome.runtime.lastError.message : "Failed to set cookie"
          });
          return;
        }
        
        // Successfully updated, refresh cookie list
        refreshCookieData(siteUrl, callback);
      });
    });
  } catch (error) {
    console.error("Error in updateCookie:", error);
    callback({ success: false, error: error.message || "Unknown error updating cookie" });
  }
}

// Initialize when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // We'll scan site cookies when the popup is opened instead of at install time
});
