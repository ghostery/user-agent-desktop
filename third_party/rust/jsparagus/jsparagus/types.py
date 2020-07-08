"""Type inference for reduce expressions.

The nonterminals and reduce expressions in a grammar can have types, to support
generating parsers in typeful languages. Types are represented by `Type` objects.

A `TypeVar` is a type variable that might be bound to any type.  This is used
only during inference. So during inference, a type is either a `Type` or a
`TypeVar`

In addition, MethodType simply gathers together a return type and a list of
argument types.

See infer_types() for more.
"""

import collections
from . import grammar


class Lifetime(collections.namedtuple('Lifetime', 'name')):
    def __new__(cls, name):
        self = super(Lifetime, cls).__new__(cls, name)
        return self
    def __eq__(self, other):
        return isinstance(other, Lifetime) and super(Lifetime, self).__eq__(other)
    def __hash__(self):
        return super(Lifetime, self).__hash__()
    def __str__(self):
        return "'" + self.name

TypeBase = collections.namedtuple('Type', 'name args')

_all_types = {}


class Type(TypeBase):
    def __new__(cls, name, args=()):
        # type checking
        if type(name) is not str:
            raise TypeError("Type() first argument must be a str, not {!r}".format(name))
        args = tuple(args)
        for arg in args:
            if not isinstance(arg, (Type, TypeVar, Lifetime)):
                raise TypeError("Type parameters must be types, not {!r}".format(arg))

        # caching
        key = name, args
        if key not in _all_types:
            _all_types[key] = super().__new__(cls, name, args)
        return _all_types[key]

    def __eq__(self, other):
        return isinstance(other, Type) and super(Type, self).__eq__(other)

    def __hash__(self):
        return hash((self.name, self.args))

    def __str__(self):
        if self.args:
            return '{}<{}>'.format(self.name, ', '.join(map(str, self.args)))
        else:
            return self.name

    def __repr__(self):
        if self.args:
            return 'Type({!r}, {!r})'.format(self.name, self.args)
        else:
            return 'Type({!r})'.format(self.name)


UnitType = Type('Unit')
TokenType = Type('Token')

# The type of expressions that can't be fully evaluated, like Rust `panic!()`;
# likewise, the return type of functions that don't return.
NoReturnType = Type('NoReturn')


class TypeVar:
    """A type variable, used only during type inference.

    The point of type inference is to assign each method and each nonterminal a
    return type; we start by assigning each one a type variable and then do
    unification, a la Hindley-Milner.

    Each type variable may be given a str `name` and a positive int
    `precedence`. These are used at the end of type inference, if we still
    don't know a concrete type for this variable--which is often the case for
    nonterminals.

    The precedence is used when two type variables are unified, to choose the
    better name. (Nonterminal names should take precedence over method names.)
    Greater precedence numbers mean higher precedence.
    """
    __slots__ = ['name', 'precedence', 'value']

    def __init__(self, name=None, precedence=0):
        assert (precedence > 0) == (name is not None)
        assert name is None or isinstance(name, str)
        self.name = name
        self.precedence = precedence
        self.value = None

    def __str__(self):
        return 'TypeVar({!r})'.format(self.name)


class JsparagusTypeError(Exception):
    def annotate(self, line):
        message, *rest = self.args
        message = line + "\n" + message
        self.args = message, *rest

    @classmethod
    def clash(cls, expected, actual):
        return cls("expected type {}, got type {}".format(expected, actual))


def deref(t):
    assert isinstance(t, (Type, TypeVar))
    if isinstance(t, TypeVar):
        if t.value is not None:
            t.value = deref(t.value)
            return t.value
    return t


def final_deref(ty):
    """ Like deref(), but also replace any remaining unresolved type variables with
    synthesized Types.
    """
    ty = deref(ty)
    if isinstance(ty, TypeVar):
        assert ty.name is not None, "internal error: no way to assign a type to variable"
        # ty becomes an nt type.
        assert ty.name != 'Unit'
        ty.value = Type(ty.name)
        return ty.value
    else:
        assert isinstance(ty, Type)
        if ty.args:
            assert ty.name != 'Unit'
            return Type(ty.name, tuple(final_deref(arg) for arg in ty.args))
        return ty


def unify(actual, expected):
    actual = deref(actual)
    expected = deref(expected)

    assert isinstance(actual, (Type, TypeVar))
    assert isinstance(expected, (Type, TypeVar))

    if actual is expected:
        pass
    elif isinstance(actual, Type) and isinstance(expected, Type):
        if actual.name != expected.name or len(actual.args) != len(expected.args):
            raise JsparagusTypeError.clash(expected, actual)

        for i, (actual_arg, expected_arg) in enumerate(zip(actual.args, expected.args)):
            try:
                unify(actual_arg, expected_arg)
            except JsparagusTypeError:
                # The error message has to do with the parameter, but we want
                # to provide the complete problem types.
                raise JsparagusTypeError.clash(expected, actual)

    elif isinstance(expected, TypeVar):
        assert expected.value is None
        if (isinstance(actual, TypeVar)
                and actual.precedence <= expected.precedence):
            actual.value = expected
        else:
            expected.value = actual
    else:
        assert isinstance(actual, TypeVar)
        assert actual.value is None
        if actual is not expected:
            actual.value = expected


class MethodType:
    __slots__ = ['argument_types', 'return_type']

    def __init__(self, argument_types, return_type):
        self.argument_types = argument_types
        self.return_type = return_type

    def resolve(self):
        return MethodType(
            [final_deref(t) for t in self.argument_types],
            final_deref(self.return_type))

    def __repr__(self):
        return 'MethodType({!r}, {!r})'.format(self.argument_types, self.return_type)


def infer_types(g):
    """Assign a type to each nonterminal and each method in a grammar.

    The type system is pretty rigid. We don't have any polymorphism or union
    types. If two of a nonterminal's productions have different types, this
    will typically just unify the two types, which can result in mysterious
    output. If it can't do that (e.g. if one of the types is `str`) then it
    throws a JsparagusTypeError.

    This mutates the Grammar `g` in place, assigning to the `.type` field of
    each NtDef in `g.nonterminals` and to `g.methods`.
    """

    def type_of_nt(nt, nt_def):
        if nt_def.type is not None:
            return nt_def.type
        else:
            nt_name = nt if isinstance(nt, str) else nt.name
            return TypeVar(nt_name, 2)

    nt_types = {
        nt: type_of_nt(nt, nt_def)
        for nt, nt_def in g.nonterminals.items()
        if not isinstance(nt, grammar.InitNt)
    }

    method_types = {}

    def element_type(e):
        if isinstance(e, str):
            if e in g.nonterminals:
                return nt_types[e]
            else:
                return TokenType
        elif isinstance(e, grammar.Optional):
            return Type('Option', [element_type(e.inner)])
        elif isinstance(e, grammar.Literal):
            return TokenType
        elif isinstance(e, grammar.UnicodeCategory):
            return TokenType
        elif isinstance(e, grammar.Exclude):
            return Type('Exclude', [element_type(e.inner)] + [element_type(v) for v in e.exclusion_list])
        elif isinstance(e, grammar.Nt):
            # Cope with the awkward fact that g.nonterminals keys may be either
            # strings or Nt objects.
            return nt_types[e if e in nt_types else e.name]
        else:
            assert False, "unexpected element type: {!r}".format(e)

    def expr_type(expr):
        if isinstance(expr, int):
            return concrete_element_types[expr]
        elif expr is None:
            return Type('Option', [TypeVar()])
        elif isinstance(expr, grammar.Some):
            return Type('Option', [expr_type(expr.inner)])
        elif isinstance(expr, grammar.CallMethod):
            arg_types = [expr_type(arg) for arg in expr.args]
            if expr.method in method_types:
                mtype = method_types[expr.method]
                if len(expr.args) != len(mtype.argument_types):
                    raise JsparagusTypeError(
                        "method {!r} is called with {} argument(s) and with {} argument(s)"
                        .format(expr.method, len(expr.args), len(mtype.argument_types)))
                for i, (actual_type, expected_type) in enumerate(
                        zip(arg_types, mtype.argument_types)):
                    try:
                        unify(actual_type, expected_type)
                    except JsparagusTypeError as exc:
                        exc.annotate(
                            "error passing {} as argument {} to method {!r}:"
                            .format(
                                grammar.expr_to_str(expr.args[i]),
                                i + 1,
                                expr.method))
                        raise
            else:
                # Use method name as fallback type name (but low
                # precedence--this should be unified with something better).
                name = expr.method
                if ' ' in name:
                    name = name.split(' ')[0]

                mtype = MethodType(arg_types, TypeVar(name, 1))
                method_types[expr.method] = mtype
            return mtype.return_type
        elif expr == 'accept':
            return NoReturnType
        else:
            raise TypeError("unrecognized reduce expr: {!r}".format(expr))

    for nt, nt_def in g.nonterminals.items():
        if isinstance(nt, grammar.InitNt):
            continue
        nt_type = nt_types[nt]
        for i, p in enumerate(nt_def.rhs_list):
            concrete_element_types = [
                element_type(e)
                for e in p.body
                if grammar.is_concrete_element(e)
            ]
            try:
                unify(nt_type, expr_type(p.reducer))
            except JsparagusTypeError as exc:
                exc.annotate(
                    "in nonterminal {!r}, production {}:"
                    .format(nt, i + 1))
                raise

    for nt, ty in nt_types.items():
        g.nonterminals[nt].type = final_deref(ty)
    g.methods = {name: mtype.resolve() for name, mtype in method_types.items()}
