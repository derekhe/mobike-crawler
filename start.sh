#!/bin/bash

mkdir db
ulimit -n 65535
while true; do
    git pull
    echo "Started"
    python3 crawler.py
done
