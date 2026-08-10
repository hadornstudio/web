// Must be the first import in any entry point (server.js, seed.js). ESM evaluates
// a module's entire import tree before running that module's own top-level code, so
// `import dotenv from 'dotenv'; dotenv.config();` placed directly in server.js would
// still run AFTER transitively-imported modules (e.g. config/stripe.js) had already
// read process.env at their own top level. Isolating the dotenv side effect in a
// leaf module with no imports of its own, and importing it first, forces it to run
// before anything else in the tree.
import dotenv from 'dotenv';
dotenv.config();
