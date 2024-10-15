import { 
  fetchUserIdQuery, 
  fetchUserDetailsQuery, 
  fetchCurrentProjectQuery, 
  fetchAuditDetailsQuery, 
  fetchExperienceQuery, 
  fetchSkillsQuery, 
  fetchRecentProjectsQuery 
} from './queries.js';

const endpoint = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';
const token = localStorage.getItem('jwt');

// Function to get data from a GraphQL API
const getData = async (query) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  return response.json();
};

// Function to capitalize the first letter of a string
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Main execution function
const initialize = async () => {
  try {
    // Get user ID
    const userIdResponse = await getData(fetchUserIdQuery);
    const userId = userIdResponse.data.user[0].id;

    // Retrieve user details
    const userDetailsResponse = await getData(fetchUserDetailsQuery(userId));
    const userDetails = userDetailsResponse.data.user[0];

    // Capitalize campus name
    userDetails.campus = capitalize(userDetails.campus);

    // Prepare user info items
    const userInfoList = [
      `Campus: ${userDetails.campus}`,
      `Campus ID: ${userDetails.login}`,
      `Email: ${userDetails.email}`,
      `First Name: ${userDetails.firstName}`,
      `Last Name: ${userDetails.lastName}`
    ];

    // Update DOM with user information
    const userInfoContainer = document.getElementById('user-info-list');
    userInfoList.forEach(info => {
      const listElement = document.createElement('li');
      listElement.textContent = info;
      userInfoContainer.appendChild(listElement);
    });

    // Update welcome message
    const fullName = `${userDetails.firstName} ${userDetails.lastName}`;
    document.getElementById('welcome-message').textContent = `Welcome to your dashboard, ${fullName}`;

    // Fetch and display current project
    const currentProjectResponse = await getData(fetchCurrentProjectQuery);
    const currentProjectName = currentProjectResponse.data.progress[0]?.object.name || 'No current project';
    document.getElementById('project-name').textContent = currentProjectName;

    // Retrieve last four projects
    const recentProjectsResponse = await getData(fetchRecentProjectsQuery);
    const recentProjects = recentProjectsResponse.data.transaction.map(item => `${item.object.type} — ${item.object.name}`);
    const recentProjectsContainer = document.getElementById('last-activity-list');
    recentProjectsContainer.innerHTML = ''; // Clear existing items
    recentProjects.forEach(project => {
      const projectElement = document.createElement('li');
      projectElement.textContent = project;
      recentProjectsContainer.appendChild(projectElement);
    });

    // Function to update audit progress bars
    async function refreshProgressBars() {
      const auditResponse = await getData(fetchAuditDetailsQuery(userId));
      const auditInfo = auditResponse.data.user[0];

      // Format audit ratio
      const formattedAuditRatio = auditInfo.auditRatio.toFixed(1);

      // Helper function to format sizes
      const formatSize = (size) => {
        const mbThreshold = 1000 * 1000;
        const kbThreshold = 1000;

        if (size >= mbThreshold) {
          return `${(size / mbThreshold).toFixed(2)} MB`;
        } else if (size >= kbThreshold) {
          return `${Math.ceil(size / kbThreshold)} kB`;
        } else {
          return `${size} bytes`;
        }
      };

      const totalDownFormatted = formatSize(auditInfo.totalDown);
      const totalUpFormatted = formatSize(auditInfo.totalUp);

      const maxValue = Math.max(auditInfo.totalDown, auditInfo.totalUp);
      const downPercentage = (auditInfo.totalDown / maxValue) * 100;
      const upPercentage = (auditInfo.totalUp / maxValue) * 100;

      // Color determination
      const upColor = auditInfo.totalUp >= auditInfo.totalDown ? '#28a745' : '#dc3545';
      const downColor = auditInfo.totalDown >= auditInfo.totalUp ? '#17a2b8' : '#ffc107';

      // Create or update progress bars
      createProgressBar('#total-audits-done-progress', upPercentage, upColor);
      createProgressBar('#total-audits-received-progress', downPercentage, downColor);

      // Update displayed text
      document.getElementById('total-audits-done-text').textContent = totalUpFormatted;
      document.getElementById('total-audits-received-text').textContent = totalDownFormatted;
      document.getElementById('audit-ratio-text').textContent = formattedAuditRatio;
    }

    refreshProgressBars();
    window.addEventListener('resize', refreshProgressBars);

    // Fetch user experience points
    const experienceResponse = await getData(fetchExperienceQuery(userId));
    const experiencePoints = experienceResponse.data.transaction_aggregate.aggregate.sum.amount || 0;

    // Format experience points for display
    const experienceText = experiencePoints >= 999900 
      ? `${(experiencePoints / 1000000).toFixed(2)} MB`
      : `${Math.floor(experiencePoints / 1000)} kB`;
      
    document.getElementById('xp-value').textContent = experienceText;

    // Function to format skill names
    const formatSkill = (skill) => skill.replace('skill_', '').replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

    // Function to draw radar charts
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

      // Add title
      group.append('text')
           .attr('x', 0)
           .attr('y', -radius - 60)
           .attr('text-anchor', 'middle')
           .attr('font-size', '16px')
           .attr('font-weight', 'bold')
           .text(title);

      // Draw axes and radar shapes
      for (let i = 0; i < 5; i++) {
        group.append('circle')
             .attr('r', radius / 5 * (i + 1))
             .attr('fill', '#CDCDCD')
             .attr('fill-opacity', 0.1);
      }

      const radarLine = d3.lineRadial()
        .radius(d => scale(d))
        .angle((d, i) => i * angleSlice);

      group.append('path')
           .datum(data)
           .attr('d', radarLine)
           .attr('fill', 'rgba(54, 162, 235, 0.2)')
           .attr('stroke', 'rgba(54, 162, 235, 1)');

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
        .text(d => d);
    }

    // Function to create/update progress bars
    function renderProgressBar(selector, percentage, color) {
      const svg = d3.select(selector);
      const width = svg.node().getBoundingClientRect().width;
      const height = 20;

      svg.attr('width', width).attr('height', height).selectAll('*').remove();
      svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#e0e0e0'); // Background
      svg.append('rect').attr('width', (percentage / 100) * width).attr('height', height).attr('fill', color); // Foreground
    }

    // Fetch and display user skills
    const skillsResponse = await getData(fetchSkillsQuery);
    const userSkills = skillsResponse.data.user[0]?.transactions || [];

    const skillData = userSkills.reduce((acc, skill) => {
      acc[skill.type] = (acc[skill.type] || 0) + skill.amount;
      return acc;
    }, {});

    const skillLabels = Object.keys(skillData).map(formatSkill);
    const skillValues = Object.values(skillData);

    // Create radar charts
    renderRadarChart(skillValues, skillLabels, '#technical-skills-chart', 'Technical Skills');

    // Update DOM on load
    document.addEventListener('DOMContentLoaded', () => {
      renderProgressBar('#progress-bar-selector', 75, '#4caf50');
      renderRadarChart(skillValues, skillLabels, '#technical-skills-chart');
    });

    // Handle window resizing
    window.addEventListener('resize', () => {
      renderProgressBar('#progress-bar-selector', 75, '#4caf50');
      renderRadarChart(skillValues, skillLabels, '#technical-skills-chart');
    });

    // Prevent back navigation
    history.replaceState(null, null, window.location.href); // Replace current history entry
    window.addEventListener('popstate', function(event) {
      history.pushState(null, null, window.location.href); // Push the same state to prevent going back
    });

    // Logout functionality
    document.getElementById('logout-button').addEventListener('click', async () => {
      try {
        await fetch('https://learn.reboot01.com/api/auth/expire', { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
        await fetch('https://learn.reboot01.com/api/auth/signout', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
        localStorage.removeItem('jwt');
        window.location.href = 'login.html';
      } catch (err) {
        console.error('Logout error:', err);
      }
    });
  } catch (err) {
    console.error('Initialization error:', err);
  }
};

// Authentication check
function verifyAuth() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    window.location.href = 'index.html';
  }
}

// Run the authentication check and initialize
verifyAuth();
initialize();
