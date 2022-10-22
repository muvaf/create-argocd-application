import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import fs from 'fs-extra';

export const createNewFileAction = () => {
    return createTemplateAction<{ contents: string; filename: string }>({
        id: 'mycompany:create-file',
        schema: {
            input: {
                required: ['contents', 'filename'],
                type: 'object',
                properties: {
                    contents: {
                        type: 'string',
                        title: 'Contents',
                        description: 'The contents of the file',
                    },
                    filename: {
                        type: 'string',
                        title: 'Filename',
                        description: 'The filename of the file that will be created',
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