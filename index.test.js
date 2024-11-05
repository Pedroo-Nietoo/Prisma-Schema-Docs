const fs = require('fs');
const path = require('path');
const { parsePrismaSchema, generateHtmlDocumentation } = require('./index');

jest.mock('fs');
jest.mock('@prisma/internals', () => ({
    getDMMF: jest.fn(),
}));

describe('parsePrismaSchema', () => {
    beforeAll(() => {
        require('@prisma/internals').getDMMF.mockResolvedValue({
            datamodel: {
                models: [
                    {
                        name: 'User',
                        fields: [
                            { name: 'id', type: 'Int', isRequired: true, isUnique: false, isId: true, default: { name: 'autoincrement' }, hasDefaultValue: true },
                            { name: 'name', type: 'String', isRequired: true, isUnique: true, isId: false, default: null, hasDefaultValue: false },
                            { name: 'email', type: 'String', isRequired: true, isUnique: true, isId: false, default: null, hasDefaultValue: false },
                            { name: 'posts', type: 'Post', isRequired: false, isUnique: false, isId: false, default: null, hasDefaultValue: false, relationName: 'Post' }
                        ],
                    },
                ],
            },
        });
    });

    it('should parse the Prisma schema and return models with fields', async () => {
        const schema = `
            model User {
                id    Int     @id @default(autoincrement())
                name  String  @unique
                email String  @unique
                posts Post[]
            }
        `;
        fs.readFileSync.mockReturnValue(schema);

        const models = await parsePrismaSchema('prisma/schema.prisma');
        expect(models).toEqual([
            {
                name: 'User',
                fields: [
                    { name: 'id', type: 'Int', isRequired: true, isUnique: false, isId: true, default: 'autoincrement', updatedAt: false, relation: null },
                    { name: 'name', type: 'String', isRequired: true, isUnique: true, isId: false, default: null, updatedAt: false, relation: null },
                    { name: 'email', type: 'String', isRequired: true, isUnique: true, isId: false, default: null, updatedAt: false, relation: null },
                    { name: 'posts', type: 'Post', isRequired: false, isUnique: false, isId: false, default: null, updatedAt: false, relation: '@relation(Post)' },
                ],
            },
        ]);
    });
});

describe('generateHtmlDocumentation', () => {
    it('should generate HTML documentation for the given models', () => {
        const models = [
            {
                name: 'User',
                fields: [
                    { name: 'id', type: 'Int', isRequired: true, isUnique: false, isId: true, default: 'autoincrement', updatedAt: false, relation: null },
                    { name: 'name', type: 'String', isRequired: true, isUnique: true, isId: false, default: null, updatedAt: false, relation: null },
                    { name: 'email', type: 'String', isRequired: true, isUnique: true, isId: false, default: null, updatedAt: false, relation: null },
                    { name: 'posts', type: 'Post', isRequired: false, isUnique: false, isId: false, default: null, updatedAt: false, relation: '@relation(Post)' },
                ],
            },
        ];

        const htmlContent = generateHtmlDocumentation(models);
        expect(htmlContent).toContain('<div class="model-name">User</div>');
        expect(htmlContent).toContain('<td>id</td>');
    });
});
