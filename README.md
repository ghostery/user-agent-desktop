
# Building in Linux


```sh
$ docker build -t hw:linux -f Dockerfile.linux --build-arg uid=1000 --build-arg gid=1000 --build-arg user=jenkins .
$ docker run -v `pwd`:/workspace -it --rm hw:linux
$ MOZCONFIG=/workspace/mozconfig.linux ./mach build
$ MOZCONFIG=/workspace/mozconfig.linux ./mach package
```
