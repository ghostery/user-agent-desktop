set -x -e
ipfs daemon &
while [ ! -e ${HOME}/.ipfs/api ]
do
echo "Waiting for IPFS to start"
sleep 1
done
# linux64-binutils
ipfs get -o /builds/worker/fetches/ /ipfs/QmbFSjpvmnMyBXe2yfYao1kFyJDT5JYwU13PoPAMzw8ZoR
# linux64-clang-9
ipfs get -o /builds/worker/fetches/ /ipfs/QmQ97228DNiAURGmQs9RYZXVp1ebGVK3Sze3dQnRLrJKtc
# linux64-rust-1.43
ipfs get -o /builds/worker/fetches/ /ipfs/QmdkG2PjnJBQP6W5nj2VftqvfwVqEa4xGr7RZp2ywPvpJr
# linux64-rust-size
ipfs get -o /builds/worker/fetches/ /ipfs/QmZWzosDJHg6aimHcEjmKiU9Bmv9txGjhEwr7yaaHnBsWS
# linux64-cbindgen
ipfs get -o /builds/worker/fetches/ /ipfs/QmWXyLtHoXYcZHC5us3qX8zrGTc2d8EsjXhqHMhj6u3ebH
# linux64-dump-syms
ipfs get -o /builds/worker/fetches/ /ipfs/QmZvUz5Yr8WzBiCQ69p266eijmXnwqj2iN9zkpg9NJkY8P
# linux64-sccache
ipfs get -o /builds/worker/fetches/ /ipfs/QmSRAFJgAPvg57rJPoR4vDVgQcADAeQmb7n7RA995cDQgn
# linux64-nasm
ipfs get -o /builds/worker/fetches/ /ipfs/QmWvnVdiVKukH1se82Rq1Wjsmjn9axo6xVQq4B4VKz9681
# linux64-node-10
ipfs get -o /builds/worker/fetches/ /ipfs/QmSuuKqV6u9Hg1ciGmqBYkMjYY6HHms84bbXpySDpGXNLM
# linux64-lucetc
ipfs get -o /builds/worker/fetches/ /ipfs/QmSgacDiHuKMnKoBS9kpZVSPbdABkwpGqdrQtHDVSF1pQV
# wasi-sysroot
ipfs get -o /builds/worker/fetches/ /ipfs/QmQTd24kEGFbEYhrc8qV3iDHbjFkstRAyeMhCFsWZ8WGc5
killall ipfs