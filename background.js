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
  storageKey: "cookie_organizer_logs",
  
  // Log storage
  logs: [],
  
  // Initialize logger
  init: function() {
    // Load current log level from storage
    chrome.storage.local.get(["logLevel", this.storageKey], (result) => {
      if (result.logLevel !== undefined) {
        this.currentLevel = result.logLevel;
      }
      
      // Load existing logs
      if (result[this.storageKey]) {
        this.logs = result[this.storageKey];
      }
      
      this.info("Logger initialized with level:", this.getLevelName(this.currentLevel));
    });
    
    // Listen for log level changes
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "setLogLevel") {
        this.setLevel(message.level);
        sendResponse({ success: true });
      } else if (message.action === "getLogs") {
        sendResponse({ success: true, logs: this.logs });
      } else if (message.action === "clearLogs") {
        this.clearLogs();
        sendResponse({ success: true });
      }
    });
  },
  
  // Set log level
  setLevel: function(level) {
    if (typeof level === "string") {
      // Convert string level to number
      level = this.LEVELS[level.toUpperCase()] || this.LEVELS.INFO;
    }
    
    this.currentLevel = level;
    
    // Save to storage
    chrome.storage.local.set({ logLevel: level });
    
    this.info("Log level set to:", this.getLevelName(level));
  },
  
  // Get level name from numeric value
  getLevelName: function(level) {
    for (const [name, value] of Object.entries(this.LEVELS)) {
      if (value === level) return name;
    }
    return "UNKNOWN";
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
    this.info("Logs cleared");
  },
  
  // Format log message
  formatLog: function(level, args) {
    const timestamp = this.timestamp();
    const messages = Array.from(args).map(arg => {
      if (typeof arg === "object") {
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
      message: messages.join(" ")
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

// Cookie Change Monitor
// Tracks cookie changes and provides notifications for monitored domains
const CookieMonitor = {
  // Storage keys
  STORAGE_KEYS: {
    MONITORING_ENABLED: "cookie_monitoring_enabled",
    MONITORED_DOMAINS: "cookie_monitored_domains",
    COOKIE_HISTORY: "cookie_history",
    NOTIFICATION_SETTINGS: "cookie_notification_settings",
  },
  
  // Default settings
  DEFAULT_SETTINGS: {
    enabled: false,
    notifyOnAdd: true,
    notifyOnModify: true,
    notifyOnRemove: true,
    maxHistoryPerDomain: 100,
    maxDomainsToMonitor: 20
  },
  
  // Current settings
  settings: {},
  
  // Domains being monitored
  monitoredDomains: [],
  
  // Cookie history storage (keyed by domain)
  cookieHistory: {},
  
  // Initialize the cookie monitor
  init: function() {
    Logger.info("Initializing Cookie Monitor");
    this.loadSettings();
    
    // Set up event listeners for cookie changes
    chrome.cookies.onChanged.addListener(this.handleCookieChange.bind(this));
    
    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "getCookieMonitorStatus") {
        sendResponse({
          success: true,
          enabled: this.settings.enabled,
          monitoredDomains: this.monitoredDomains,
          settings: this.settings
        });
        return true;
      }
      
      if (message.action === "toggleCookieMonitoring") {
        this.toggleMonitoring(message.enabled);
        sendResponse({ success: true, enabled: this.settings.enabled });
        return true;
      }
      
      if (message.action === "addDomainToMonitor") {
        this.addDomainToMonitor(message.domain);
        sendResponse({ 
          success: true, 
          monitoredDomains: this.monitoredDomains
        });
        return true;
      }
      
      if (message.action === "removeDomainFromMonitor") {
        this.removeDomainFromMonitor(message.domain);
        sendResponse({ 
          success: true, 
          monitoredDomains: this.monitoredDomains 
        });
        return true;
      }
      
      if (message.action === "getCookieHistory") {
        sendResponse({
          success: true,
          history: this.getCookieHistory(message.domain)
        });
        return true;
      }
      
      if (message.action === "updateMonitorSettings") {
        this.updateSettings(message.settings);
        sendResponse({ success: true, settings: this.settings });
        return true;
      }
      
      if (message.action === "clearCookieHistory") {
        this.clearCookieHistory(message.domain);
        sendResponse({ success: true });
        return true;
      }
    });
  },
  
  // Load settings from storage
  loadSettings: function() {
    chrome.storage.local.get([
      this.STORAGE_KEYS.MONITORING_ENABLED,
      this.STORAGE_KEYS.MONITORED_DOMAINS,
      this.STORAGE_KEYS.COOKIE_HISTORY,
      this.STORAGE_KEYS.NOTIFICATION_SETTINGS
    ], (result) => {
      // Set default settings if none exist
      this.settings = Object.assign({}, this.DEFAULT_SETTINGS);
      
      // Override with stored settings if they exist
      if (result[this.STORAGE_KEYS.NOTIFICATION_SETTINGS]) {
        this.settings = Object.assign(
          this.settings, 
          result[this.STORAGE_KEYS.NOTIFICATION_SETTINGS]
        );
      }
      
      // Set enabled state
      this.settings.enabled = 
        result[this.STORAGE_KEYS.MONITORING_ENABLED] !== undefined 
          ? result[this.STORAGE_KEYS.MONITORING_ENABLED] 
          : this.settings.enabled;
      
      // Set monitored domains
      this.monitoredDomains = result[this.STORAGE_KEYS.MONITORED_DOMAINS] || [];
      
      // Set cookie history
      this.cookieHistory = result[this.STORAGE_KEYS.COOKIE_HISTORY] || {};
      
      Logger.info("Cookie Monitor settings loaded:", this.settings);
      Logger.info("Monitored domains:", this.monitoredDomains.length);
    });
  },
  
  // Save settings to storage
  saveSettings: function() {
    const dataToSave = {
      [this.STORAGE_KEYS.MONITORING_ENABLED]: this.settings.enabled,
      [this.STORAGE_KEYS.MONITORED_DOMAINS]: this.monitoredDomains,
      [this.STORAGE_KEYS.NOTIFICATION_SETTINGS]: this.settings
    };
    
    chrome.storage.local.set(dataToSave, () => {
      Logger.info("Cookie Monitor settings saved");
    });
  },
  
  // Save cookie history to storage
  saveCookieHistory: function() {
    chrome.storage.local.set({
      [this.STORAGE_KEYS.COOKIE_HISTORY]: this.cookieHistory
    }, () => {
      Logger.debug("Cookie history saved");
    });
  },
  
  // Toggle cookie monitoring on/off
  toggleMonitoring: function(enabled) {
    this.settings.enabled = enabled !== undefined ? enabled : !this.settings.enabled;
    this.saveSettings();
    Logger.info("Cookie monitoring " + (this.settings.enabled ? "enabled" : "disabled"));
    
    // Notify the popup if it's open
    chrome.runtime.sendMessage({
      action: "cookieMonitoringToggled",
      enabled: this.settings.enabled
    }).catch(() => {
      // Ignore errors if popup is not open
    });
  },
  
  // Update monitoring settings
  updateSettings: function(newSettings) {
    this.settings = Object.assign(this.settings, newSettings);
    this.saveSettings();
    Logger.info("Cookie Monitor settings updated:", this.settings);
  },
  
  // Add a domain to monitor
  addDomainToMonitor: function(domain) {
    if (!domain) return false;
    
    // Get base domain
    const baseDomain = getBaseDomain(domain);
    
    // Check if domain is already being monitored
    if (this.monitoredDomains.includes(baseDomain)) {
      Logger.info("Domain already being monitored:", baseDomain);
      return false;
    }
    
    // Check if we've reached the maximum number of domains to monitor
    if (this.monitoredDomains.length >= this.settings.maxDomainsToMonitor) {
      Logger.warn("Maximum number of monitored domains reached");
      return false;
    }
    
    // Add domain to monitored list
    this.monitoredDomains.push(baseDomain);
    
    // Initialize history for this domain if it doesn't exist
    if (!this.cookieHistory[baseDomain]) {
      this.cookieHistory[baseDomain] = [];
    }
    
    // Take a snapshot of current cookies for this domain
    this.takeSnapshot(baseDomain);
    
    // Save changes
    this.saveSettings();
    
    Logger.info("Domain added to monitoring:", baseDomain);
    return true;
  },
  
  // Remove a domain from monitoring
  removeDomainFromMonitor: function(domain) {
    if (!domain) return false;
    
    const baseDomain = getBaseDomain(domain);
    const index = this.monitoredDomains.indexOf(baseDomain);
    
    if (index === -1) {
      Logger.info("Domain not being monitored:", baseDomain);
      return false;
    }
    
    // Remove domain from monitored list
    this.monitoredDomains.splice(index, 1);
    
    // Save changes
    this.saveSettings();
    
    Logger.info("Domain removed from monitoring:", baseDomain);
    return true;
  },
  
  // Take a snapshot of current cookies for a domain
  takeSnapshot: async function(domain) {
    try {
      if (!domain) return;
      
      const cookies = await getAllCookies({ domain });
      
      // Store initial state without generating events
      cookies.forEach(cookie => {
        this.storeCookieState(cookie, "initial", false);
      });
      
      Logger.info("Took snapshot of", cookies.length, "cookies for", domain);
    } catch (error) {
      Logger.error("Error taking cookie snapshot:", error);
    }
  },
  
  // Handle cookie change events
  handleCookieChange: function(changeInfo) {
    // Skip if monitoring is disabled
    if (!this.settings.enabled) return;
    
    const { cookie, removed, cause } = changeInfo;
    
    // Get base domain of the cookie
    const domain = cookie.domain.startsWith(".") 
      ? cookie.domain.substring(1) 
      : cookie.domain;
    
    const baseDomain = getBaseDomain(domain);
    
    // Check if this domain is being monitored
    if (!this.monitoredDomains.includes(baseDomain)) {
      return;
    }
    
    // Determine the change type
    let changeType;
    if (removed) {
      changeType = "removed";
    } else if (cause === "explicit" || cause === "overwrite") {
      // Check if this is a new cookie or a modification
      const existingCookies = this.cookieHistory[baseDomain] || [];
      const existingCookie = existingCookies.find(c => 
        c.cookie.name === cookie.name && 
        c.cookie.path === cookie.path &&
        c.cookie.domain === cookie.domain &&
        c.changeType !== "removed"
      );
      
      changeType = existingCookie ? "modified" : "added";
    } else {
      // Other causes like 'expired', 'evicted', etc.
      changeType = cause;
    }
    
    // Store the cookie state change
    this.storeCookieState(cookie, changeType);
    
    // Notify if appropriate
    if ((changeType === "added" && this.settings.notifyOnAdd) ||
        (changeType === "modified" && this.settings.notifyOnModify) ||
        (changeType === "removed" && this.settings.notifyOnRemove)) {
      this.notifyCookieChange(cookie, changeType, baseDomain);
    }
    
    Logger.info("Cookie change detected:", cookie.name, changeType, "on", baseDomain);
  },
  
  // Store cookie state change in history
  storeCookieState: function(cookie, changeType, shouldNotify = true) {
    const domain = cookie.domain.startsWith(".") 
      ? cookie.domain.substring(1) 
      : cookie.domain;
    
    const baseDomain = getBaseDomain(domain);
    
    // Initialize history for this domain if it doesn't exist
    if (!this.cookieHistory[baseDomain]) {
      this.cookieHistory[baseDomain] = [];
    }
    
    // Add the cookie change to history
    this.cookieHistory[baseDomain].unshift({
      timestamp: Date.now(),
      changeType,
      cookie: { ...cookie },
      shouldNotify
    });
    
    // Trim history if it exceeds the maximum
    if (this.cookieHistory[baseDomain].length > this.settings.maxHistoryPerDomain) {
      this.cookieHistory[baseDomain] = 
        this.cookieHistory[baseDomain].slice(0, this.settings.maxHistoryPerDomain);
    }
    
    // Save history to storage
    this.saveCookieHistory();
    
    // Notify popup if it's open
    if (shouldNotify) {
      chrome.runtime.sendMessage({
        action: "cookieHistoryUpdated",
        domain: baseDomain,
        history: this.cookieHistory[baseDomain]
      }).catch(() => {
        // Ignore errors if popup is not open
      });
    }
  },
  
  // Notify the user about a cookie change
  notifyCookieChange: function(cookie, changeType, domain) {
    let title, message;
    
    switch (changeType) {
    case "added":
      title = "Cookie Added";
      message = `New cookie "${cookie.name}" added on ${domain}`;
      break;
    case "modified":
      title = "Cookie Modified";
      message = `Cookie "${cookie.name}" modified on ${domain}`;
      break;
    case "removed":
      title = "Cookie Removed";
      message = `Cookie "${cookie.name}" removed from ${domain}`;
      break;
    default:
      title = "Cookie Changed";
      message = `Cookie "${cookie.name}" change (${changeType}) on ${domain}`;
    }
    
    // Create a notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "/icons/48.png",
      title,
      message,
      contextMessage: "Cookie Organizer"
    });
  },
  
  // Get cookie history for a domain
  getCookieHistory: function(domain) {
    if (!domain) return [];
    
    const baseDomain = getBaseDomain(domain);
    return this.cookieHistory[baseDomain] || [];
  },
  
  // Clear cookie history for a domain
  clearCookieHistory: function(domain) {
    if (!domain) {
      // Clear all history
      this.cookieHistory = {};
    } else {
      // Clear history for specific domain
      const baseDomain = getBaseDomain(domain);
      delete this.cookieHistory[baseDomain];
    }
    
    // Save changes
    this.saveCookieHistory();
    Logger.info("Cookie history cleared for:", domain || "all domains");
  }
};

// Initialize the Cookie Monitor
CookieMonitor.init();

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
  
  // If we only have 1 or 2 parts, it's already a base domain or an IP address
  if (parts.length <= 2) {
    return hostname;
  }
  
  // Handle special cases for various country/organization TLDs
  // Common multi-part TLDs
  const multipartTlds = [
    // Country-specific
    "co.uk", "com.au", "co.jp", "co.nz", "org.uk", "ac.uk", "edu.au", "net.au", "org.au", "co.za", 
    "gov.uk", "nhs.uk", "ac.nz", "co.kr", "com.br", "com.mx", "com.sg", "co.in", "ac.in", "edu.in",
    "com.hk", "net.in", "org.in", "co.th", "ac.th", "in.th", "ac.kr", "ne.jp", "or.jp", "ac.jp",
    "govt.nz", "co.il", "org.il", "com.tr", "com.cn", "com.tw", "net.cn", "net.nz", "org.nz", "ind.in",
    "co.id", "or.id", "web.id", "sch.id", "ac.id", "ac.ir", "co.ir", "gov.ir", "id.au", "gov.au",
    
    // Geographic/specialty domains
    "com.ac", "edu.ac", "gov.ac", "mil.ac", "net.ac", "org.ac", "nom.ad", "ac.ae", "co.ae", "net.ae", 
    "org.ae", "com.af", "edu.af", "gov.af", "net.af", "org.af", "com.ag", "org.ag", "gov.ai", "org.ai"
  ];
  
  // Check for known multi-part TLDs
  for (const tld of multipartTlds) {
    if (hostname.endsWith("." + tld)) {
      const tldParts = tld.split(".");
      const requiredParts = tldParts.length + 1; // +1 for the domain name
      if (parts.length >= requiredParts) {
        return parts.slice(-(requiredParts)).join(".");
      }
    }
  }
  
  // Check for IP addresses
  if (parts.length === 4 && parts.every(part => !isNaN(parseInt(part)) && parseInt(part) >= 0 && parseInt(part) <= 255)) {
    return hostname; // It's an IP address
  }
  
  // Default case: return last two parts (standard TLD handling)
  return parts.slice(-2).join(".");
}

// Check if a cookie domain is related to a site domain
function isDomainRelated(cookieDomain, siteDomain) {
  // Remove leading dot if present
  const cleanCookieDomain = cookieDomain.replace(/^\./, "").toLowerCase();
  const cleanSiteDomain = siteDomain.replace(/^\./, "").toLowerCase();
  
  // Exact match
  if (cleanCookieDomain === cleanSiteDomain) {
    return true;
  }
  
  // Get base domains for more accurate comparison
  const cookieBaseDomain = getBaseDomain(cleanCookieDomain);
  const siteBaseDomain = getBaseDomain(cleanSiteDomain);
  
  // Check if base domains match
  if (cookieBaseDomain === siteBaseDomain) {
    return true;
  }
  
  // Cookie domain is a parent domain of site domain
  if (cleanSiteDomain.endsWith("." + cleanCookieDomain)) {
    return true;
  }
  
  // Site domain is a parent domain of cookie domain
  if (cleanCookieDomain.endsWith("." + cleanSiteDomain)) {
    return true;
  }
  
  // Check for common domains in cookie storage sharing 
  // (Some companies share cookies across their different domains)
  const cookieBaseParts = cookieBaseDomain.split(".");
  const siteBaseParts = siteBaseDomain.split(".");
  
  // If both domains have the same name part but different TLDs
  // e.g., example.com and example.org
  if (cookieBaseParts.length >= 2 && siteBaseParts.length >= 2 && 
      cookieBaseParts[cookieBaseParts.length - 2] === siteBaseParts[siteBaseParts.length - 2]) {
    
    // Only consider this a match for well-known companies that use multiple TLDs
    const commonBrands = ["google", "microsoft", "apple", "amazon", "facebook", "twitter", 
      "linkedin", "adobe", "github", "salesforce", "shopify", "paypal", 
      "stripe", "dropbox", "zoom", "netflix"];
    
    if (commonBrands.some(brand => 
      cookieBaseParts[cookieBaseParts.length - 2].includes(brand) || 
        siteBaseParts[siteBaseParts.length - 2].includes(brand))) {
      return true;
    }
  }
  
  return false;
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
    names: [
      // Authentication and session cookies
      "__cfduid", "PHPSESSID", "JSESSIONID", "ASP.NET_SessionId", "SERVERID", 
      "sessionid", "session", "auth", "csrftoken", "connect.sid", "XSRF-TOKEN",
      "AWSALB", "AWSALBCORS", "laravel_session", "X-CSRF-TOKEN", "OCSESSID",
      
      // Security and functionality
      "wp-settings", "wordpress_logged_in", "woocommerce_items_in_cart", 
      "CookieConsent", "cookielaw_accepted", "cc_cookie_accept", "CONSENT", 
      "euconsent", "cf_clearance", "datadome", "cf_use_ob",
      
      // Load balancing and AWS
      "AWSELB", "AWSALBTG", "AWS-WAFABB", "TS01", "BIGipServer", "TS"
    ],
    domains: ["cloudflare.com", "akamaiedge.net", "aws.amazon.com", "fastly.net", "vercel.app"],
    namePatterns: [
      "^csrf", "^session", "^auth", "^__Host-", "^__Secure-", "^SESS", 
      "^SSESS", "^XSRF", "^wfvt_", "^wf_", "^wp-", "^wordpress_", 
      "^laravel_", "^PHPSESS", "^ASP", "^JSESS"
    ]
  },
  [COOKIE_PURPOSES.PREFERENCES]: {
    names: [
      // User preferences
      "theme", "lang", "language", "timezone", "country", "currency", "settings",
      "user_settings", "display_mode", "ui_settings", "color_theme", "fontSize",
      "text_size", "preferred_locale", "preferred_currency", "region", "displayMode",
      
      // Feature flags and personalization (non-tracking)
      "features_enabled", "experiments", "OptanonConsent", "OneTrustActiveGroups",
      "visited", "return_visitor", "new_visitor", "contrast", "accessibility",
      "textOnly", "high_contrast", "animations_disabled"
    ],
    namePatterns: [
      "^display_", "^user_", "^pref_", "^theme_", "^lang_", "^currency_", 
      "^region_", "^locale_", "^setting_", "^ui_", "^view_", "^layout_",
      "^accessibility_", "^a11y_", "^text_size_", "^font_"
    ]
  },
  [COOKIE_PURPOSES.ANALYTICS]: {
    names: [
      // Google Analytics
      "_ga", "_gid", "_gat", "__utma", "__utmb", "__utmc", "__utmt", "__utmz", 
      "_hjid", "_hjAbsoluteSessionInProgress", "_hjIncludedInSessionSample",
      "_hjFirstSeen", "_hjSessionUser", "_hjSession", "_hjTLDTest", 
      
      // Adobe/Omniture
      "s_vi", "s_fid", "s_cc", "s_sq", "s_ppv", "sc_anonymousId",
      
      // Heap, Mixpanel, etc.
      "mp_*", "ajs_anonymous_id", "ajs_user_id", "heap", "_pk_id", "_pk_ses",
      
      // Other common analytics
      "_derived_epik", "IR_gbd", "IR_PI", "IR_12396", "_clck", "_clsk",
      "amplitude_id", "_chartbeat2", "_cb", "_cb_ls", "_cb_svref", "ln_or", 
      "matomo_sessid", "_uetsid", "_uetvid", "sailthru_visitor", 
      
      // Plausible, Fathom, Simple Analytics
      "plausible_session", "_fathom", "sa_visitor_id"
    ],
    domains: [
      "google-analytics.com", "googletagmanager.com", "hotjar.com", "crazyegg.com", 
      "optimizely.com", "segment.io", "segment.com", "mixpanel.com", "heap.io",
      "analytics.google.com", "matomo.cloud", "matomo.org", "piwik.pro", 
      "adobe.com", "omtrdc.net", "amplitude.com", "contentsquare.net",
      "plausible.io", "fathom.com", "simpleanalytics.com", "usefathom.com",
      "clarity.ms", "fullstory.com", "quantserve.com", "clicktale.net",
      "mouseflow.com", "loggly.com", "stats.wp.com"
    ],
    namePatterns: [
      "^_ga", "^_gid", "^_gat", "^_hj", "^_pk_", "^_uet", "^__qca", "^__utm", 
      "^_opt_", "^ajs_", "^amplitude", "^mp_", "^__hssc", "^__hstc", "^hubspotutk",
      "^_dc_gtm_", "^_gac_", "^_gali$", "^_gcl_au$", "^vuid", "^VISITOR_INFO",
      "^_GRECAPTCHA$", "^_vis_opt", "^_vwo_", "^IR_", "^_cs_", "^statcounter_",
      "^sc_is_visitor_unique", "^_chartbeat", "^intercom-", "^CMDD", "^CMID",
      "^_clsk", "^_clck", "^_fbp", "^_tt_enable_cookie"
    ]
  },
  [COOKIE_PURPOSES.MARKETING]: {
    names: [
      // Google/DoubleClick
      "__gads", "_fbp", "_gcl_au", "IDE", "test_cookie", "NID", "DSID", "1P_JAR", 
      "MUID", "mc", "ANID", "AID", "TAID", "exchange_uid", "__gpi", "FPGCLAW",

      // Facebook
      "datr", "fr", "sb", "wd", "c_user", "xs", "spin", "presence", 
      
      // Other ad networks
      "TDID", "TDCPM", "criteo", "uuid2", "tuuid", "uid", "PUBMDCID", "KRTBCOOKIE_",
      "__adroll", "CMPS", "CMID", "AdCloudRecord", "AWSALB", "demdex", "VISITOR_INFO1_LIVE",
      
      // Retargeting
      "_pinterest_ct", "_pinterest_sess", "yandexuid", "i", "yabs-sid",
      "_tac", "_tas", "_ttp", "_4c_", "personalization_id", "anj", "usermatch",
      "taboola_session_id", "taboola_upci", "t_gid", "yuidss"
    ],
    domains: [
      "doubleclick.net", "adservice.google.com", "googlesyndication.com", "adform.net", 
      "facebook.com", "ads.linkedin.com", "adnxs.com", "rubiconproject.com",
      "casalemedia.com", "amazon-adsystem.com", "media.net", "pubmatic.com",
      "advertising.com", "outbrain.com", "taboola.com", "criteo.com", "bidswitch.net",
      "bing.com", "tapad.com", "ads.yahoo.com", "bluekai.com", "spotxchange.com",
      "innovid.com", "ad.doubleclick.net", "adroll.com", "pinterest.com", "yandex.ru",
      "tiktok.com", "smartadserver.com", "snap.com", "licdn.com"
    ],
    namePatterns: [
      "^_gcl_", "^_fbp", "^ad-id", "^ad_", "^ads_", "^__gfp_", "^criteo", 
      "^lidc", "^match_", "^muid", "^_ok", "^_okbk", "^_okdetect", "^_okla",
      "^_oklv", "^pxrc", "^pixel_", "^rtbhouse", "^_scid", "^_tt_", "^uids", 
      "^tuuid_lu", "^trc_cookie", "^sovrn_session", "^visitor-id", "^id-", 
      "^adrl", "^yasc", "^uid", "^AWSALB", "^taboola", "^_pinterest"
    ]
  },
  [COOKIE_PURPOSES.SOCIAL]: {
    names: [
      // Twitter
      "guest_id", "personalization_id", "ct0", "twid", "tfw_exp", "_twitter_sess",
      
      // Facebook
      "c_user", "xs", "fr", "presence", "m_pixel_ratio", "locale", "datr",
      
      // LinkedIn
      "bcookie", "bscookie", "li_gc", "lidc", "UserMatchHistory", "lang",
      
      // Other platforms
      "guest_id", "kdt", "personalization_id", "remember_checked_on", "twid",
      "_pinterest_ct", "_pinterest_sess", "csrftoken", "rur", "mid", "ds_user_id",
      "sessionid", "igfl", "mcd", "csrftoken", "YSC", "PREF", "SID", "SSID", "SIDCC",
      "remote_sid"
    ],
    domains: [
      "facebook.com", "twitter.com", "linkedin.com", "instagram.com", "pinterest.com", 
      "youtube.com", "tiktok.com", "reddit.com", "tumblr.com", "snapchat.com",
      "static.xx.fbcdn.net", "platform.twitter.com", "cdn.syndication.twimg.com",
      "pinimg.com", "t.co", "disqus.com", "connect.facebook.net", "facebook.net",
      "instagram.com", "links.pinterest.com", "widgets.pinterest.com", "medium.com",
      "vimeo.com", "disquscdn.com"
    ],
    namePatterns: [
      "^lidc", "^bcookie", "^bscookie", "^x-src", "^_twitter", "^_pin", "^_ig_",
      "^fb_", "^ig_", "^tik_tok", "^snapchat", "^_reddit_session", "^rdt_",
      "^tumblr_", "^twll", "^auth_token_", "^vuid"
    ]
  }
};

// Determine cookie purpose based on name, domain and other properties
function determineCookiePurpose(cookie) {
  // Check against known patterns first - this is the most reliable method
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

  // If no patterns matched, use more advanced heuristics
  const nameLower = cookie.name.toLowerCase();
  
  // Check for common patterns in cookie names
  // Authentication and security related cookies
  if (nameLower.includes("auth") || 
      nameLower.includes("token") || 
      nameLower.includes("session") || 
      nameLower.includes("csrf") ||
      nameLower.includes("xsrf") ||
      nameLower.includes("login") ||
      nameLower.includes("logged") ||
      nameLower.includes("secure") ||
      nameLower.includes("verify")) {
    return COOKIE_PURPOSES.NECESSARY;
  }
  
  // User preferences
  if (nameLower.includes("pref") || 
      nameLower.includes("lang") || 
      nameLower.includes("theme") || 
      nameLower.includes("setting") ||
      nameLower.includes("color") ||
      nameLower.includes("mode") ||
      nameLower.includes("layout") ||
      nameLower.includes("config") ||
      nameLower.includes("display")) {
    return COOKIE_PURPOSES.PREFERENCES;
  }
  
  // Analytics and metrics
  if (nameLower.includes("track") || 
      nameLower.includes("stat") || 
      nameLower.includes("metric") || 
      nameLower.includes("visit") ||
      nameLower.includes("analytic") ||
      nameLower.includes("monitor") ||
      nameLower.includes("perf") ||
      nameLower.includes("measure") ||
      nameLower.includes("pixel") ||
      nameLower.includes("clarity")) {
    return COOKIE_PURPOSES.ANALYTICS;
  }
  
  // Marketing and advertising
  if (nameLower.includes("ad") || 
      nameLower.includes("promo") || 
      nameLower.includes("campaign") ||
      nameLower.includes("market") ||
      nameLower.includes("banner") ||
      nameLower.includes("promot") ||
      nameLower.includes("sponsor") ||
      nameLower.includes("partner") ||
      nameLower.includes("affiliate") ||
      nameLower.includes("commerc") ||
      nameLower.includes("remarket") ||
      nameLower.includes("advert")) {
    return COOKIE_PURPOSES.MARKETING;
  }
  
  // Social media
  if (nameLower.includes("social") ||
      nameLower.includes("share") ||
      nameLower.includes("tweet") ||
      nameLower.includes("like") ||
      nameLower.includes("follow") ||
      nameLower.includes("fb-") ||
      nameLower.includes("tw-") ||
      nameLower.includes("pin-") ||
      nameLower.includes("ig-") ||
      nameLower.includes("feed")) {
    return COOKIE_PURPOSES.SOCIAL;
  }
  
  // Check cookie domain for clues
  const cookieDomain = cookie.domain.toLowerCase();
  
  // Common analytics domains not caught earlier
  if (cookieDomain.includes("stats") ||
      cookieDomain.includes("track") ||
      cookieDomain.includes("metric") ||
      cookieDomain.includes("counter") ||
      cookieDomain.includes("pixel") ||
      cookieDomain.includes("tag")) {
    return COOKIE_PURPOSES.ANALYTICS;
  }
  
  // Common ad domains not caught earlier
  if (cookieDomain.includes("ad") ||
      cookieDomain.includes("ads") ||
      cookieDomain.includes("advert") ||
      cookieDomain.includes("market") ||
      cookieDomain.includes("promo")) {
    return COOKIE_PURPOSES.MARKETING;
  }
  
  // Some common heuristics for types not matched above
  if (cookie.secure && cookie.httpOnly) {
    // Secure and httpOnly cookies are often for authentication/sessions
    return COOKIE_PURPOSES.NECESSARY;
  }
  
  if (nameLower.includes("consent") || 
      nameLower.includes("gdpr") ||
      nameLower.includes("ccpa") ||
      nameLower.includes("cookie-") ||
      nameLower.includes("privacy") ||
      nameLower.includes("optanon") ||
      nameLower.includes("onetrust")) {
    return COOKIE_PURPOSES.NECESSARY;
  }
  
  // Short session cookies with no expiration are often necessary
  if (!cookie.expirationDate) {
    return COOKIE_PURPOSES.NECESSARY;
  }
  
  // Cookie expiration time can give clues
  const expirationDate = cookie.expirationDate ? new Date(cookie.expirationDate * 1000) : null;
  const now = new Date();
  
  if (expirationDate) {
    // Very short-lived cookies (< 1 hour) are often session-related
    const oneHourFromNow = new Date(now.getTime() + (1 * 60 * 60 * 1000));
    if (expirationDate < oneHourFromNow) {
      return COOKIE_PURPOSES.NECESSARY;
    }
    
    // Short-lived cookies (< 1 day) might be for temporary preferences
    const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    if (expirationDate < oneDayFromNow) {
      return COOKIE_PURPOSES.PREFERENCES;
    }
    
    // Medium-term cookies (< 30 days) could be analytics
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    if (expirationDate < thirtyDaysFromNow) {
      return COOKIE_PURPOSES.ANALYTICS;
    }
    
    // Long-lived cookies (> 1 year) are often for tracking/marketing
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    if (expirationDate > oneYearFromNow) {
      return COOKIE_PURPOSES.MARKETING;
    }
  }
  
  // If we still can't determine the purpose, it's unknown
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
      return { success: false, error: "No URL provided" };
    }
    
    // Parse the site URL
    const url = new URL(siteUrl);
    const domain = url.hostname;
    const baseDomain = getBaseDomain(domain);
    
    console.log(`Organizing cookies for ${siteUrl} (domain: ${domain}, baseDomain: ${baseDomain})`);
    
    // Fetch all cookies that could be related to this site
    let allCookies = [];
    
    try {
      // Get cookies for the exact domain
      const domainCookies = await getAllCookies({ domain });
      console.log(`Found ${domainCookies.length} cookies for domain ${domain}`);
      allCookies = allCookies.concat(domainCookies);
      
      // Get cookies for the URL (captures path-specific cookies)
      const urlCookies = await getAllCookies({ url: siteUrl });
      console.log(`Found ${urlCookies.length} cookies for URL ${siteUrl}`);
      allCookies = allCookies.concat(urlCookies);
      
      // Get cookies for the base domain to capture subdomains
      if (baseDomain !== domain) {
        const baseDomainCookies = await getAllCookies({ domain: baseDomain });
        console.log(`Found ${baseDomainCookies.length} cookies for base domain ${baseDomain}`);
        allCookies = allCookies.concat(baseDomainCookies);
      }
      
      // For educational domains, add special handling
      if (domain.endsWith(".edu")) {
        try {
          const eduCookies = await getAllCookies({});
          const filteredEduCookies = eduCookies.filter(cookie => 
            cookie.domain.endsWith(".edu") || 
            cookie.domain.includes(baseDomain)
          );
          console.log(`Found ${filteredEduCookies.length} additional .edu-related cookies`);
          allCookies = allCookies.concat(filteredEduCookies);
        } catch (eduError) {
          console.warn("Error fetching additional .edu cookies:", eduError);
        }
      }
    } catch (fetchError) {
      console.error("Error fetching cookies:", fetchError);
      return { 
        success: false, 
        error: "Failed to fetch cookies. " + fetchError.message
      };
    }
    
    // Remove duplicates by creating a Map with a unique key for each cookie
    const cookieMap = new Map();
    
    // Helper function to add cookies to map
    const addCookiesToMap = (cookies) => {
      if (!cookies || !cookies.length) return;
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const key = `${cookie.name}|${cookie.domain}|${cookie.path}`;
        cookieMap.set(key, cookie);
      }
    };
    
    // Add all cookies to the map
    addCookiesToMap(allCookies);
    
    // Convert map back to array and categorize each cookie
    const uniqueCookies = Array.from(cookieMap.values());
    console.log(`Found ${uniqueCookies.length} unique cookies after deduplication`);
    
    // Organize cookies by purpose and relationship
    const cookiesByPurpose = {
      necessary: [],
      preferences: [],
      analytics: [],
      marketing: [],
      social: [],
      unknown: []
    };
    
    const cookiesByRelationship = {
      primary: [],
      secondary: [],
      thirdParty: []
    };
    
    // Categorize each cookie
    for (let i = 0; i < uniqueCookies.length; i++) {
      const cookie = uniqueCookies[i];
      
      // Categorize by purpose and relationship
      const categorized = categorizeCookie(cookie, siteUrl);
      
      // Add to the appropriate purpose category
      if (cookiesByPurpose[categorized.purpose]) {
        cookiesByPurpose[categorized.purpose].push(cookie);
      } else {
        cookiesByPurpose.unknown.push(cookie);
      }
      
      // Add to the appropriate relationship category
      if (cookiesByRelationship[categorized.relationship]) {
        cookiesByRelationship[categorized.relationship].push(cookie);
      } else {
        cookiesByRelationship.thirdParty.push(cookie);
      }
      
      // Store categorization on the cookie object itself
      cookie.purposeCategory = categorized.purpose;
      cookie.relationshipCategory = categorized.relationship;
    }
    
    // Generate statistics
    const stats = {
      total: uniqueCookies.length,
      primary: cookiesByRelationship.primary.length,
      secondary: cookiesByRelationship.secondary.length,
      thirdParty: cookiesByRelationship.thirdParty.length,
      byPurpose: {
        necessary: cookiesByPurpose.necessary.length,
        preferences: cookiesByPurpose.preferences.length,
        analytics: cookiesByPurpose.analytics.length,
        marketing: cookiesByPurpose.marketing.length,
        social: cookiesByPurpose.social.length,
        unknown: cookiesByPurpose.unknown.length
      }
    };
    
    // Return organized cookies
    return {
      success: true,
      cookies: uniqueCookies,
      cookiesByPurpose,
      cookiesByRelationship,
      stats,
      siteUrl
    };
  } catch (error) {
    console.error("Error organizing cookies:", error);
    return { 
      success: false, 
      error: error.message || "An error occurred while organizing cookies"
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
async function scanActiveTabCookies(message, sendResponse) {
  try {
    // Get URL from the message or from the current active tab
    let tabUrl = message.url;
    
    if (!tabUrl) {
      // If no URL provided in message, get it from the current tab
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
  console.log("Background script received message:", message);
  
  // Return true to indicate we'll respond asynchronously
  if (message.action === "getCookies" && message.url) {
    console.log("Processing getCookies action for URL:", message.url);
    
    try {
      const url = new URL(message.url);
      const domain = url.hostname;
      const baseDomain = getBaseDomain(domain);
      
      // Get all cookies using more comprehensive approach
      Promise.all([
        // Get cookies for the exact domain
        new Promise(resolve => chrome.cookies.getAll({ domain }, cookies => {
          if (chrome.runtime.lastError) {
            console.error("Error getting domain cookies:", chrome.runtime.lastError);
            resolve([]);
          } else {
            resolve(cookies);
          }
        })),
        // Get cookies for the URL (captures path-specific cookies)
        new Promise(resolve => chrome.cookies.getAll({ url: message.url }, cookies => {
          if (chrome.runtime.lastError) {
            console.error("Error getting URL cookies:", chrome.runtime.lastError);
            resolve([]);
          } else {
            resolve(cookies);
          }
        })),
        // Get cookies for the base domain to capture subdomains
        new Promise(resolve => chrome.cookies.getAll({ domain: baseDomain }, cookies => {
          if (chrome.runtime.lastError) {
            console.error("Error getting base domain cookies:", chrome.runtime.lastError);
            resolve([]);
          } else {
            resolve(cookies);
          }
        }))
      ]).then(cookieArrays => {
        // Merge all cookie arrays and remove duplicates
        const cookieMap = new Map();
        
        // Helper function to add cookies to map
        const addCookiesToMap = (cookies) => {
          if (!cookies || !cookies.length) return;
          for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const key = `${cookie.name}|${cookie.domain}|${cookie.path}`;
            cookieMap.set(key, cookie);
          }
        };
        
        // Add all cookies to the map
        cookieArrays.forEach(cookies => addCookiesToMap(cookies));
        
        // Convert map back to array
        const cookies = Array.from(cookieMap.values());
        
        console.log(`Found ${cookies.length} unique cookies for domain ${domain}`);
        
        // Organize cookies by purpose (simplified for now)
        const cookiesByPurpose = {
          necessary: [],
          preferences: [],
          analytics: [],
          marketing: [],
          social: [],
          unknown: []
        };
        
        // Organize cookies by relationship
        const cookiesByRelationship = {
          primary: [],
          secondary: [],
          thirdParty: []
        };
        
        // Simple categorization based on cookie names (this should be more sophisticated in production)
        cookies.forEach(cookie => {
          const name = cookie.name.toLowerCase();
          
          // Determine purpose (very simplified logic)
          if (name.includes("sess") || name.includes("auth") || name.includes("token")) {
            cookie.purposeCategory = "necessary";
            cookiesByPurpose.necessary.push(cookie);
          } else if (name.includes("pref") || name.includes("theme") || name.includes("setting")) {
            cookie.purposeCategory = "preferences";
            cookiesByPurpose.preferences.push(cookie);
          } else if (name.includes("ga") || name.includes("analytic") || name.includes("stat")) {
            cookie.purposeCategory = "analytics";
            cookiesByPurpose.analytics.push(cookie);
          } else if (name.includes("ad") || name.includes("campaign") || name.includes("track")) {
            cookie.purposeCategory = "marketing";
            cookiesByPurpose.marketing.push(cookie);
          } else if (name.includes("fb") || name.includes("twitter") || name.includes("social")) {
            cookie.purposeCategory = "social";
            cookiesByPurpose.social.push(cookie);
          } else {
            cookie.purposeCategory = "unknown";
            cookiesByPurpose.unknown.push(cookie);
          }
          
          // Determine relationship (improved logic)
          if (cookie.domain === domain || cookie.domain === `.${domain}`) {
            cookie.relationshipCategory = "primary";
            cookiesByRelationship.primary.push(cookie);
          } else if (cookie.domain.endsWith(`.${domain}`) || domain.endsWith(`.${cookie.domain.replace(/^\./, "")}`)) {
            cookie.relationshipCategory = "secondary";
            cookiesByRelationship.secondary.push(cookie);
          } else {
            cookie.relationshipCategory = "thirdParty";
            cookiesByRelationship.thirdParty.push(cookie);
          }
        });
        
        // Generate stats
        const stats = {
          total: cookies.length,
          primary: cookiesByRelationship.primary.length,
          secondary: cookiesByRelationship.secondary.length,
          thirdParty: cookiesByRelationship.thirdParty.length
        };
        
        sendResponse({
          success: true,
          cookies: cookies,
          cookiesByPurpose: cookiesByPurpose,
          cookiesByRelationship: cookiesByRelationship,
          stats: stats
        });
      }).catch(error => {
        console.error("Error processing cookies:", error);
        sendResponse({ 
          success: false, 
          error: error.message || "Error processing cookies" 
        });
      });
      
      // Return true to indicate we'll respond asynchronously
      return true;
    } catch (error) {
      console.error("Error processing URL:", error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  }
  
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
      scanActiveTabCookies(message, sendResponse);
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
