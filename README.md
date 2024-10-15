# Profile Page Project

## Objectives

The objective of this project is to create a profile page using GraphQL to fetch and display personal data from the provided endpoint. You will learn to utilize GraphQL queries effectively to populate your profile page with relevant information such as user identification, XP amount, grades, audits, and skills. Additionally, the project focuses on creating interactive SVG-based statistical graphs to visualize various metrics related to your journey and achievements at school.

## Instructions

### Login Page

To access your profile data, you need to authenticate via a login page. The JWT (JSON Web Token) required for authentication can be obtained from the signin endpoint ([https://learn.reboot01.com/api/auth/signin](https://learn.reboot01.com/api/auth/signin)). You can authenticate using either username:password or email:password. Invalid credentials should display an appropriate error message. Logging out should clear the JWT from local storage.

### Profile UI

Your profile UI should include:

- Basic user identification
- XP amount
- Grades
- Audits
- Skills
- Statistical Graphs (SVG-based, at least two different types)
  
### GraphQL Queries

Utilize GraphQL queries to fetch data from the endpoint ([https://learn.reboot01.com/api/graphql-engine/v1/graphql](https://learn.reboot01.com/api/graphql-engine/v1/graphql)). Examples of possible queries include:

```graphql
{
  user {
    id
    login
  }
}

{
  user {
    id
    login
    xp
    grades
    audits
    skills
  }
}
