#!/usr/bin/env bash

log='./run.log'

echo '######################################################################
' &> "$log"

./js/03.js &>> "$log"

echo '--------------------------------------------------------------------
Test integrity of binary zip file:
  > unzip -t denodeify.Buffer.zip
---------------------------------------' &>> "$log"
unzip -t denodeify.Buffer.zip  &>> "$log"

rm denodeify.Buffer.zip

echo '' &>> "$log"

echo '--------------------------------------------------------------------
Test integrity of binary zip file:
  > unzip -t denodeify.Stream.zip
---------------------------------------' &>> "$log"
unzip -t denodeify.Stream.zip  &>> "$log"

rm denodeify.Stream.zip

echo '' &>> "$log"

echo '######################################################################
' &>> "$log"

./js/04.js &>> "$log"

echo '--------------------------------------------------------------------
Content of cookie jar in default JSON format:
  > cat cookies.json
---------------------------------------' &>> "$log"
cat cookies.json  &>> "$log"

rm cookies.json

echo '' &>> "$log"
echo '' &>> "$log"

echo '--------------------------------------------------------------------
Content of cookie jar after conversion to Netscape format:
  > cat cookies.out.txt
---------------------------------------' &>> "$log"
cat cookies.out.txt  &>> "$log"

rm cookies.out.txt

echo '' &>> "$log"
echo '' &>> "$log"

echo '--------------------------------------------------------------------
Content of cookie jar after re-conversion from Netscape format to JSON:
  > cat cookies.out.json
---------------------------------------' &>> "$log"
cat cookies.out.json  &>> "$log"

rm cookies.out.json

echo '' &>> "$log"
echo '' &>> "$log"

echo '######################################################################
' &>> "$log"

./js/05.js &>> "$log"

echo '######################################################################
' &>> "$log"

./js/06.js &>> "$log"

echo '######################################################################
' &>> "$log"

./js/07.js &>> "$log"

echo '' &>> "$log"
echo '######################################################################
' &>> "$log"

echo '' &>> "$log"
echo '######################################################################
' &>> "$log"

./js/08.js &>> "$log"

echo '######################################################################
' &>> "$log"
