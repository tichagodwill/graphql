import { 
  fetchUserIdQuery, 
  fetchUserDetailsQuery, 
  fetchAuditDetailsQuery, 
  fetchExperienceQuery, 
  fetchSkillsQuery, 
  fetchRecentProjectsQuery 
} from './queries.js';
import { renderRadarChart, createProgressBar } from './charts.js';

const endpoint = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

// Check if user is logged in
const checkLogin = () => {
  const jwt = localStorage.getItem('token');
  if (!jwt) {
    // Redirect to login if token is not found
    window.location.href = 'login.html';
    return false;
  }
  return true;
};

// Initialization Function
let userId;
const initialize = async () => {
  if (!checkLogin()) return; // Check login before proceeding
  
  console.log('Initializing dashboard...');
  try {
    userId = await fetchUserId();
    const userDetails = await fetchUserDetails(userId);
    
    displayUserInfo(userDetails);
    await loadData(userId);
    setupEventListeners();
  } catch (error) {
    console.error('Initialization error:', error);
  }
};

// Load Data Function
const loadData = async (userId) => {
  try {
    await Promise.all([
      fetchAndDisplayRecentProjects(),
      refreshProgressBars(userId),
      fetchAndDisplayExperience(userId),
      fetchAndDisplaySkills(userId)  // Pass userId if needed
    ]);
  } catch (error) {
    console.error('Data loading error:', error);
  }
};

// Fetch Functions
const fetchUserId = async () => {
  const { data } = await getData(fetchUserIdQuery);
  return data.user[0].id;
};

const fetchUserDetails = async (userId) => {
  const { data } = await getData(fetchUserDetailsQuery(userId));
  const userDetails = data.user[0];
  userDetails.campus = capitalize(userDetails.campus);
  return userDetails;
};

const fetchAuditDetails = async (userId) => {
  const { data } = await getData(fetchAuditDetailsQuery(userId));
  return data.user[0];
};

const fetchAndDisplayRecentProjects = async () => {
  const { data } = await getData(fetchRecentProjectsQuery);
  const recentProjects = data.transaction.map(item => `${item.object.type} — ${item.object.name}`);
  
  const recentProjectsContainer = document.getElementById('recent-activity-container');
  recentProjectsContainer.innerHTML = recentProjects.map(project => `<li>${project}</li>`).join('');
};

const fetchAndDisplayExperience = async (userId) => {
  const { data } = await getData(fetchExperienceQuery(userId));
  const experiencePoints = data.transaction_aggregate.aggregate.sum.amount || 0;
  
  document.getElementById('experience-points').textContent = experiencePoints >= 999900 
    ? `${(experiencePoints / 1e6).toFixed(2)} MB`
    : `${Math.floor(experiencePoints / 1e3)} kB`;
};

const fetchAndDisplaySkills = async () => {
  const { data } = await getData(fetchSkillsQuery);
  const userSkills = data.user[0]?.transactions || [];
  
  const skillData = userSkills.reduce((acc, skill) => {
    acc[skill.type] = (acc[skill.type] || 0) + skill.amount;
    return acc;
  }, {});

  const skillLabels = Object.keys(skillData).map(formatSkill);
  const skillValues = Object.values(skillData);

  // Ensure radar chart is only rendered if there are skills
  if (skillValues.length > 0 && skillLabels.length > 0) {
    renderRadarChart(skillValues, skillLabels, '#skills-radar-chart');
  } else {
    console.warn('No skills data available for radar chart.');
  }
};

// Data Display Functions
const displayUserInfo = (userDetails) => {
  const userInfoContainer = document.getElementById('user-info-container');
  userInfoContainer.innerHTML = `
    <li>First Name: ${userDetails.firstName}</li>
    <li>Last Name: ${userDetails.lastName}</li>
    <li>Email: ${userDetails.email}</li>
    <li>Campus: ${userDetails.campus}</li>
    <li>Campus ID: ${userDetails.login}</li>
  `;

  document.getElementById('dashboard-welcome-message').textContent = 
    `Welcome to your dashboard, ${userDetails.firstName} ${userDetails.lastName}`;
};

// Progress Bar Functions
const refreshProgressBars = async (userId) => {
  const auditInfo = await fetchAuditDetails(userId);
  const formattedAuditRatio = auditInfo.auditRatio.toFixed(1);
  
  const totalDownFormatted = formatSize(auditInfo.totalDown);
  const totalUpFormatted = formatSize(auditInfo.totalUp);
  
  const maxValue = Math.max(auditInfo.totalDown, auditInfo.totalUp);
  const downPercentage = (auditInfo.totalDown / maxValue) * 100;
  const upPercentage = (auditInfo.totalUp / maxValue) * 100;

  const colors = {
    up: auditInfo.totalUp >= auditInfo.totalDown ? '#28a745' : '#17a2b8',
    down: auditInfo.totalDown >= auditInfo.totalUp ? '#dc3545' : '#ffc107',
  };

  updateProgressBars(formattedAuditRatio, totalUpFormatted, totalDownFormatted, upPercentage, downPercentage, colors);
};

const updateProgressBars = (formattedAuditRatio, totalUpFormatted, totalDownFormatted, upPercentage, downPercentage, colors) => {
  document.getElementById('audit-ratio-value').textContent = formattedAuditRatio;
  createProgressBar('#completed-audits-progress', upPercentage, colors.up);
  createProgressBar('#received-audits-progress', downPercentage, colors.down);
  
  document.getElementById('completed-audits-text').textContent = totalUpFormatted;
  document.getElementById('received-audits-text').textContent = totalDownFormatted;
};

// Event Listeners
const setupEventListeners = () => {
  window.addEventListener('resize', () => refreshProgressBars(userId));
  document.getElementById('logout-link').addEventListener('click', handleLogout);
};

// Logout Functionality
const handleLogout = async () => {
  localStorage.removeItem('token'); // Ensure token is removed
  window.location.href = 'login.html'; // Redirect to login page
};

// Function to get data from a GraphQL API
const getData = async (query) => {
  const jwt = localStorage.getItem('token'); // Always get the latest token
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }
  
  return response.json();
};

// Utility Functions
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const formatSize = (size) => {
  const mbThreshold = 1e6;
  const kbThreshold = 1e3;
  if (size >= mbThreshold) return `${(size / mbThreshold).toFixed(2)} MB`;
  if (size >= kbThreshold) return `${Math.ceil(size / kbThreshold)} kB`;
  return `${size} bytes`;
};

const formatSkill = (skill) => skill.replace('skill_', '').replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

// Run the authentication check and initialize
initialize();
