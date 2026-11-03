import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '.local/**', 'playwright-report/**'] },
  ...tseslint.configs.recommended,
);
