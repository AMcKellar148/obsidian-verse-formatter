module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        // Mock non-JS modules if any (like CSS)
        '\\.(css|less)$': '<rootDir>/tests/__mocks__/styleMock.js',
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
            diagnostics: {
                ignoreCodes: [151001]
            }
        }],
    },
};
