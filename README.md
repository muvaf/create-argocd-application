# Create ArgoCD Application in Backstage

**IMPORTANT NOTE**: I have created a new custom action 
[`@muvaf/kubernetes-apply`](https://github.com/muvaf/kubernetes-apply)
that can deploy any Kubernetes manifest that you may consider using instead of
this one since it offers much more flexibility about what ArgoCD `Application`
manifest is applied.

This custom scaffolder action allows you to create ArgoCD `Application` as part
of your software template.

I wrote this for a [KubeCon talk](https://kccncna2022.sched.com/event/b0d8e5d397fe9a2e61ff0434524d3af2) without knowing much TypeScript. Be careful if
you decide to use it.

## Getting Started

Add to your Backstage app.
```bash
# From your Backstage root directory
yarn add --cwd packages/backend @muvaf/create-argocd-application
```
```bash
# To be able to keep using the built-in actions.
yarn add --cwd packages/backend @backstage/integration
```

**IMPORTANT NOTE**: This custom action uses `POD_NAMESPACE` environment variable
to determine the namespace of the ArgoCD `Application` resource. Make sure you
set it when you deploy your Backstage app. An example addition to your container
could be like the following:
```yaml
env:
  - name: POD_NAMESPACE
    valueFrom:
      fieldRef:
        fieldPath: metadata.namespace
```

Append it to your existing actions in `packages/backend/src/plugins/scaffolder.ts`
```typescript
import { CatalogClient } from '@backstage/catalog-client';
import { createRouter, createBuiltinActions } from '@backstage/plugin-scaffolder-backend';
import { ScmIntegrations } from '@backstage/integration';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { argocdCreateHelmApplication, githubWaitLastWorkflow } from "@muvaf/create-argocd-application";

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const catalogClient = new CatalogClient({ discoveryApi: env.discovery });
  const integrations = ScmIntegrations.fromConfig(env.config);

  const builtInActions = createBuiltinActions({
    integrations,
    catalogClient,
    config: env.config,
    reader: env.reader,
  });

  const actions = [
      ...builtInActions,
      argocdCreateHelmApplication(),
      githubWaitLastWorkflow({ integrations })
  ]

  return await createRouter({
    actions,
    catalogClient,
    logger: env.logger,
    config: env.config,
    database: env.database,
    reader: env.reader,
    identity: env.identity,
  });
}
```

Done! You can now use the action in your software templates.
```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: chart-with-argocd
  title: Chart with ArgoCD
spec:
  steps:
    - id: argocd-create
      name: Create ArgoCD Application
      action: argocd:create-helm-application
      input:
        name: ${{ parameters.serviceName }}
        chart:
          name: ${{ (parameters.repoUrl | parseRepoUrl).repo }}
          repo: ghcr.io/${{ (parameters.repoUrl | parseRepoUrl).owner }}
          version: 9.9.9
```