module.exports = require('@mixmaxhq/git-hooks');

// Husky explicitly greps for the hook itself to determine whether to run the hook. Here are the
// hooks, to bypass this check:
//
// - pre-push
// - commit-msg
