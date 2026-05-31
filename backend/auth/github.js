const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user', 'repo', 'read:org']
  },
  function(accessToken, refreshToken, profile, done) {
    const user = {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      accessToken
    };
    return done(null, user);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;