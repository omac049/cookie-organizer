// Cookie Organizer - Auto Refresh Module

// Auto-refresh functionality
let autoRefreshTimer = null;
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds

// Start auto-refresh with specified interval
function startAutoRefresh(callback, interval = DEFAULT_REFRESH_INTERVAL) {
  // Clear any existing timer
  stopAutoRefresh();
  
  // Set new timer
  autoRefreshTimer = setInterval(() => {
    console.log("Auto-refreshing cookies...");
    
    // If callback is provided, call it
    if (typeof callback === "function") {
      callback();
    }
  }, interval);
  
  console.log(`Auto-refresh started with interval: ${interval/1000} seconds`);
  
  // Return the timer ID for tracking
  return autoRefreshTimer;
}

// Stop auto-refresh
function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
    console.log("Auto-refresh stopped");
  }
}

// Toggle auto-refresh state
function toggleAutoRefresh(callback, interval, autoRefreshEnabled) {
  if (autoRefreshEnabled) {
    return startAutoRefresh(callback, interval);
  } else {
    stopAutoRefresh();
    return null;
  }
}

// Expose functions globally
window.startAutoRefresh = startAutoRefresh;
window.stopAutoRefresh = stopAutoRefresh;
window.toggleAutoRefresh = toggleAutoRefresh; 