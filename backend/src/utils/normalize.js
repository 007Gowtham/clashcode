export const normalizeInput = (input) => {
  if (!input) return '';

  // Handle multiple assignments like "nums = [2,7], target = 9"
  // This logic tries to extract all values regardless of the key name.
  // We look for patterns like key = [array] or key = "string" or key = number
  const results = [];
  
  // Clean up initial "Input: " prefix if present
  let cleaned = input.replace(/^Input:\s*/i, '').trim();

  // Helper to process a single value string
  const processValue = (val) => {
    val = val.trim();
    // Handle Arrays
    if (val.startsWith('[') && val.endsWith(']')) {
      try {
        const arr = JSON.parse(val.replace(/'/g, '"'));
        if (Array.isArray(arr)) {
          results.push(arr.length.toString());
          results.push(arr.join(' '));
          return;
        }
      } catch (e) {
        // Fallback for non-JSON arrays (e.g. [1 2 3])
        const elements = val.slice(1, -1).split(/[,\s]+/).filter(x => x.length > 0);
        results.push(elements.length.toString());
        results.push(elements.join(' '));
        return;
      }
    }
    // Handle Quoted Strings
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      results.push(val.slice(1, -1));
      return;
    }
    // Handle basic values (numbers, booleans, words)
    results.push(val);
  };

  // If there are '=' signs, split by assignments. 
  // We use a regex that finds key = value, being careful with commas inside arrays.
  const assignments = cleaned.split(/,(?![^\[]*\])/); // Split by comma not inside brackets
  
  if (assignments.length > 1 || cleaned.includes('=')) {
    assignments.forEach(asgn => {
      const parts = asgn.split('=');
      const val = parts.length > 1 ? parts[1] : parts[0];
      processValue(val);
    });
  } else {
    processValue(cleaned);
  }

  return results.join('\n') + '\n';
};
