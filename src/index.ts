import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import {KubeConfig, CustomObjectsApi} from '@kubernetes/client-node';
import * as fs from 'fs';
import YAML from 'yaml';

export type Input = {
    name: string;
    namespace: string;
    chart: {
        name: string;
        repo: string;
        version: string;
    };
}

export const createArgoCDHelmApplicationAction = () => {
    return createTemplateAction<Input>({
        id: 'argocd:create-helm-application',
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
            const data = fs.readFileSync('../template-application.yaml', 'utf8');
            const obj = YAML.parse(data);
            obj.metadata.name = ctx.input.name;
            obj.spec.destination.namespace = ctx.input.name
            obj.spec.source.chart = ctx.input.chart.name;
            obj.spec.source.repoURL = ctx.input.chart.repo;
            obj.spec.source.targetRevision = ctx.input.chart.version;

            // Server-side apply.
            await client.patchClusterCustomObject(
                'argoproj.io',
                'v1alpha1',
                'applications',
                obj.metadata.name,
                obj,
                '',
                'backstage',
                true,
                { headers: { 'Content-Type': 'application/apply-patch+yaml' } }
            )
        },
    });
};
