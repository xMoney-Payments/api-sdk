const eslint = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const prettier = require('eslint-config-prettier');

module.exports = [
    eslint.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
            },
            globals: {
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                Buffer: 'readonly',
                process: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": ["error", {
                "varsIgnorePattern": "^[A-Z]",
                "argsIgnorePattern": "^_",
                'vars': 'all',
                'args': 'after-used',
                'ignoreRestSiblings': true,
            }],
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/ban-types": "off",
            "@typescript-eslint/no-var-requires": "off",
            "@typescript-eslint/no-inferrable-types": "off",
            "require-await": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "max-len": "off",
            "semi": "off",
            "comma-dangle": "off",
            "eol-last": "off",
            "no-undef": "off", // TypeScript handles this
            "no-unused-vars": "off", // Let @typescript-eslint/no-unused-vars handle this
        },
    },
    {
        files: ['**/*.enum.ts'],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "no-unused-vars": "off",
        },
    },
    prettier,
]; 