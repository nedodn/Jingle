#!/bin/bash

# Requires entr

find . -type f | grep app\/js\/\.*js | entr sh -c 'npm run build'
