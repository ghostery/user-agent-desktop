
# Building in Linux


```sh
$ docker build -t hw:linux -f Dockerfile.linux --build-arg uid=1000 --build-arg gid=1000 --build-arg user=jenkins .
$ docker run -v `pwd`:/workspace -it --rm hw:linux
$ MOZCONFIG=/workspace/mozconfig.linux ./mach build
$ MOZCONFIG=/workspace/mozconfig.linux ./mach package
```

# Fern

The `fern.sh` script (soon to be rewritten in Node.js ;)), gives a taste of how a patch-based workflow would look like.

```sh
$ ./fern.sh use 78.0.1
$ cd mozilla-release # Do some stuff... and commit your changes
$ ./fern.sh export-patches # Check 'patches' folder
$ ./fern.sh reset # reset 'mozilla-release' folder
$ ./fern.sh import-patches # Check 'mozilla-release' folder again!
```
