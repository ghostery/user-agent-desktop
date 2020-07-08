use std::error::Error as StdError;
use std::fmt;

use futures::{Future, IntoFuture};

use body::Payload;
use super::Service;

/// An asynchronous constructor of `Service`s.
pub trait MakeService<Ctx> {
    /// The `Payload` body of the `http::Request`.
    type ReqBody: Payload;

    /// The `Payload` body of the `http::Response`.
    type ResBody: Payload;

    /// The error type that can be returned by `Service`s.
    type Error: Into<Box<StdError + Send + Sync>>;

    /// The resolved `Service` from `new_service()`.
    type Service: Service<
        ReqBody=Self::ReqBody,
        ResBody=Self::ResBody,
        Error=Self::Error,
    >;

    /// The future returned from `new_service` of a `Service`.
    type Future: Future<Item=Self::Service, Error=Self::MakeError>;

    /// The error type that can be returned when creating a new `Service`.
    type MakeError: Into<Box<StdError + Send + Sync>>;

    /// Create a new `Service`.
    fn make_service(&mut self, ctx: Ctx) -> Self::Future;
}

// Just a sort-of "trait alias" of `MakeService`, not to be implemented
// by anyone, only used as bounds.
#[doc(hidden)]
pub trait MakeServiceRef<Ctx>: self::sealed::Sealed<Ctx> {
    type ReqBody: Payload;
    type ResBody: Payload;
    type Error: Into<Box<StdError + Send + Sync>>;
    type Service: Service<
        ReqBody=Self::ReqBody,
        ResBody=Self::ResBody,
        Error=Self::Error,
    >;
    type Future: Future<Item=Self::Service>;

    // Acting like a #[non_exhaustive] for associated types of this trait.
    //
    // Basically, no one outside of hyper should be able to set this type
    // or declare bounds on it, so it should prevent people from creating
    // trait objects or otherwise writing code that requires using *all*
    // of the associated types.
    //
    // Why? So we can add new associated types to this alias in the future,
    // if necessary.
    type __DontNameMe: self::sealed::CantImpl;

    fn make_service_ref(&mut self, ctx: &Ctx) -> Self::Future;
}

impl<T, Ctx, E, ME, S, F, IB, OB> MakeServiceRef<Ctx> for T
where
    T: for<'a> MakeService<&'a Ctx, Error=E, MakeError=ME, Service=S, Future=F, ReqBody=IB, ResBody=OB>,
    E: Into<Box<StdError + Send + Sync>>,
    ME: Into<Box<StdError + Send + Sync>>,
    S: Service<ReqBody=IB, ResBody=OB, Error=E>,
    F: Future<Item=S, Error=ME>,
    IB: Payload,
    OB: Payload,
{
    type Error = E;
    type Service = S;
    type ReqBody = IB;
    type ResBody = OB;
    type Future = F;

    type __DontNameMe = self::sealed::CantName;

    fn make_service_ref(&mut self, ctx: &Ctx) -> Self::Future {
        self.make_service(ctx)
    }
}

impl<T, Ctx, E, ME, S, F, IB, OB> self::sealed::Sealed<Ctx> for T
where
    T: for<'a> MakeService<&'a Ctx, Error=E, MakeError=ME, Service=S, Future=F, ReqBody=IB, ResBody=OB>,
    E: Into<Box<StdError + Send + Sync>>,
    ME: Into<Box<StdError + Send + Sync>>,
    S: Service<ReqBody=IB, ResBody=OB, Error=E>,
    F: Future<Item=S, Error=ME>,
    IB: Payload,
    OB: Payload,
{}


/// Create a `MakeService` from a function.
///
/// # Example
///
/// ```rust
/// use std::net::TcpStream;
/// use hyper::{Body, Request, Response};
/// use hyper::service::{make_service_fn, service_fn_ok};
///
/// let make_svc = make_service_fn(|socket: &TcpStream| {
///     let remote_addr = socket.peer_addr().unwrap();
///     service_fn_ok(move |_: Request<Body>| {
///         Response::new(Body::from(format!("Hello, {}", remote_addr)))
///     })
/// });
/// ```
pub fn make_service_fn<F, Ctx, Ret>(f: F) -> MakeServiceFn<F>
where
    F: Fn(&Ctx) -> Ret,
    Ret: IntoFuture,
{
    MakeServiceFn {
        f,
    }
}

// Not exported from crate as this will likely be replaced with `impl Service`.
pub struct MakeServiceFn<F> {
    f: F,
}

impl<'c, F, Ctx, Ret, ReqBody, ResBody> MakeService<&'c Ctx> for MakeServiceFn<F>
where
    F: Fn(&Ctx) -> Ret,
    Ret: IntoFuture,
    Ret::Item: Service<ReqBody=ReqBody, ResBody=ResBody>,
    Ret::Error: Into<Box<StdError + Send + Sync>>,
    ReqBody: Payload,
    ResBody: Payload,
{
    type ReqBody = ReqBody;
    type ResBody = ResBody;
    type Error = <Ret::Item as Service>::Error;
    type Service = Ret::Item;
    type Future = Ret::Future;
    type MakeError = Ret::Error;

    fn make_service(&mut self, ctx: &'c Ctx) -> Self::Future {
        (self.f)(ctx).into_future()
    }
}

impl<F> fmt::Debug for MakeServiceFn<F> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.debug_struct("MakeServiceFn")
            .finish()
    }
}

mod sealed {
    pub trait Sealed<T> {}

    pub trait CantImpl {}

    #[allow(missing_debug_implementations)]
    pub enum CantName {}

    impl CantImpl for CantName {}
}
