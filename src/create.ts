import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import fs from 'fs-extra';

export const createArgoCDHelmApplicationAction = () => {
    return createTemplateAction<{ contents: string; filename: string }>({
        id: 'argocd:create-helm-application',
        schema: {
            input: {
                type: 'object',
                required: ['name', 'chart'],
                properties: {
                    name: {
                        type: 'string',
                        title: 'Name',
                        description: 'The name of the Application',
                    },
                    chart: {
                        type: 'object',
                        required: ['repo', 'name', 'version'],
                        properties: {
                            repo: {
                                type: 'string',
                                title: 'Repository',
                                description: 'The repository address, i.e. ghcr.io/organization',
                            },
                            name: {
                                type: 'string',
                                title: 'Name',
                                description: 'The name of the chart, i.e. mychart',
                            },
                            version: {
                                type: 'string',
                                title: 'Version',
                                description: 'The version of the chart, i.e. 0.1.0',
                            },
                        }
                    },
                },
            },
        },
        async handler(ctx) {
            await fs.outputFile(
                `${ctx.workspacePath}/${ctx.input.filename}`,
                ctx.input.contents,
            );
        },
    });
};

// apiVersion: argoproj.io/v1alpha1
// kind: Application
// metadata:
//     name: muvaf-kubecon-testing
// spec:
//     destination:
//         name: ''
// namespace: muvaf-kubecon-testing
// server: 'https://kubernetes.default.svc'
// source:
//     path: ''
// repoURL: ghcr.io/muvaf
// targetRevision: 0.1.0
// chart: muvaf-kubecon-testing-chart
// project: default
// syncPolicy:
//     automated:
//         prune: false
// selfHeal: false
// syncOptions:
//     - CreateNamespace=true