module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.js',
    '^firebase/firestore$': '<rootDir>/__mocks__/firestore.js',
    '^firebase/auth$': '<rootDir>/__mocks__/firebase-auth.js',
    '^\\.\\./firebase$': '<rootDir>/__mocks__/firebase.js',
    '^\\./firebase$': '<rootDir>/__mocks__/firebase.js',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};
