import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Run test files serially — mongodb-memory-server binary lock collides otherwise.
    // Run test files serially but in separate workers — mongodb-memory-server
    // lockfile collides under concurrency, and Mongoose model registration
    // breaks if workers are shared.
    fileParallelism: false,
  },
})
