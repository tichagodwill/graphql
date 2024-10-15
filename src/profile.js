import { 
  fetchUserIdQuery, 
  fetchUserDetailsQuery, 
  fetchAuditDetailsQuery, 
  fetchExperienceQuery, 
  fetchSkillsQuery, 
  fetchRecentProjectsQuery 
} from './queries.js';

const endpoint = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';
const jwt = localStorage.getItem('token');

// Function to get data from a GraphQL API
const getData = async (query) => {
  console.log(jwt);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  
  return response.json();
};

// Utility Functions
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const formatSize = (size) => {
  const mbThreshold = 1000 * 1000;
  const kbThreshold = 1000;
  if (size >= mbThreshold) return `${(size / mbThreshold).toFixed(2)} MB`;
  if (size >= kbThreshold) return `${Math.ceil(size / kbThreshold)} kB`;
  return `${size} bytes`;
};
const formatSkill = (skill) => skill.replace('skill_', '').replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

// Main Execution Function
const initialize = async () => {
  try {
    const userId = await fetchUserId();
    const userDetails = await fetchUserDetails(userId);
    displayUserInfo(userDetails);
    await fetchAndDisplayRecentProjects();
    await refreshProgressBars(userId);
    await fetchAndDisplayExperience(userId);
    await fetchAndDisplaySkills();
    
    setupEventListeners();
  } catch (err) {
    console.error('Initialization error:', err);
  }
};

// Fetch Functions
const fetchUserId = async () => {
  const response = await getData(fetchUserIdQuery);
  console.log(response);
  return response.data.user[0].id;
};

// Run the authentication check and initialize
initialize();

const fetchUserDetails = async (userId) => {
  const response = await getData(fetchUserDetailsQuery(userId));
  const userDetails = response.data.user[0];
  userDetails.campus = capitalize(userDetails.campus);
  return userDetails;
};

// Display Functions
const displayUserInfo = (userDetails) => {
  const userInfoList = [
    `First Name: ${userDetails.firstName}`,
    `Last Name: ${userDetails.lastName}`,
    `Email: ${userDetails.email}`,
    `Campus: ${userDetails.campus}`,
    `Campus ID: ${userDetails.login}`,
  ];

  const userInfoContainer = document.getElementById('user-info-container');
  userInfoList.forEach(info => {
    const listElement = document.createElement('li');
    listElement.textContent = info;
    userInfoContainer.appendChild(listElement);
  });

  const fullName = `${userDetails.firstName} ${userDetails.lastName}`;
  document.getElementById('dashboard-welcome-message').textContent = `Welcome to your dashboard, ${fullName}`;
};

const fetchAndDisplayRecentProjects = async () => {
  const response = await getData(fetchRecentProjectsQuery);
  const recentProjects = response.data.transaction.map(item => `${item.object.type} — ${item.object.name}`);
  
  const recentProjectsContainer = document.getElementById('recent-activity-container');
  recentProjectsContainer.innerHTML = ''; // Clear existing items
  recentProjects.forEach(project => {
    const projectElement = document.createElement('li');
    projectElement.textContent = project;
    recentProjectsContainer.appendChild(projectElement);
  });
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

  // Color determination
  const upColor = auditInfo.totalUp >= auditInfo.totalDown ? '#28a745' : '#dc3545';
  const downColor = auditInfo.totalDown >= auditInfo.totalUp ? '#17a2b8' : '#ffc107';

  document.getElementById('audit-ratio-value').textContent = formattedAuditRatio;
  createProgressBar('#completed-audits-progress', upPercentage, upColor);
  createProgressBar('#received-audits-progress', downPercentage, downColor);
  
  document.getElementById('completed-audits-text').textContent = totalUpFormatted;
  document.getElementById('received-audits-text').textContent = totalDownFormatted;
};

const fetchAuditDetails = async (userId) => {
  const response = await getData(fetchAuditDetailsQuery(userId));
  return response.data.user[0];
};

const fetchAndDisplayExperience = async (userId) => {
  const response = await getData(fetchExperienceQuery(userId));
  const experiencePoints = response.data.transaction_aggregate.aggregate.sum.amount || 0;
  const experienceText = experiencePoints >= 999900 
    ? `${(experiencePoints / 1000000).toFixed(2)} MB`
    : `${Math.floor(experiencePoints / 1000)} kB`;
  
  document.getElementById('experience-points').textContent = experienceText;
};

const fetchAndDisplaySkills = async () => {
  const response = await getData(fetchSkillsQuery);
  const userSkills = response.data.user[0]?.transactions || [];
  
  const skillData = userSkills.reduce((acc, skill) => {
    acc[skill.type] = (acc[skill.type] || 0) + skill.amount;
    return acc;
  }, {});

  const skillLabels = Object.keys(skillData).map(formatSkill);
  const skillValues = Object.values(skillData);
  
  renderRadarChart(skillValues, skillLabels, '#skills-radar-chart', 'Technical Skills');
};

// Chart Functions
function renderRadarChart(data, labels, containerSelector, title) {
  const svg = d3.select(containerSelector);
  const dimensions = svg.node().getBoundingClientRect();
  const radius = Math.min(dimensions.width, dimensions.height) / 2 - 60;

  const scale = d3.scaleLinear().domain([0, d3.max(data)]).range([20, radius]);
  const angleSlice = (Math.PI * 2) / labels.length;

  svg.attr('width', '100%')
     .attr('height', '100%')
     .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)
     .selectAll('*').remove(); // Clear previous content

  const group = svg.append('g').attr('transform', `translate(${dimensions.width / 2}, ${dimensions.height / 2})`);

  // Draw axes and radar shapes
  for (let i = 0; i < 5; i++) {
    group.append('circle')
         .attr('r', radius / 5 * (i + 1))
         .attr('fill', 'Crimson')
         .attr('fill-opacity', 0.2);
  }

  const radarLine = d3.lineRadial()
    .radius(d => scale(d))
    .angle((d, i) => i * angleSlice);

  group.append('path')
       .datum(data)
       .attr('d', radarLine)
       .attr('fill', 'rgba(0, 255, 127, 0.5)')
       .attr('stroke', 'rgba(200, 250, 120, 1)');

  // Add axis labels
  const labelsGroup = group.append('g').attr('class', 'axisLabels');
  labelsGroup.selectAll('.axisLabel')
    .data(labels)
    .enter()
    .append('text')
    .attr('x', (d, i) => scale(d3.max(data) * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
    .attr('y', (d, i) => scale(d3.max(data) * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
    .attr('font-size', '10px')
    .attr('text-anchor', 'middle')
    .attr('fill', 'white') // Label color
    .text(d => d);
}

// Progress Bar Functions
function createProgressBar(selector, percentage, color) {
  const svg = d3.select(selector);
  const width = svg.node().getBoundingClientRect().width;
  const height = 20;

  svg.attr('width', width).attr('height', height).selectAll('*').remove();
  svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#e0e0e0'); // Background
  svg.append('rect').attr('width', (percentage / 100) * width).attr('height', height).attr('fill', color); // Foreground
}

// Event Listeners
const setupEventListeners = () => {
  window.addEventListener('resize', refreshProgressBars);
  document.getElementById('logout-link').addEventListener('click', handleLogout);
};

// Logout Functionality
const handleLogout = async () => {
  try {
    localStorage.removeItem('jwt');
    window.location.href = 'login.html';
  } catch (err) {
    console.error('Logout error:', err);
  }
};
