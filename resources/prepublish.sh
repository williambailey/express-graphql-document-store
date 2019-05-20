#!/usr/bin/env bash

set -euo pipefail

# Publishing to NPM is currently supported by Travis CI, which ensures that all
# tests pass first and the deployed module contains the correct file struture.
# In order to prevent inadvertently circumventing this, we ensure that a CI
# environment exists before continuing.
if [ "${TRAVIS:-}" != true ]
then
    cat 1>&2 <<EOF
!!
!!
!!  Only Travis CI can publish to NPM.
!!
!!
EOF
    exit 1
fi

# Build before Travis CI publishes to NPM
npm install
npm run build
