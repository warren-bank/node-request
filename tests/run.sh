#!/usr/bin/env bash

log='./run.log'

./js/02.js &>  "$log"

echo '---------------------------------------
Test integrity of binary zip file:
  > unzip -t denodeify.zip
---------------------------------------' &>> "$log"
unzip -t denodeify.zip  &>> "$log"

rm denodeify.zip
