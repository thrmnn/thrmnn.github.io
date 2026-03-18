#!/bin/bash
set -e

HUGO_VERSION="0.136.5"
HUGO_URL="https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz"

echo "Downloading Hugo ${HUGO_VERSION}..."
wget -q -O /tmp/hugo.tar.gz "${HUGO_URL}"
tar -xzf /tmp/hugo.tar.gz -C /tmp
chmod +x /tmp/hugo

echo "Hugo version:"
/tmp/hugo version

echo "Building site..."
/tmp/hugo --gc --minify
