// passport.ts
import passport from "passport";
import googleStrategy from "./google";

// initialize passport with Google and JWT strategies
passport.use("google", googleStrategy);

export default passport;
