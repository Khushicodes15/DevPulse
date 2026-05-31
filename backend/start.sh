#!/bin/bash
echo "GITHUB_TOKEN=${GITHUB_TOKEN}" > /app/coral-config/workspaces/default/sources/github/secrets.env
echo "LINEAR_API_KEY=${LINEAR_API_KEY}" > /app/coral-config/workspaces/default/sources/linear/secrets.env
echo "SENTRY_TOKEN=${SENTRY_TOKEN}" > /app/coral-config/workspaces/default/sources/sentry/secrets.env
exec node index.js