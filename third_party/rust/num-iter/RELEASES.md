# Release 0.1.37

- [Support for 128-bit integers is now automatically detected and enabled.][5]
  Setting the `i128` crate feature now causes the build script to panic if such
  support is not detected.

**Contributors**: @cuviper

[5]: https://github.com/rust-num/num-iter/pull/5

# Release 0.1.36

- [The iterators are now implemented for `i128` and `u128`][7] starting with
  Rust 1.26, enabled by the new `i128` crate feature.

**Contributors**: @cuviper

[4]: https://github.com/rust-num/num-iter/pull/4

# Release 0.1.35

- [num-iter now has its own source repository][num-356] at [rust-num/num-iter][home].
- [There is now a `std` feature][2], enabled by default, along with the implication
  that building *without* this feature makes this a `#[no_std]` crate.
  - There is no difference in the API at this time.

**Contributors**: @cuviper

[home]: https://github.com/rust-num/num-iter
[num-356]: https://github.com/rust-num/num/pull/356
[2]: https://github.com/rust-num/num-iter/pull/2


# Prior releases

No prior release notes were kept.  Thanks all the same to the many
contributors that have made this crate what it is!

