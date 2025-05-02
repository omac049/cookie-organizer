// charts.js - Handles chart creation and destruction
/* global Chart */

// Define a global object to store chart instances
window.chartInstances = {};

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

// Expose the clearExistingCharts function globally
window.clearExistingCharts = clearExistingCharts;

// Render all charts
function renderCharts() {
  console.log("Rendering charts...");
  
  try {
    // Check if Chart is defined
    if (typeof Chart === 'undefined') {
      console.error("Chart.js is not loaded. Unable to render charts.");
      return;
    }
    
    // Create charts if the canvas elements exist
    const purposeCanvas = document.getElementById("purposePieChart");
    const sessionCanvas = document.getElementById("sessionPieChart");
    const securityCanvas = document.getElementById("securityBarChart");
    
    // Get theme colors
    const chartColors = {
      necessary: getComputedStyle(document.documentElement).getPropertyValue('--necessary-color') || '#28a745',
      preferences: getComputedStyle(document.documentElement).getPropertyValue('--preferences-color') || '#17a2b8',
      analytics: getComputedStyle(document.documentElement).getPropertyValue('--analytics-color') || '#fd7e14',
      marketing: getComputedStyle(document.documentElement).getPropertyValue('--marketing-color') || '#dc3545',
      social: getComputedStyle(document.documentElement).getPropertyValue('--social-color') || '#6f42c1',
      unknown: getComputedStyle(document.documentElement).getPropertyValue('--unknown-color') || '#6c757d',
      session: getComputedStyle(document.documentElement).getPropertyValue('--session-color') || '#20c997',
      persistent: getComputedStyle(document.documentElement).getPropertyValue('--persistent-color') || '#6610f2',
      secure: getComputedStyle(document.documentElement).getPropertyValue('--secure-color') || '#28a745',
      httpOnly: getComputedStyle(document.documentElement).getPropertyValue('--httponly-color') || '#17a2b8',
      thirdParty: getComputedStyle(document.documentElement).getPropertyValue('--thirdparty-color') || '#dc3545'
    };
    
    createPurposeChart(purposeCanvas, chartColors);
    createSessionChart(sessionCanvas, chartColors);
    createSecurityChart(securityCanvas, chartColors);
  } catch (e) {
    console.error("Error rendering charts:", e);
  }
}

// Expose the renderCharts function globally
window.renderCharts = renderCharts;

// Helper function to display no data message
function displayNoDataMessage(canvas) {
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set text properties
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "14px sans-serif";
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
  
  // Draw message
  ctx.fillText("No data available", canvas.width / 2, canvas.height / 2);
}

// Create Purpose Distribution Chart
function createPurposeChart(canvas, colors) {
  if (!canvas) return;
  
  // Check if Chart is defined
  if (typeof Chart === 'undefined') {
    console.error("Chart.js is not loaded. Unable to create purpose chart.");
    return;
  }
  
  // Get purpose counts from the DOM
  const purposeCounts = {
    necessary: parseInt(document.getElementById("necessaryCount")?.textContent) || 0,
    preferences: parseInt(document.getElementById("preferencesCount")?.textContent) || 0,
    analytics: parseInt(document.getElementById("analyticsCount")?.textContent) || 0,
    marketing: parseInt(document.getElementById("marketingCount")?.textContent) || 0,
    social: parseInt(document.getElementById("socialCount")?.textContent) || 0,
    unknown: parseInt(document.getElementById("unknownCount")?.textContent) || 0
  };
  
  // Skip if no data
  if (Object.values(purposeCounts).every(count => count === 0)) {
    displayNoDataMessage(canvas);
    return;
  }
  
  // Create chart
  const ctx = canvas.getContext("2d");
  
  try {
    // Create and store the chart instance
    window.chartInstances[canvas.id] = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Necessary", "Preferences", "Analytics", "Marketing", "Social", "Unknown"],
        datasets: [{
          data: [
            purposeCounts.necessary,
            purposeCounts.preferences,
            purposeCounts.analytics,
            purposeCounts.marketing,
            purposeCounts.social,
            purposeCounts.unknown
          ],
          backgroundColor: [
            colors.necessary,
            colors.preferences,
            colors.analytics,
            colors.marketing,
            colors.social,
            colors.unknown
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error creating purpose chart:", error);
    displayNoDataMessage(canvas);
  }
}

// Create Relationship Chart
function createRelationshipChart(canvas, colors) {
  if (!canvas) return;
  
  // Check if Chart is defined
  if (typeof Chart === 'undefined') {
    console.error("Chart.js is not loaded. Unable to create relationship chart.");
    return;
  }
  
  // Get relationship counts from the DOM
  const relationshipCounts = {
    primary: parseInt(document.getElementById("primaryCount")?.textContent) || 0,
    secondary: parseInt(document.getElementById("secondaryCount")?.textContent) || 0,
    thirdParty: parseInt(document.getElementById("thirdPartyCount")?.textContent) || 0
  };
  
  // Skip if no data
  if (Object.values(relationshipCounts).every(count => count === 0)) {
    displayNoDataMessage(canvas);
    return;
  }
  
  // Create chart
  const ctx = canvas.getContext("2d");
  
  try {
    // Create and store the chart instance
    window.chartInstances[canvas.id] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Primary", "Secondary", "Third Party"],
        datasets: [{
          data: [
            relationshipCounts.primary,
            relationshipCounts.secondary,
            relationshipCounts.thirdParty
          ],
          backgroundColor: [
            colors.primary,
            colors.secondary,
            colors.thirdParty
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error creating relationship chart:", error);
    displayNoDataMessage(canvas);
  }
}

// Create Security Chart
function createSecurityChart(canvas, colors) {
  if (!canvas) return;
  
  // Check if Chart is defined
  if (typeof Chart === 'undefined') {
    console.error("Chart.js is not loaded. Unable to create security chart.");
    return;
  }
  
  // Count security attributes based on the cookie list
  let secureCount = 0;
  let notSecureCount = 0;
  let httpOnlyCount = 0;
  let notHttpOnlyCount = 0;
  
  // Get the total count to calculate percentages
  const totalCookies = parseInt(document.getElementById("totalCookies").textContent) || 0;
  
  if (totalCookies > 0) {
    // Get all cookie elements to count security attributes
    const cookieItems = document.querySelectorAll(".cookie-item");
    
    cookieItems.forEach(cookieItem => {
      const hasSecure = cookieItem.querySelector(".badge.secure") !== null;
      const hasHttpOnly = cookieItem.querySelector(".badge.httponly") !== null;
      
      if (hasSecure) {
        secureCount++;
      } else {
        notSecureCount++;
      }
      
      if (hasHttpOnly) {
        httpOnlyCount++;
      } else {
        notHttpOnlyCount++;
      }
    });
  } else {
    // Skip if no data
    displayNoDataMessage(canvas);
    return;
  }
  
  // Create chart
  const ctx = canvas.getContext("2d");
  
  try {
    // Create and store the chart instance
    window.chartInstances[canvas.id] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Secure", "HTTP Only"],
        datasets: [
          {
            label: "Yes",
            data: [secureCount, httpOnlyCount],
            backgroundColor: [colors.secure, colors.secure],
            borderWidth: 1
          },
          {
            label: "No",
            data: [notSecureCount, notHttpOnlyCount],
            backgroundColor: [colors.insecure, colors.insecure],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
            },
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
            }
          },
          x: {
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
            },
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
            }
          }
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error creating security chart:", error);
    displayNoDataMessage(canvas);
  }
}

// Create Session Chart
function createSessionChart(canvas, colors) {
  if (!canvas) return;
  
  // Check if Chart is defined
  if (typeof Chart === 'undefined') {
    console.error("Chart.js is not loaded. Unable to create session chart.");
    return;
  }
  
  // Count session vs persistent cookies
  let sessionCount = 0;
  let persistentCount = 0;
  
  // Get the total count to calculate percentages
  const totalCookies = parseInt(document.getElementById("totalCookies")?.textContent) || 0;
  
  if (totalCookies > 0) {
    // Get all cookie elements to count session attributes
    const cookieItems = document.querySelectorAll(".cookie-item");
    
    cookieItems.forEach(cookieItem => {
      const isSession = cookieItem.querySelector(".badge.session") !== null;
      
      if (isSession) {
        sessionCount++;
      } else {
        persistentCount++;
      }
    });
  } else {
    // Skip if no data
    displayNoDataMessage(canvas);
    return;
  }
  
  // Create chart
  const ctx = canvas.getContext("2d");
  
  try {
    // Create and store the chart instance
    window.chartInstances[canvas.id] = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Session", "Persistent"],
        datasets: [{
          data: [sessionCount, persistentCount],
          backgroundColor: [colors.session, colors.persistent],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error creating session chart:", error);
    displayNoDataMessage(canvas);
  }
} 