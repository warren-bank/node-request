#!/usr/bin/env bash

log='./run.log'

./js/03.js &>  "$log"

# ######################################################################

echo '--------------------------------------------------------------------
Test integrity of binary zip file:
  > unzip -t denodeify.Buffer.zip
---------------------------------------' &>> "$log"
unzip -t denodeify.Buffer.zip  &>> "$log"

rm denodeify.Buffer.zip

echo '' &>> "$log"

# ######################################################################

echo '--------------------------------------------------------------------
Test integrity of binary zip file:
  > unzip -t denodeify.Stream.zip
---------------------------------------' &>> "$log"
unzip -t denodeify.Stream.zip  &>> "$log"

rm denodeify.Stream.zip

echo '' &>> "$log"

# ######################################################################
