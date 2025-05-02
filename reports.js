// Cookie Organizer - Reports Module

// Create a global namespace for the cookie reports functionality
window.cookieReports = window.cookieReports || {};

// Main function to generate a comprehensive cookie report
window.cookieReports.generateCookieReport = function(cookies, domain) {
  // Get current date for the report
  const reportDate = new Date().toLocaleString();
  
  // Basic statistics
  const stats = calculateCookieStats(cookies);
  
  // Generate detailed analytics
  const analytics = {
    purposeDistribution: analyzePurposeDistribution(cookies),
    domainAnalysis: analyzeDomains(cookies, domain),
    securityAnalysis: analyzeSecurityAttributes(cookies),
    expirationAnalysis: analyzeExpirations(cookies),
    sizeAnalysis: analyzeCookieSizes(cookies),
    trackingPotential: assessTrackingPotential(cookies),
    complianceRisks: assessComplianceRisks(cookies)
  };
  
  // Format the report data
  return {
    reportDate,
    domain,
    cookieCount: cookies.length,
    stats,
    analytics
  };
}

// Calculate basic cookie statistics
function calculateCookieStats(cookies) {
  // Purpose categories
  const purposeCounts = {
    necessary: 0,
    preferences: 0,
    analytics: 0,
    marketing: 0,
    social: 0,
    unknown: 0
  };
  
  // Relationship categories
  const relationshipCounts = {
    primary: 0,
    secondary: 0,
    thirdParty: 0
  };
  
  // Security attributes
  let secureCount = 0;
  let httpOnlyCount = 0;
  let sessionCount = 0;
  
  // Count cookies by category
  cookies.forEach(cookie => {
    // Count by purpose
    if (cookie.purpose && Object.prototype.hasOwnProperty.call(purposeCounts, cookie.purpose)) {
      purposeCounts[cookie.purpose]++;
    } else {
      purposeCounts.unknown++;
    }
    
    // Count by relationship
    if (cookie.relationship && Object.prototype.hasOwnProperty.call(relationshipCounts, cookie.relationship)) {
      relationshipCounts[cookie.relationship]++;
    }
    
    // Count by security attributes
    if (cookie.secure) secureCount++;
    if (cookie.httpOnly) httpOnlyCount++;
    if (!cookie.expirationDate) sessionCount++;
  });
  
  return {
    purposeCounts,
    relationshipCounts,
    secureCount,
    httpOnlyCount,
    sessionCount
  };
}

// Analyze cookie purpose distribution (for pie charts)
function analyzePurposeDistribution(cookies) {
  const distribution = {
    necessary: 0,
    preferences: 0,
    analytics: 0,
    marketing: 0,
    social: 0,
    unknown: 0
  };
  
  cookies.forEach(cookie => {
    if (cookie.purpose && Object.prototype.hasOwnProperty.call(distribution, cookie.purpose)) {
      distribution[cookie.purpose]++;
    } else {
      distribution.unknown++;
    }
  });
  
  // Calculate percentages
  const total = cookies.length;
  const percentages = {};
  
  for (const purpose in distribution) {
    percentages[purpose] = total > 0 ? (distribution[purpose] / total * 100).toFixed(1) : 0;
  }
  
  return {
    counts: distribution,
    percentages
  };
}

// Analyze cookie domains (primary vs third-party)
function analyzeDomains(cookies, currentDomain) {
  const domains = {};
  let primaryDomainCount = 0;
  let thirdPartyCount = 0;
  
  cookies.forEach(cookie => {
    const domain = cookie.domain || "";
    
    // Count occurrences of each domain
    domains[domain] = (domains[domain] || 0) + 1;
    
    // Check if primary or third-party
    if (cookie.relationship === "primary") {
      primaryDomainCount++;
    } else if (cookie.relationship === "thirdParty") {
      thirdPartyCount++;
    }
  });
  
  // Sort domains by cookie count (descending)
  const sortedDomains = Object.entries(domains)
    .sort((a, b) => b[1] - a[1])
    .map(([domain, count]) => ({ domain, count }));
  
  return {
    uniqueDomainCount: Object.keys(domains).length,
    primaryDomainCount,
    thirdPartyCount,
    topDomains: sortedDomains.slice(0, 5), // Top 5 domains
    allDomains: sortedDomains
  };
}

// Analyze security attributes
function analyzeSecurityAttributes(cookies) {
  const total = cookies.length;
  const secureCount = cookies.filter(c => c.secure).length;
  const httpOnlyCount = cookies.filter(c => c.httpOnly).length;
  const sameSiteStrict = cookies.filter(c => c.sameSite === "strict").length;
  const sameSiteLax = cookies.filter(c => c.sameSite === "lax").length;
  const sameSiteNone = cookies.filter(c => c.sameSite === "none").length;
  
  return {
    securePercentage: total > 0 ? (secureCount / total * 100).toFixed(1) : 0,
    httpOnlyPercentage: total > 0 ? (httpOnlyCount / total * 100).toFixed(1) : 0,
    sameSiteDistribution: {
      strict: sameSiteStrict,
      lax: sameSiteLax,
      none: sameSiteNone,
      unspecified: total - (sameSiteStrict + sameSiteLax + sameSiteNone)
    },
    securityScore: calculateSecurityScore(cookies)
  };
}

// Calculate security score (0-100)
function calculateSecurityScore(cookies) {
  if (cookies.length === 0) return 100; // No cookies = perfect score
  
  let totalPoints = 0;
  const maxPointsPerCookie = 5; // 1 point each for: secure, httpOnly, sameSite=strict/lax, short expiry, necessary purpose
  
  cookies.forEach(cookie => {
    let cookiePoints = 0;
    
    // Secure attribute
    if (cookie.secure) cookiePoints += 1;
    
    // HttpOnly attribute
    if (cookie.httpOnly) cookiePoints += 1;
    
    // SameSite attribute
    if (cookie.sameSite === "strict") cookiePoints += 1;
    else if (cookie.sameSite === "lax") cookiePoints += 0.5;
    
    // Expiration (favor session or short-lived cookies)
    if (!cookie.expirationDate) {
      cookiePoints += 1; // Session cookie
    } else {
      const now = Date.now() / 1000;
      const lifespan = cookie.expirationDate - now;
      
      if (lifespan < 86400) cookiePoints += 1; // Less than a day
      else if (lifespan < 604800) cookiePoints += 0.7; // Less than a week
      else if (lifespan < 2592000) cookiePoints += 0.3; // Less than a month
    }
    
    // Purpose (necessary cookies are better for privacy)
    if (cookie.purpose === "necessary") cookiePoints += 1;
    
    totalPoints += cookiePoints;
  });
  
  // Calculate percentage
  const maxPossiblePoints = cookies.length * maxPointsPerCookie;
  return Math.round((totalPoints / maxPossiblePoints) * 100);
}

// Analyze cookie expirations
function analyzeExpirations(cookies) {
  const now = Date.now() / 1000;
  let sessionCount = 0;
  let shortTermCount = 0; // Less than a day
  let mediumTermCount = 0; // Less than a month
  let longTermCount = 0; // More than a month
  
  // For histogram data
  const expiryTimes = [];
  
  cookies.forEach(cookie => {
    if (!cookie.expirationDate) {
      sessionCount++;
    } else {
      const lifespan = cookie.expirationDate - now;
      expiryTimes.push(lifespan);
      
      if (lifespan < 86400) shortTermCount++; // Less than a day
      else if (lifespan < 2592000) mediumTermCount++; // Less than a month
      else longTermCount++; // More than a month
    }
  });
  
  // Calculate average lifespan (excluding session cookies)
  const validExpiryTimes = expiryTimes.filter(time => time > 0);
  const averageLifespan = validExpiryTimes.length > 0 
    ? validExpiryTimes.reduce((sum, val) => sum + val, 0) / validExpiryTimes.length 
    : 0;
  
  return {
    sessionCount,
    shortTermCount,
    mediumTermCount,
    longTermCount,
    averageLifespan: formatLifespan(averageLifespan),
    histogramData: createExpiryHistogram(expiryTimes)
  };
}

// Format lifespan in human-readable format
function formatLifespan(seconds) {
  if (!seconds || seconds <= 0) return "Session";
  
  const days = Math.floor(seconds / 86400);
  
  if (days > 365) {
    const years = (days / 365).toFixed(1);
    return `${years} years`;
  } else if (days > 30) {
    const months = (days / 30).toFixed(1);
    return `${months} months`;
  } else if (days >= 1) {
    return `${days} days`;
  } else {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hours`;
  }
}

// Create histogram data for cookie expiry times
function createExpiryHistogram(expiryTimes) {
  // Define bins: session, 1 day, 1 week, 1 month, 6 months, 1 year, >1 year
  const bins = [
    { label: "Session", max: 0, count: 0 },
    { label: "1 day", max: 86400, count: 0 },
    { label: "1 week", max: 604800, count: 0 },
    { label: "1 month", max: 2592000, count: 0 },
    { label: "6 months", max: 15552000, count: 0 },
    { label: "1 year", max: 31536000, count: 0 },
    { label: ">1 year", max: Infinity, count: 0 }
  ];
  
  // Count cookies in each bin
  expiryTimes.forEach(time => {
    if (time <= 0) {
      bins[0].count++; // Session
    } else {
      for (let i = 1; i < bins.length; i++) {
        if (time <= bins[i].max) {
          bins[i].count++;
          break;
        }
      }
    }
  });
  
  return bins;
}

// Analyze cookie sizes
function analyzeCookieSizes(cookies) {
  const sizes = cookies.map(cookie => {
    // Calculate approximate size in bytes (name + value)
    const nameSize = cookie.name ? cookie.name.length : 0;
    const valueSize = cookie.value ? cookie.value.length : 0;
    return nameSize + valueSize;
  });
  
  // Find min, max, average sizes
  const totalSize = sizes.reduce((sum, size) => sum + size, 0);
  const averageSize = sizes.length > 0 ? Math.round(totalSize / sizes.length) : 0;
  const maxSize = sizes.length > 0 ? Math.max(...sizes) : 0;
  
  // Count cookies by size category
  const smallCount = sizes.filter(size => size < 100).length;
  const mediumCount = sizes.filter(size => size >= 100 && size < 1000).length;
  const largeCount = sizes.filter(size => size >= 1000).length;
  
  return {
    totalSize,
    averageSize,
    maxSize,
    sizeDistribution: {
      small: smallCount, // <100 bytes
      medium: mediumCount, // 100-1000 bytes
      large: largeCount // >1000 bytes
    }
  };
}

// Assess tracking potential
function assessTrackingPotential(cookies) {
  let trackingScore = 0;
  const maxScore = 100;
  const trackingIndicators = [];
  
  // Look for common tracking-related names or purposes
  const trackingKeywords = [
    'track', 'analytic', 'ga', 'pixel', 'visitor', 'audience',
    'adwords', 'remarketing', 'retargeting', 'conversion'
  ];
  
  // Check each cookie for tracking characteristics
  cookies.forEach(cookie => {
    let cookieTrackingScore = 0;
    const indicators = [];
    
    // Check cookie name for tracking keywords
    const name = cookie.name ? cookie.name.toLowerCase() : '';
    const hasTrackingKeyword = trackingKeywords.some(keyword => 
      name.includes(keyword)
    );
    
    if (hasTrackingKeyword) {
      cookieTrackingScore += 20;
      indicators.push(`Name contains tracking keyword: ${cookie.name}`);
    }
    
    // Check cookie purpose
    if (cookie.purpose === 'analytics' || cookie.purpose === 'marketing') {
      cookieTrackingScore += 15;
      indicators.push(`Purpose is ${cookie.purpose}`);
    }
    
    // Third-party cookies have higher tracking potential
    if (cookie.relationship === 'thirdParty') {
      cookieTrackingScore += 25;
      indicators.push('Third-party cookie');
    }
    
    // Long expiration suggests tracking
    if (cookie.expirationDate) {
      const now = Date.now() / 1000;
      const lifespan = cookie.expirationDate - now;
      
      if (lifespan > 15552000) { // > 6 months
        cookieTrackingScore += 15;
        indicators.push('Long expiration (>6 months)');
      }
    }
    
    // Long cookie value might contain user data or identifiers
    if (cookie.value && cookie.value.length > 100) {
      cookieTrackingScore += 10;
      indicators.push('Long value (possibly contains identifiers)');
    }
    
    // Add to tracking indicators if score is significant
    if (cookieTrackingScore > 30) {
      trackingIndicators.push({
        name: cookie.name,
        domain: cookie.domain,
        score: cookieTrackingScore,
        indicators
      });
    }
    
    // Add to overall tracking score
    trackingScore += cookieTrackingScore;
  });
  
  // Normalize tracking score (0-100)
  trackingScore = Math.min(Math.round(trackingScore / cookies.length), maxScore);
  
  // Sort tracking indicators by score (highest first)
  trackingIndicators.sort((a, b) => b.score - a.score);
  
  return {
    trackingScore,
    trackingLevel: getTrackingLevel(trackingScore),
    topTrackingCookies: trackingIndicators.slice(0, 5) // Top 5 tracking cookies
  };
}

// Get tracking level based on score
function getTrackingLevel(score) {
  if (score < 20) return "Low";
  if (score < 50) return "Medium";
  if (score < 80) return "High";
  return "Very High";
}

// Assess compliance risks (GDPR, ePrivacy, CCPA)
function assessComplianceRisks(cookies) {
  const risks = [];
  
  // Check for potential consent issues (marketing/analytics cookies without proper attributes)
  const marketingAnalyticsCookies = cookies.filter(cookie => 
    cookie.purpose === 'marketing' || cookie.purpose === 'analytics'
  );
  
  const insecureMarketingCookies = marketingAnalyticsCookies.filter(cookie => 
    !cookie.secure || !cookie.sameSite
  );
  
  if (insecureMarketingCookies.length > 0) {
    risks.push({
      level: "High",
      description: "Marketing/analytics cookies without proper security attributes",
      details: `${insecureMarketingCookies.length} cookies may not meet security requirements`,
      recommendation: "Ensure all cookies have Secure flag and appropriate SameSite attribute"
    });
  }
  
  // Check for long cookie lifespans
  const longLifeCookies = cookies.filter(cookie => {
    if (!cookie.expirationDate) return false;
    const now = Date.now() / 1000;
    const lifespan = cookie.expirationDate - now;
    return lifespan > 31536000; // More than 1 year
  });
  
  if (longLifeCookies.length > 0) {
    risks.push({
      level: "Medium",
      description: "Cookies with excessive lifespans",
      details: `${longLifeCookies.length} cookies have lifespans exceeding 1 year`,
      recommendation: "Reduce cookie lifespans to comply with data minimization principles"
    });
  }
  
  // Check for third-party cookies that may require additional disclosures
  const thirdPartyCookies = cookies.filter(cookie => 
    cookie.relationship === 'thirdParty'
  );
  
  if (thirdPartyCookies.length > 0) {
    risks.push({
      level: "Medium",
      description: "Third-party cookies present",
      details: `${thirdPartyCookies.length} third-party cookies identified`,
      recommendation: "Ensure proper disclosure and consent for third-party cookies"
    });
  }
  
  return {
    riskLevel: calculateOverallRiskLevel(risks),
    risks
  };
}

// Calculate overall risk level from individual risks
function calculateOverallRiskLevel(risks) {
  if (risks.some(risk => risk.level === "High")) return "High";
  if (risks.some(risk => risk.level === "Medium")) return "Medium";
  if (risks.length > 0) return "Low";
  return "Minimal";
}

// Function to generate a downloadable report
window.cookieReports.generateDownloadableReport = function(reportData) {
  // Create formatted HTML from report data
  const htmlReport = createHtmlReport(reportData);
  
  // Create Blob and download link
  const blob = new Blob([htmlReport], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  // Set filename with domain and date
  const domain = reportData.domain.replace(/[^a-zA-Z0-9]/g, '_');
  const date = new Date().toISOString().split('T')[0];
  a.download = `cookie_report_${domain}_${date}.html`;
  
  a.href = url;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Create HTML report from report data
function createHtmlReport(reportData) {
  const {
    reportDate,
    domain,
    cookieCount,
    stats,
    analytics
  } = reportData;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cookie Report - ${domain}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    h1 {
      color: #2c3e50;
    }
    h2 {
      color: #3498db;
      margin-top: 30px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    h3 {
      color: #2980b9;
    }
    .summary {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 30px;
    }
    .metrics {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric {
      flex: 1;
      min-width: 200px;
      background-color: #fff;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .metric h3 {
      margin-top: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .risk {
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 15px;
    }
    .risk-high {
      background-color: #ffeaea;
      border-left: 4px solid #e74c3c;
    }
    .risk-medium {
      background-color: #fff5e6;
      border-left: 4px solid #f39c12;
    }
    .risk-low {
      background-color: #f4f9ff;
      border-left: 4px solid #3498db;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e1e1e1;
    }
    th {
      background-color: #f8f9fa;
    }
    tr:hover {
      background-color: #f8f9fa;
    }
    .score-container {
      text-align: center;
      margin: 30px 0;
    }
    .score {
      display: inline-block;
      width: 100px;
      height: 100px;
      line-height: 100px;
      border-radius: 50%;
      font-size: 30px;
      font-weight: bold;
      color: white;
      text-align: center;
    }
    .score-good {
      background-color: #2ecc71;
    }
    .score-medium {
      background-color: #f39c12;
    }
    .score-bad {
      background-color: #e74c3c;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 12px;
      color: #7f8c8d;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Cookie Report</h1>
    <p><strong>Domain:</strong> ${domain}</p>
    <p><strong>Report Date:</strong> ${reportDate}</p>
  </div>
  
  <div class="summary">
    <h2>Executive Summary</h2>
    <p>This domain uses <strong>${cookieCount}</strong> cookies in total.</p>
    <p><strong>Security Score:</strong> ${analytics.securityAnalysis.securityScore}/100</p>
    <p><strong>Tracking Potential:</strong> ${analytics.trackingPotential.trackingLevel}</p>
    <p><strong>Compliance Risk Level:</strong> ${analytics.complianceRisks.riskLevel}</p>
  </div>
  
  <h2>Cookie Distribution</h2>
  <div class="metrics">
    <div class="metric">
      <h3>By Purpose</h3>
      <ul>
        <li>Necessary: ${stats.purposeCounts.necessary} (${analytics.purposeDistribution.percentages.necessary}%)</li>
        <li>Preferences: ${stats.purposeCounts.preferences} (${analytics.purposeDistribution.percentages.preferences}%)</li>
        <li>Analytics: ${stats.purposeCounts.analytics} (${analytics.purposeDistribution.percentages.analytics}%)</li>
        <li>Marketing: ${stats.purposeCounts.marketing} (${analytics.purposeDistribution.percentages.marketing}%)</li>
        <li>Social: ${stats.purposeCounts.social} (${analytics.purposeDistribution.percentages.social}%)</li>
        <li>Unknown: ${stats.purposeCounts.unknown} (${analytics.purposeDistribution.percentages.unknown}%)</li>
      </ul>
    </div>
    
    <div class="metric">
      <h3>By Relationship</h3>
      <ul>
        <li>First-Party: ${stats.relationshipCounts.primary}</li>
        <li>Secondary: ${stats.relationshipCounts.secondary}</li>
        <li>Third-Party: ${stats.relationshipCounts.thirdParty}</li>
      </ul>
    </div>
    
    <div class="metric">
      <h3>By Security</h3>
      <ul>
        <li>Secure: ${stats.secureCount} (${analytics.securityAnalysis.securePercentage}%)</li>
        <li>HttpOnly: ${stats.httpOnlyCount} (${analytics.securityAnalysis.httpOnlyPercentage}%)</li>
        <li>Session: ${stats.sessionCount}</li>
      </ul>
    </div>
  </div>
  
  <h2>Security Analysis</h2>
  <div class="score-container">
    <div class="score ${analytics.securityAnalysis.securityScore > 70 ? 'score-good' : analytics.securityAnalysis.securityScore > 40 ? 'score-medium' : 'score-bad'}">
      ${analytics.securityAnalysis.securityScore}
    </div>
  </div>
  
  <div class="metrics">
    <div class="metric">
      <h3>SameSite Distribution</h3>
      <ul>
        <li>Strict: ${analytics.securityAnalysis.sameSiteDistribution.strict}</li>
        <li>Lax: ${analytics.securityAnalysis.sameSiteDistribution.lax}</li>
        <li>None: ${analytics.securityAnalysis.sameSiteDistribution.none}</li>
        <li>Unspecified: ${analytics.securityAnalysis.sameSiteDistribution.unspecified}</li>
      </ul>
    </div>
  </div>
  
  <h2>Domain Analysis</h2>
  <p>This site uses cookies from ${analytics.domainAnalysis.uniqueDomainCount} unique domains.</p>
  
  <h3>Top Domains</h3>
  <table>
    <tr>
      <th>Domain</th>
      <th>Cookie Count</th>
    </tr>
    ${analytics.domainAnalysis.topDomains.map(d => `
    <tr>
      <td>${d.domain || 'Same site'}</td>
      <td>${d.count}</td>
    </tr>
    `).join('')}
  </table>
  
  <h2>Expiration Analysis</h2>
  <div class="metrics">
    <div class="metric">
      <h3>Lifespan Distribution</h3>
      <ul>
        <li>Session: ${analytics.expirationAnalysis.sessionCount}</li>
        <li>Short-term (<1 day): ${analytics.expirationAnalysis.shortTermCount}</li>
        <li>Medium-term (<1 month): ${analytics.expirationAnalysis.mediumTermCount}</li>
        <li>Long-term (>1 month): ${analytics.expirationAnalysis.longTermCount}</li>
      </ul>
      <p>Average lifespan: ${analytics.expirationAnalysis.averageLifespan}</p>
    </div>
  </div>
  
  <h2>Tracking Potential</h2>
  <div class="score-container">
    <div class="score ${analytics.trackingPotential.trackingScore < 30 ? 'score-good' : analytics.trackingPotential.trackingScore < 60 ? 'score-medium' : 'score-bad'}">
      ${analytics.trackingPotential.trackingScore}
    </div>
    <p>Tracking Level: ${analytics.trackingPotential.trackingLevel}</p>
  </div>
  
  ${analytics.trackingPotential.topTrackingCookies.length > 0 ? `
  <h3>Top Tracking Cookies</h3>
  <table>
    <tr>
      <th>Name</th>
      <th>Domain</th>
      <th>Score</th>
      <th>Indicators</th>
    </tr>
    ${analytics.trackingPotential.topTrackingCookies.map(cookie => `
    <tr>
      <td>${cookie.name}</td>
      <td>${cookie.domain || 'Same site'}</td>
      <td>${cookie.score}</td>
      <td>${cookie.indicators.join('<br>')}</td>
    </tr>
    `).join('')}
  </table>
  ` : '<p>No significant tracking cookies detected.</p>'}
  
  <h2>Compliance Risks</h2>
  ${analytics.complianceRisks.risks.length > 0 ? 
    analytics.complianceRisks.risks.map(risk => `
    <div class="risk risk-${risk.level.toLowerCase()}">
      <h3>${risk.level} Risk: ${risk.description}</h3>
      <p>${risk.details}</p>
      <p><strong>Recommendation:</strong> ${risk.recommendation}</p>
    </div>
    `).join('') : 
    '<p>No significant compliance risks detected.</p>'
  }
  
  <h2>Size Analysis</h2>
  <div class="metrics">
    <div class="metric">
      <h3>Cookie Sizes</h3>
      <ul>
        <li>Total size: ${analytics.sizeAnalysis.totalSize} bytes</li>
        <li>Average size: ${analytics.sizeAnalysis.averageSize} bytes</li>
        <li>Maximum size: ${analytics.sizeAnalysis.maxSize} bytes</li>
      </ul>
    </div>
    <div class="metric">
      <h3>Size Distribution</h3>
      <ul>
        <li>Small (<100 bytes): ${analytics.sizeAnalysis.sizeDistribution.small}</li>
        <li>Medium (100-1000 bytes): ${analytics.sizeAnalysis.sizeDistribution.medium}</li>
        <li>Large (>1000 bytes): ${analytics.sizeAnalysis.sizeDistribution.large}</li>
      </ul>
    </div>
  </div>
  
  <div class="footer">
    <p>Generated by Cookie Organizer Chrome Extension | ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>
  `;
}

// Expose functions for other modules to use
window.cookieReports = Object.assign(window.cookieReports || {}, {
  generateCookieReport: window.cookieReports.generateCookieReport,
  generateDownloadableReport: window.cookieReports.generateDownloadableReport
}); 