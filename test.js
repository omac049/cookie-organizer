// Add this code to simulate a minimal browser environment
global.window = global;
global.chrome = { 
  storage: { 
    local: { 
      get: (a, b) => b({}) 
    },
    sync: {
      get: (a, b) => b({})
    }
  } 
};
global.document = { 
  addEventListener: () => {}, 
  querySelectorAll: () => [],
  getElementById: () => null
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

try {
  require('./popup.js');
  console.log('Successfully loaded popup.js without errors');
} catch (e) {
  console.error('Error loading popup.js:', e.message);
  console.error('At line:', e.stack.split('\n')[1]);
} 