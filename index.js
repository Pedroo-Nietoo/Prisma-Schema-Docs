#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { getDMMF } = require('@prisma/internals');

const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');

async function main() {
    try {
        console.log(`Looking for schema at: ${schemaPath}`);
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at ${schemaPath}. Please ensure the path is correct.`);
        }

        const models = await parsePrismaSchema(schemaPath);
        const htmlContent = generateHtmlDocumentation(models);
        const docsDir = path.join(process.cwd(), 'docs');

        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir);
            console.log("Docs directory created.");
        }

        fs.writeFileSync(path.join(docsDir, 'index.html'), htmlContent, 'utf-8');
        console.log("Documentation generated! Check 'docs/index.html'");
    } catch (error) {
        console.error("Error generating documentation:", error.message);
    }
}

async function parsePrismaSchema(filePath) {
    try {
        const schema = fs.readFileSync(filePath, 'utf-8');
        const dmmf = await getDMMF({ datamodel: schema });

        if (!dmmf || !dmmf.datamodel || !Array.isArray(dmmf.datamodel.models)) {
            throw new Error("Invalid DMMF structure. Please check your schema.prisma for correctness.");
        }

        return dmmf.datamodel.models.map((model) => ({
            name: model.name,
            fields: model.fields.map((field) => ({
                name: field.name,
                type: field.type,
                isRequired: field.isRequired,
                isUnique: field.isUnique,
                isId: field.isId,
                default: field.default ? field.default.name || field.default : null,
                updatedAt: field.hasDefaultValue && field.default === 'updatedAt',
                relation: field.relationName ? `@relation(${field.type})` : null,
            })),
        }));
    } catch (error) {
        throw new Error(`Error reading or parsing schema.prisma: ${error.message}`);
    }
}

function generateHtmlDocumentation(models) {
    let htmlContent = `
    <html>
    <head>
        <title>Prisma Schema Documentation</title>
        <style>
            body { font-family: Arial, sans-serif; display: flex; color: #333; margin: 0 }
            .sidebar { width: 250px; padding: 20px; background-color: #f0f0f0; position: fixed; height: 100vh; overflow-y: auto; }
            .content { margin-left: 270px; padding: 50px; flex-grow: 1; background-color: #fff; }
            .model { margin-bottom: 40px; }
            .model-name { font-size: 24px; font-weight: bold; color: #2e5972; }
            .table-container { margin-top: 10px; padding: 10px; border-radius: 5px; }
            table { width: 100%; color: #333; border-collapse: collapse; }
            th, td { padding: 8px 12px; text-align: left; border: 1px solid #ccc; }
            th { background-color: #2e5972; color: #fff; }
            .required { color: #D53F8C; font-weight: bold; }
            .optional { color: #718096; }
            .attribute { color: #2B6CB0; font-weight: bold; }
            .relation { color: #6B46C1; font-style: italic; text-decoration-style: wavy; }
            .button {
                padding: 10px;
                margin: 18px;
                background-color: transparent;
                color: #2e5972;
                border: 1px solid #2e5972;
                border-radius: 10px;
                cursor: pointer;
                font-size: 16px;
                transition: 0.3s;
            }
            .button:hover {
                background-color: #2e5972;
                color: #fff;
            }
            .model-link, .field-link {
                color: #333;
                text-decoration: none; 
                font-weight: bold; 
                display: block; 
                margin-bottom: 8px; 
            }
            .model-fields {
                border-left: 2px solid #ccc;
                padding-left: 10px;
                margin-bottom: 20px;
            }
            .field-link { 
                padding: 4px 0;
                color: #6c757d;
            }
            .field-link:hover, .model-link:hover {
                color: #2e5972;
            }
            .model-spacing {
                margin-bottom: 150px;
            }
        </style>
    </head>
    <body>
    <div class="sidebar">
        <img src="https://avatars.githubusercontent.com/u/17219288?s=200&v=4"
            alt="Prisma Logo"
            style="width: 50px; margin-bottom: 20px; border-radius: 16px">
        <h2>Schema Models</h2>`;
    models.forEach(model => {
        htmlContent += `
            <a href="#${model.name}" class="model-link">${model.name}</a>
            <div class="model-fields">
                ${model.fields.map(field => `<a href="#${model.name}-${field.name}" class="field-link">${field.name}</a>`).join('')}
            </div>`;
    });
    htmlContent += `
        </div>
        <div class="content">
            <div style="display: flex; justify-content: space-between;">
                <h1>Prisma Schema Documentation</h1>
                <button class="button" onclick="exportMarkdown()">Export as Markdown</button>
            </div>`;
    models.forEach(model => {
        htmlContent += `
        <div class="model model-spacing" id="${model.name}">
            <div class="model-name">${model.name}</div>`;
        
        model.fields.forEach(field => {
            const attributes = [];
            if (field.isId) attributes.push('@id');
            if (field.isUnique) attributes.push('@unique');
            if (field.default) attributes.push(`@default(${field.default})`);
            if (field.updatedAt) attributes.push('@updatedAt');
            if (field.relation) attributes.push(`@relation(${field.type})`);
            htmlContent += `
            <div class="table-container" id="${model.name}-${field.name}">
                <h2>${field.name}</h2>
                <p><strong>Description:</strong> The '${field.name}' field from the ${model.name} model</p>
                <table>
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Type</strong></td>
                            <td>${field.type}</td>
                        </tr>
                        <tr>
                            <td><strong>Required</strong></td>
                            <td><span class="${field.isRequired ? 'required' : 'optional'}">${field.isRequired ? 'Yes' : 'No'}</span></td>
                        </tr>
                        <tr>
                            <td><strong>Attributes</strong></td>
                            <td>${attributes.map(attr => attr.includes('@relation') ? `<a href="#${field.type}" class="relation">${attr}</a>` : `<span class="attribute">${attr}</span>`).join(', ') || '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>`;
        });
        htmlContent += `
        </div>`;
    });
    htmlContent += `
        </div>
    </body>
    <script>
        function generateMarkdownDocumentation(models) {
            let markdownContent = '# Prisma Schema Documentation\\n\\n';
            models.forEach(model => {
                markdownContent += '## ' + model.name + '\\n\\n';
                model.fields.forEach(field => {
                    const attributes = [];
                    if (field.isId) attributes.push('@id');
                    if (field.isUnique) attributes.push('@unique');
                    if (field.default) attributes.push('@default(' + field.default + ')');
                    if (field.updatedAt) attributes.push('@updatedAt');
                    if (field.relation) attributes.push('@relation(' + field.type + ')');
                    markdownContent += '### ' + field.name + '\\n';
                    markdownContent += '**Description**: The \' + field.name + \' field from the ' + model.name + ' model\\n\\n';
                    markdownContent += '| Parameter     | Value        |\\n';
                    markdownContent += '|---------------|--------------|\\n';
                    markdownContent += '| **Type**      | ' + field.type + ' |\\n';
                    markdownContent += '| **Required**  | ' + (field.isRequired ? 'Yes' : 'No') + ' |\\n';
                    markdownContent += '| **Attributes**| ' + (attributes.join(', ') || '-') + ' |\\n\\n';
                });
                markdownContent += '\\n';
            });
            return markdownContent;
        }
        function downloadMarkdown(content) {
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'prisma_schema_documentation.md';
            a.click();
            URL.revokeObjectURL(url);
        }
        function exportMarkdown() {
            const markdown = generateMarkdownDocumentation(${JSON.stringify(models)});
            downloadMarkdown(markdown);
        }
    </script>
    </html>`;
    return htmlContent;
}

function generateMarkdownDocumentation(models) {
    let markdownContent = '# Prisma Schema Documentation\\n\\n';
    models.forEach(model => {
        markdownContent += '## ' + model.name + '\\n\\n';
        model.fields.forEach(field => {
            const attributes = [];
            if (field.isId) attributes.push('@id');
            if (field.isUnique) attributes.push('@unique');
            if (field.default) attributes.push('@default(' + field.default + ')');
            if (field.updatedAt) attributes.push('@updatedAt');
            if (field.relation) attributes.push('@relation(' + field.type + ')');

            markdownContent += '### ' + field.name + '\\n';
            markdownContent += '**Description**: The \' + field.name + \' field from the ' + model.name + ' model\\n\\n';
            markdownContent += '| Parameter     | Value        |\\n';
            markdownContent += '|---------------|--------------|\\n';
            markdownContent += '| **Type**      | ' + field.type + ' |\\n';
            markdownContent += '| **Required**  | ' + (field.isRequired ? 'Yes' : 'No') + ' |\\n';
            markdownContent += '| **Attributes**| ' + (attributes.join(', ') || '-') + ' |\\n\\n';
        });
        markdownContent += '\\n';
    });
    return markdownContent;
}

main();

module.exports = { parsePrismaSchema, generateHtmlDocumentation, generateMarkdownDocumentation };