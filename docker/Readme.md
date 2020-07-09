## Building on windows

### VS2017 Redist

This can be built on windows after setting up a build environment as per [these instructions](https://firefox-source-docs.mozilla.org/setup/windows_build.html#building-firefox-on-windows).
You will need to install the Windows 10 SDK at version `10.0.17134.0`. Then run the following to create `vs2017_15.8.4.zip`:

```bash
./mach python build/windows_toolchain.py create-zip vs2017_15.8.4
```

### Makecab.exe

This is copied from a windows install at `C:\Windows\System32\makecab.exe`.

