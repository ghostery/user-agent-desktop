#!/bin/bash

ipfs daemon &
sleep 5
ipfs get -o /builds/worker/fetches/ /ipfs/QmekFQ3vFkzk47U4sQkGQtx5JWK49B6p4LXSCo29x9DMbA
killall ipfs
