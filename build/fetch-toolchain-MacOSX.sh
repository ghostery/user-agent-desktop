set -x -e
ipfs daemon &
while [ ! -e ${HOME}/.ipfs/api ]
do
echo "Waiting for IPFS to start"
sleep 1
done
# linux64-sccache
ipfs get -o /builds/worker/fetches/ /ipfs/QmSRAFJgAPvg57rJPoR4vDVgQcADAeQmb7n7RA995cDQgn
killall ipfs