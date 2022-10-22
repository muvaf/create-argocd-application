# Create ArgoCD Application in Backstage

This custom scaffolder action allows you to create ArgoCD `Application` as part
of your software template.

I wrote this for a [KubeCon talk](https://kccncna2022.sched.com/event/b0d8e5d397fe9a2e61ff0434524d3af2) without knowing much TypeScript. Be careful if
you decide to use it.

## Getting Started

Add to your Backstage app.
```bash
# From your Backstage root directory
yarn add --cwd packages/backend create-argo-application
```