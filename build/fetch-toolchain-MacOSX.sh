set -x -e
ipfs daemon &
while [ ! -e ${HOME}/.ipfs/api ]
do
echo "Waiting for IPFS to start"
sleep 1
done
# linux64-cctools-port-clang-11
ipfs get -o /builds/worker/fetches/ /ipfs/QmWT6oCDJtBmZpbB1FxmXZpos3BG6vKCP2MKHK9B4Kq5EK
# linux64-clang-11-macosx-cross
ipfs get -o /builds/worker/fetches/ /ipfs/QmYT2bfUyvtigxh2Dyvpt8NN7xE8Wy3fKabL3j3k2Jj6nW
# linux64-sccache
ipfs get -o /builds/worker/fetches/ /ipfs/QmSRAFJgAPvg57rJPoR4vDVgQcADAeQmb7n7RA995cDQgn
# wasi-sysroot-11
ipfs get -o /builds/worker/fetches/ /ipfs/QmTNWAZhW6g6PH7vrMoWPRUXH8NTN11KrGgpFWGphYTWpw
# linux64-binutils
ipfs get -o /builds/worker/fetches/ /ipfs/QmbFSjpvmnMyBXe2yfYao1kFyJDT5JYwU13PoPAMzw8ZoR
# linux64-dump-syms
ipfs get -o /builds/worker/fetches/ /ipfs/QmZvUz5Yr8WzBiCQ69p266eijmXnwqj2iN9zkpg9NJkY8P
# linux64-hfsplus
ipfs get -o /builds/worker/fetches/ /ipfs/QmYy9XAUvSiKShBi6c6E6L7RTAH4fMwdrPCzq7BRD4HQdR
# linux64-libdmg
ipfs get -o /builds/worker/fetches/ /ipfs/QmXDMq3zmD3vadvjRk4CkB3PLmuo7BczwhTsox7D8SRefz
# linux64-llvm-dsymutil
ipfs get -o /builds/worker/fetches/ /ipfs/QmUNzETVJeAqF3cxNGS7QGpmMpipXrWqu2sTqCDjCQ6g1N
# linux64-rust-macos-1.43
ipfs get -o /builds/worker/fetches/ /ipfs/QmPZdNwxFubRWCPkVMCfPes1FM2ENqodqQQE4BAe1Wg5Gq
# linux64-rust-size
ipfs get -o /builds/worker/fetches/ /ipfs/QmZWzosDJHg6aimHcEjmKiU9Bmv9txGjhEwr7yaaHnBsWS
# linux64-cbindgen
ipfs get -o /builds/worker/fetches/ /ipfs/QmWXyLtHoXYcZHC5us3qX8zrGTc2d8EsjXhqHMhj6u3ebH
# linux64-nasm
ipfs get -o /builds/worker/fetches/ /ipfs/QmWvnVdiVKukH1se82Rq1Wjsmjn9axo6xVQq4B4VKz9681
# linux64-node-10
ipfs get -o /builds/worker/fetches/ /ipfs/QmSuuKqV6u9Hg1ciGmqBYkMjYY6HHms84bbXpySDpGXNLM
# linux64-lucetc
ipfs get -o /builds/worker/fetches/ /ipfs/QmSgacDiHuKMnKoBS9kpZVSPbdABkwpGqdrQtHDVSF1pQV
killall ipfs