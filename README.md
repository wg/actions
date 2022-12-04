# rust/build

Build a Rust crate using cargo. The primary purpose of this GitHub Action is to support deterministic builds of binary crates for multiple platforms. Each compiled binary is augmented with a manifest containing the SHA-256 digest of the binary, the repository & commit it was built from, the compiler used, and the target platform.

**Usage**

    - uses: wg/actions/rust/build@v1
      with:
        target: aarch64-unknown-linux-musl

**Output**

    binaries:  compiled binaries as JSON object
    artifact:  binary artifact name
    binary:    binary filename
    digest:    binary SHA-256 digest
    prefix:    $arch/$system
    location:  /path/to/binary
    manifest:  /path/to/manifest
    compiler:  output of `rustc -Vv` as JSON array
