set -x -e
ipfs daemon &
while [ ! -e ${HOME}/.ipfs/api ]
do
echo "Waiting for IPFS to start"
sleep 1
done
# linux64-binutils
ipfs get -o /builds/worker/fetches/ /ipfs/QmbFSjpvmnMyBXe2yfYao1kFyJDT5JYwU13PoPAMzw8ZoR
# linux64-clang-9-win-cross
ipfs get -o /builds/worker/fetches/ /ipfs/QmVP2xyATSXq3mWF67NfMcFWxi8wQwZzRiokPHQbh5VtWE
# linux64-rust-cross-1.43
ipfs get -o /builds/worker/fetches/ /ipfs/QmTm5Q6Q4rCoo1Wta1BW2mo977HkqKKLH6pxwQWRf95N5T
# linux64-rust-size
ipfs get -o /builds/worker/fetches/ /ipfs/QmZWzosDJHg6aimHcEjmKiU9Bmv9txGjhEwr7yaaHnBsWS
# linux64-nasm
ipfs get -o /builds/worker/fetches/ /ipfs/QmWvnVdiVKukH1se82Rq1Wjsmjn9axo6xVQq4B4VKz9681
# linux64-node-10
ipfs get -o /builds/worker/fetches/ /ipfs/QmSuuKqV6u9Hg1ciGmqBYkMjYY6HHms84bbXpySDpGXNLM
# linux64-cbindgen
ipfs get -o /builds/worker/fetches/ /ipfs/QmWXyLtHoXYcZHC5us3qX8zrGTc2d8EsjXhqHMhj6u3ebH
# linux64-sccache
ipfs get -o /builds/worker/fetches/ /ipfs/QmSRAFJgAPvg57rJPoR4vDVgQcADAeQmb7n7RA995cDQgn
# linux64-dump-syms
ipfs get -o /builds/worker/fetches/ /ipfs/QmZvUz5Yr8WzBiCQ69p266eijmXnwqj2iN9zkpg9NJkY8P
# linux64-wine
ipfs get -o /builds/worker/fetches/ /ipfs/Qmc9y75MCWnWNbZmcHP6sV5tJdQ4GpN9EPSem4jHN3Rwe4
# linux64-liblowercase
ipfs get -o /builds/worker/fetches/ /ipfs/Qmf38zh6yE7Q5vxRfhJRmEGifkzUZ11SddAzkKTwreACGH
# linux64-winchecksec
ipfs get -o /builds/worker/fetches/ /ipfs/QmQ9LcsYkQ9r3h93Gike1k3LZANumSy64YN8p5otAHQnRh
killall ipfs