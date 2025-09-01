const bcrypt = require('bcryptjs');

(async () => {
  const plain = "Sanjay14@";

  // Generate a new hash for testing
  const newHash = await bcrypt.hash(plain, 12);
  console.log("Generated hash:", newHash);

  // Verify against your stored hash
  const isMatch = await bcrypt.compare(plain, "$2a$12$zfCngeBaz8UwRRqcdD2AperK91Ds4o0Wk.telD7twhGWY0PqJG4md");
  console.log("Matches stored hash?", isMatch);
})();
