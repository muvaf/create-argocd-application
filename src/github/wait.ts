import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { ScmIntegrationRegistry } from "@backstage/integration";
import { Octokit } from '@octokit/rest';

const timeout = 10 * 60 * 1000; // 10 minutes

export const githubWaitLastWorkflow  = (options: {
    integrations: ScmIntegrationRegistry;
}) => {
    const { integrations } = options;
    return createTemplateAction<{
        owner: string;
        repo: string;
        branch: string;
    }>({
        id: 'github:wait-last-workflow',
        schema: {
            input: {
                type: 'object',
                required: ['owner', 'repo', 'branch'],
                properties: {
                    owner: {
                        type: 'string',
                        title: 'Owner',
                        description: 'Organization or user name in Github.',
                    },
                    repo: {
                        type: 'string',
                        title: 'Repository Name',
                        description: 'The name of the repository, i.e. myrepo',
                    },
                    branch: {
                        type: 'string',
                        title: 'Branch Name',
                        description: 'The name of the branch whose last commit will be used',
                    }
                },
            },
        },
        async handler(ctx) {
            const token = integrations.github.byHost('github.com')!.config.token;
            const octokit = new Octokit({ auth: token });
            ctx.logger.info(`Querying the last commit on ${ctx.input.branch}`);
            const commits = await octokit.repos.listCommits({
                owner: ctx.input.owner,
                repo: ctx.input.repo,
                sha: ctx.input.branch
            })
            const start = Date.now();
            while (start + timeout > Date.now()) {
                ctx.logger.info(`Querying the status of the commit ${commits.data[0].sha}`);
                const state = await octokit.actions.listWorkflowRunsForRepo({
                    owner: ctx.input.owner,
                    repo: ctx.input.repo,
                    head_sha: commits.data[0].sha
                }).then(({ data }) => {
                    if (data.total_count === 0) {
                        return 'not started';
                    }
                    let pending = []
                    let success = 0
                    for (const run of data.workflow_runs) {
                        if (run.status === 'failure' || run.status === 'cancelled' || run.status === 'timed_out' || run.status === 'action_required') {
                            throw new Error(`Workflow run failed: ${run.id}: ${run.status}`);
                        }
                        pending.push(`${run.id}:${run.status}`)
                        if (run.conclusion === 'success') {
                            success++;
                        }
                    }
                    if (success === data.workflow_runs.length) {
                        return 'success';
                    }
                    ctx.logger.info(`Ongoing workflows: ${pending.join(', ')}`);
                    return 'pending';
                })
                if (state === 'success') {
                    break;
                }
                if (state === 'not started') {
                    ctx.logger.info(`Workflows not started yet...`);
                }
                ctx.logger.info(`Waiting for 5 seconds for workflow runs to finish...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            ctx.logger.info(`Workflows finished.`);
        },
    });
};