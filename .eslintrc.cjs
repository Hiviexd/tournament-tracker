module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react-hooks/recommended",
        "prettier",
    ],
    ignorePatterns: ["dist", ".eslintrc.cjs"],
    parser: "@typescript-eslint/parser",
    plugins: ["react-refresh"],
    rules: {
        "object-shorthand": "error",
        "require-await": "error",
        "no-trailing-spaces": "error",
        "key-spacing": "error",
        "keyword-spacing": "error",
        "space-before-blocks": "error",
        "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
        "@typescript-eslint/no-explicit-any": "off",
    },
    overrides: [
        {
            files: ["server/routers/*.ts"],
            rules: {
                "@typescript-eslint/ban-ts-comment": "off",
            },
        },
    ],
};
