import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import {KubeConfig, CustomObjectsApi} from '@kubernetes/client-node';
import YAML from 'yaml';

const tmpl = `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: to-be-changed
spec:
  destination:
    namespace: to-be-changed
    server: https://kubernetes.default.svc
  project: default
  source:
    chart: to-be-changed
    repoURL: to-be-changed
    targetRevision: to-be-changed
  syncPolicy:
    automated:
      selfHeal: true
    syncOptions:
      - CreateNamespace=true`;

export const argocdCreateHelmApplication = () => {
    return createTemplateAction<{
        name: string;
        namespace: string;
        chart: {
            name: string;
            repo: string;
            version: string;
        };
    }>({
        id: 'argocd:argocd-helm-application',
        schema: {
            input: {
                type: 'object',
                required: ['name', 'namespace', 'chart'],
                properties: {
                    name: {
                        type: 'string',
                        title: 'Name',
                        description: 'The name of the Application',
                    },
                    namespace: {
                        type: 'string',
                        title: 'Namespace',
                        description: 'The namespace of the Application',
                    },
                    chart: {
                        type: 'object',
                        required: ['repo', 'name', 'version'],
                        description: 'Details of the Helm chart to be used',
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
            const kc = new KubeConfig();
            kc.loadFromDefault();
            const client = kc.makeApiClient(CustomObjectsApi);
            const obj = YAML.parse(tmpl);
            obj.metadata.name = ctx.input.name;
            if (process.env.POD_NAMESPACE === undefined) {
                throw new Error('POD_NAMESPACE is not set');
            }
            obj.metadata.namespace = process.env.POD_NAMESPACE;
            obj.spec.destination.namespace = ctx.input.name
            obj.spec.source.chart = ctx.input.chart.name;
            obj.spec.source.repoURL = ctx.input.chart.repo;
            obj.spec.source.targetRevision = ctx.input.chart.version;

            // Server-side apply.
            await client.patchNamespacedCustomObject(
                'argoproj.io',
                'v1alpha1',
                obj.metadata.namespace,
                'applications',
                obj.metadata.name,
                obj,
                undefined,
                'backstage',
                true,
                { headers: { 'Content-Type': 'application/apply-patch+yaml' } }
            ).then(
                (resp) => {
                    ctx.logger.info(
                        `Successfully created ${obj.metadata.namespace}/${obj.metadata.name} Application: HTTP ${resp.response.statusCode}`
                    );
                },
                (err) => {
                    ctx.logger.error(
                        `Failed to make PATCH call for ${obj.metadata.namespace}/${obj.metadata.name} Application: Body ${JSON.stringify(err.body, null, 2)} Response ${JSON.stringify(err.response, null, 2)}.`
                    );
                    throw err;
                }
            )
        },
    });
};