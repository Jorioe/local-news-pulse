export const createUniqueId = (input: string): string => {
  // Create a hash from the input string
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert the hash to a base36 string and ensure it's positive
  return Math.abs(hash).toString(36);
}; 