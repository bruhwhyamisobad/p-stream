import { fixupConfigRules } from '@eslint/compat';
import js from '@eslint/js';
import { configs as airbnbConfigs, plugins as airbnbPlugins } from 'eslint-config-airbnb-extended';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const a11yOff = Object.keys(jsxA11y.rules).reduce((acc, rule) => {
  acc[`jsx-a11y/${rule}`] = 'off';
  return acc;
}, {});

function mapImportRules(configs) {
  const list = (Array.isArray(configs) ? configs : [configs]).filter(Boolean);
  return list.map((cfg) => {
    if (!cfg.rules) return cfg;
    const mappedRules = Object.fromEntries(
      Object.entries(cfg.rules).map(([k, v]) => [k.replace(/^import-x\//, 'import/'), v]),
    );
    return { ...cfg, rules: mappedRules };
  });
}

export default tseslint.config(
  {
    ignores: [
      'public/**',
      'dist/**',
      '*.js',
      '*.mjs',
      '*.ts',
      '*.mts',
      'plugins/*.ts',
      'plugins/*.mjs',
      'themes/**/*.ts',
    ],
  },
  js.configs.recommended,
  ...fixupConfigRules([
    airbnbPlugins.stylistic,
    airbnbPlugins.react,
    airbnbPlugins.reactHooks,
    airbnbPlugins.reactA11y,
    {
      plugins: {
        import: airbnbPlugins.importX.plugins['import-x'],
      },
    },
    ...mapImportRules(airbnbConfigs.base.recommended),
    ...mapImportRules(airbnbConfigs.react.recommended),
  ]),
  ...tseslint.configs.recommended,
  prettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: '19.3',
      },
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: './tsconfig.json',
        }),
      ],
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'preserve-caught-error': 'off',
      'no-useless-assignment': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'import/no-useless-path-segments': 'off',
      '@stylistic/lines-between-class-members': 'off',
      '@stylistic/spaced-comment': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/gating': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/component-hook-factories': 'off',
      'react-hooks/config': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/require-default-props': 'off',
      'react/destructuring-assignment': 'off',
      'no-underscore-dangle': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'debug', 'info'] }],
      '@typescript-eslint/no-this-alias': 'off',
      'import/prefer-default-export': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': ['error'],
      'no-restricted-syntax': 'off',
      'react/jsx-props-no-spreading': 'off',
      'consistent-return': 'off',
      'no-continue': 'off',
      'no-eval': 'off',
      'no-await-in-loop': 'off',
      'no-nested-ternary': 'off',
      'prefer-destructuring': 'off',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
      'no-empty': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react/jsx-filename-extension': [
        'error',
        { extensions: ['.js', '.tsx', '.jsx'] },
      ],
      'prettier/prettier': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      'prefer-template': 'off',
      'react/no-array-index-key': 'off',
      'spaced-comment': 'off',
      'react/no-unescaped-entities': 'off',
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
      'react/no-restricted-globals': 'off',
      'react/no-unused-prop-types': 'off',
      'unicode-bom': 'off',
      'no-restricted-globals': 'off',
      'linebreak-style': 'off',
      'eol-last': 'off',
      'no-trailing-spaces': 'off',
      indent: 'off',
      quotes: 'off',
      semi: 'off',
      'comma-dangle': 'off',
      'max-len': 'off',
      'arrow-body-style': 'off',
      'padded-blocks': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'object-curly-newline': 'off',
      'operator-linebreak': 'off',
      'no-useless-return': 'off',
      'implicit-arrow-linebreak': 'off',
      'function-paren-newline': 'off',
      'no-multiple-empty-lines': 'off',
      'no-multi-spaces': 'off',
      'no-unstable-nested-components': 'off',
      'react/no-unstable-nested-components': 'off',
      'no-return-await': 'off',
      'lines-between-class-members': 'off',
      'comma-spacing': 'off',
      'key-spacing': 'off',
      'keyword-spacing': 'off',
      'space-before-blocks': 'off',
      'space-before-function-paren': 'off',
      'space-in-parens': 'off',
      'space-infix-ops': 'off',
      'no-mixed-spaces-and-tabs': 'off',
      'prefer-const': 'off',
      'no-tabs': 'off',
      'no-void': 'off',
      'no-use-before-define': 'off',
      'no-bitwise': 'off',
      ...a11yOff,
    },
  },
);