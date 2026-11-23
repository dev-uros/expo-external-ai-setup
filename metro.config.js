// Expo's default Metro config, plus a Debug ID in every bundle and its source map, so Sentry
// can match a release build's minified stack trace to the source. Harmless without a Sentry
// account — see docs/sentry.md.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
