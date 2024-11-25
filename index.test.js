jest.mock('fs', () => ({
    existsSync: jest.fn().mockReturnValue(true),
    readFileSync: jest.fn().mockReturnValue('mock schema'),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
}));

jest.mock('path', () => ({
    join: jest.fn().mockReturnValue('mock/path/to/schema.prisma'),
}));

jest.mock('@prisma/internals', () => ({
    getDMMF: jest.fn().mockResolvedValue({
        datamodel: {
            models: [
                {
                    name: 'User',
                    fields: [
                        {
                            name: 'id',
                            type: 'Int',
                            isRequired: true,
                            isUnique: true,
                            isId: true,
                            default: null,
                            updatedAt: false,
                            relation: null,
                        },
                        {
                            name: 'email',
                            type: 'String',
                            isRequired: true,
                            isUnique: true,
                            isId: false,
                            default: null,
                            updatedAt: false,
                            relation: null,
                        },
                    ],
                },
            ],
        },
    }),
}));

const { parsePrismaSchema, generateHtmlDocumentation, generateMarkdownDocumentation } = require('./index.js');

describe('Prisma Schema Documentation Generator', () => {
    it('should generate light theme HTML documentation correctly', async () => {
        const models = await parsePrismaSchema('mock/path/to/schema.prisma');
        const htmlContent = generateHtmlDocumentation(models, false);

        expect(htmlContent).toContain('<html>');
        expect(htmlContent).toContain('<title>Prisma Schema Documentation</title>');
        expect(htmlContent).toContain('User');
    });

    it('should generate dark theme HTML documentation correctly', async () => {
        const models = await parsePrismaSchema('mock/path/to/schema.prisma');
        const htmlContent = generateHtmlDocumentation(models, true);

        expect(htmlContent).toContain('<html>');
        expect(htmlContent).toContain('<title>Prisma Schema Documentation</title>');
        expect(htmlContent).toContain('User');
    });

    it('should generate Markdown documentation correctly', async () => {
        const models = await parsePrismaSchema('mock/path/to/schema.prisma');
        const markdownContent = generateMarkdownDocumentation(models);

        expect(markdownContent).toContain('# Prisma Schema Documentation');
        expect(markdownContent).toContain('## User');
        expect(markdownContent).toContain('| **Type**      | Int |');
        expect(markdownContent).toContain('### id');
        expect(markdownContent).toContain('| **Type**      | Int |');
        expect(markdownContent).toContain('| **Required**  | Yes |');
        expect(markdownContent).toContain('| **Attributes**| @id, @unique |');
        expect(markdownContent).toContain('### email');
        expect(markdownContent).toContain('| **Type**      | String |');
        expect(markdownContent).toContain('| **Required**  | Yes |');
        expect(markdownContent).toContain('| **Attributes**| @unique |');
    });
});
