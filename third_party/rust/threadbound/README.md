ThreadBound\<T\>
================

[![Build Status](https://api.travis-ci.org/dtolnay/threadbound.svg?branch=master)](https://travis-ci.org/dtolnay/threadbound)
[![Latest Version](https://img.shields.io/crates/v/threadbound.svg)](https://crates.io/crates/threadbound)
[![Rust Documentation](https://img.shields.io/badge/api-rustdoc-blue.svg)](https://docs.rs/threadbound)

ThreadBound is a wrapper that binds a value to its original thread. The wrapper
gets to be [`Sync`] and [`Send`] but only the original thread on which the
ThreadBound was constructed can retrieve the underlying value.

[`Sync`]: https://doc.rust-lang.org/std/marker/trait.Sync.html
[`Send`]: https://doc.rust-lang.org/std/marker/trait.Send.html

```toml
[dependencies]
threadbound = "0.1"
```

*Version requirement: rustc 1.19+*

### Example

```rust
extern crate threadbound;

use std::marker::PhantomData;
use std::rc::Rc;
use std::sync::Arc;
use threadbound::ThreadBound;

// Neither Send nor Sync. Maybe the index points into a
// thread-local interner.
#[derive(Copy, Clone)]
struct Span {
    index: u32,
    marker: PhantomData<Rc<()>>,
}

// Error types are always supposed to be Send and Sync.
// We can use ThreadBound to make it so.
struct Error {
    span: ThreadBound<Span>,
    message: String,
}

fn main() {
    let err = Error {
        span: ThreadBound::new(Span {
            index: 99,
            marker: PhantomData,
        }),
        message: "fearless concurrency".to_owned(),
    };

    // Original thread can see the contents.
    assert_eq!(err.span.get_ref().unwrap().index, 99);

    let err = Arc::new(err);
    let err2 = err.clone();
    std::thread::spawn(move || {
        // Other threads cannot get access. Maybe they use
        // a default value or a different codepath.
        assert!(err2.span.get_ref().is_none());
    });

    // Original thread can still see the contents.
    assert_eq!(err.span.get_ref().unwrap().index, 99);
}
```

<br>

#### License

<sup>
Licensed under either of <a href="LICENSE-APACHE">Apache License, Version
2.0</a> or <a href="LICENSE-MIT">MIT license</a> at your option.
</sup>

<br>

<sub>
Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in this crate by you, as defined in the Apache-2.0 license, shall
be dual licensed as above, without any additional terms or conditions.
</sub>
