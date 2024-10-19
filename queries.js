// Exporting GraphQL queries
export const fetchUserIdQuery = `
  {
    user {
      id
    }
  }
`;

export const fetchUserDetailsQuery = (userId) => `
  {
    user(where: { id: { _eq: "${userId}" } }) {
      login
      campus
      email
      firstName
      lastName
      attrs
    }
  }
`;

export const fetchCurrentProjectQuery = `
  {
    progress(
      where: { isDone: { _eq: false }, object: { type: { _eq: "project" } } }
      limit: 1
    ) {
      object {
        name
      }
    }
  }
`;

export const fetchAuditDetailsQuery = (userId) => `
  {
    user(where: { id: { _eq: "${userId}" } }) {
      auditRatio
      totalUp
      totalDown
    }
  }
`;

export const fetchExperienceQuery = (userId) => `
  query Transaction_aggregate {
    transaction_aggregate(
      where: {
        event: { path: { _eq: "/bahrain/bh-module" } }
        type: { _eq: "xp" }
        userId: { _eq: "${userId}" }
      }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
  }
`;

export const fetchSkillsQuery = `
  {
    user {
      transactions(where: {
          type: {_ilike: "%skill%"}
        }
      ) {
        type
        amount
      }
    }
  }
`;

export const fetchRecentProjectsQuery = `
{
    transaction(
      where: {
        type: { _eq: "xp" }
        _and: [
          { path: { _like: "/bahrain/bh-module%" } },
          { path: { _nlike: "/bahrain/bh-module/checkpoint%" } },
          { path: { _nlike: "/bahrain/bh-module/piscine-js%" } }
        ]
      }
      order_by: { createdAt: desc }
      limit: 4
    ) {
      object {
        type
        name
      }
    }
  }
`;