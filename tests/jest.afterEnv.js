// Runs after the test framework is installed (jest globals available)
jest.setTimeout(120000);

// Keep test output readable
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});


