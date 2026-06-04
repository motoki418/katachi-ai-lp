#!/bin/sh
set -eu

output_dir="dist"

rm -rf "$output_dir"
mkdir -p "$output_dir"

cp index.html "$output_dir/"
cp privacy.html "$output_dir/"
cp robots.txt "$output_dir/"
cp sitemap.xml "$output_dir/"
cp favicon.svg "$output_dir/"
cp profile.png "$output_dir/"
cp -R downloads "$output_dir/"
cp -R samples "$output_dir/"

find "$output_dir" -name ".DS_Store" -delete
