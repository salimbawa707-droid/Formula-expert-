
const { PHEngine, runValidationTests } = require('./src/utils/pHEngine.js');
console.log('Testing PHEngine...');
const results = runValidationTests();
console.log('Results:', results);
