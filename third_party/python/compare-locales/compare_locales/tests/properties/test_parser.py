# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from __future__ import absolute_import
from __future__ import unicode_literals
import unittest

from six.moves import zip
from compare_locales.tests import ParserTestMixin
from compare_locales.parser import (
    Comment,
    Junk,
    Whitespace,
)


class TestPropertiesParser(ParserTestMixin, unittest.TestCase):

    filename = 'foo.properties'

    def testBackslashes(self):
        self._test(r'''one_line = This is one line
two_line = This is the first \
of two lines
one_line_trailing = This line ends in \\
and has junk
two_lines_triple = This line is one of two and ends in \\\
and still has another line coming
''', (
            ('one_line', 'This is one line'),
            (Whitespace, '\n'),
            ('two_line', u'This is the first of two lines'),
            (Whitespace, '\n'),
            ('one_line_trailing', u'This line ends in \\'),
            (Whitespace, '\n'),
            (Junk, 'and has junk\n'),
            ('two_lines_triple', 'This line is one of two and ends in \\'
             'and still has another line coming'),
            (Whitespace, '\n')))

    def testProperties(self):
        # port of netwerk/test/PropertiesTest.cpp
        self.parser.readContents(self.resource('test.properties'))
        ref = ['1', '2', '3', '4', '5', '6', '7', '8',
               'this is the first part of a continued line '
               'and here is the 2nd part']
        i = iter(self.parser)
        for r, e in zip(ref, i):
            self.assertTrue(e.localized)
            self.assertEqual(e.val, r)

    def test_bug121341(self):
        # port of xpcom/tests/unit/test_bug121341.js
        self.parser.readContents(self.resource('bug121341.properties'))
        ref = ['abc', 'xy', u"\u1234\t\r\n\u00AB\u0001\n",
               "this is multiline property",
               "this is another multiline property", u"test\u0036",
               "yet another multiline propery", u"\ttest5\u0020", " test6\t",
               u"c\uCDEFd", u"\uABCD"]
        i = iter(self.parser)
        for r, e in zip(ref, i):
            self.assertEqual(e.val, r)

    def test_comment_in_multi(self):
        self._test(r'''bar=one line with a \
# part that looks like a comment \
and an end''', (('bar', 'one line with a # part that looks like a comment '
                'and an end'),))

    def test_license_header(self):
        self._test('''\
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

foo=value
''', (
            (Comment, 'MPL'),
            (Whitespace, '\n\n'),
            ('foo', 'value'),
            (Whitespace, '\n')))

    def test_escapes(self):
        self.parser.readContents(br'''
# unicode escapes
zero = some \unicode
one = \u0
two = \u41
three = \u042
four = \u0043
five = \u0044a
six = \a
seven = \n\r\t\\
''')
        ref = ['some unicode', chr(0), 'A', 'B', 'C', 'Da', 'a', '\n\r\t\\']
        for r, e in zip(ref, self.parser):
            self.assertEqual(e.val, r)

    def test_trailing_comment(self):
        self._test('''first = string
second = string

#
#commented out
''', (
            ('first', 'string'),
            (Whitespace, '\n'),
            ('second', 'string'),
            (Whitespace, '\n\n'),
            (Comment, 'commented out'),
            (Whitespace, '\n')))

    def test_trailing_newlines(self):
        self._test('''\
foo = bar

\x20\x20
  ''', (('foo', 'bar'), (Whitespace, '\n\n\x20\x20\n ')))

    def test_just_comments(self):
        self._test('''\
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# LOCALIZATION NOTE These strings are used inside the Promise debugger
# which is available as a panel in the Debugger.
''', (
            (Comment, 'MPL'),
            (Whitespace, '\n\n'),
            (Comment, 'LOCALIZATION NOTE'),
            (Whitespace, '\n')))

    def test_just_comments_without_trailing_newline(self):
        self._test('''\
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# LOCALIZATION NOTE These strings are used inside the Promise debugger
# which is available as a panel in the Debugger.''', (
            (Comment, 'MPL'),
            (Whitespace, '\n\n'),
            (Comment, 'LOCALIZATION NOTE')))

    def test_trailing_comment_and_newlines(self):
        self._test('''\
# LOCALIZATION NOTE These strings are used inside the Promise debugger
# which is available as a panel in the Debugger.



''',  (
            (Comment, 'LOCALIZATION NOTE'),
            (Whitespace, '\n\n\n')))

    def test_standalone_license(self):
        self._test('''\
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
foo = value
''', (
            (Comment, 'MPL'),
            (Whitespace, '\n'),
            ('foo', 'value'),
            (Whitespace, '\n')))

    def test_empty_file(self):
        self._test('', tuple())
        self._test('\n', ((Whitespace, '\n'),))
        self._test('\n\n', ((Whitespace, '\n\n'),))
        self._test(' \n\n', ((Whitespace, '\n\n'),))

    def test_positions(self):
        self.parser.readContents(b'''\
one = value
two = other \\
escaped value
''')
        one, two = list(self.parser)
        self.assertEqual(one.position(), (1, 1))
        self.assertEqual(one.value_position(), (1, 7))
        self.assertEqual(two.position(), (2, 1))
        self.assertEqual(two.value_position(), (2, 7))
        self.assertEqual(two.value_position(-1), (3, 14))
        self.assertEqual(two.value_position(10), (3, 3))

    # Bug 1399059 comment 18
    def test_z(self):
        self.parser.readContents(b'''\
one = XYZ ABC
''')
        one, = list(self.parser)
        self.assertEqual(one.val, 'XYZ ABC')

    def test_white_space_stripping(self):
        self._test('''\
one = one
two = two \n\
three = three\xa0''', (
            ('one', 'one'),
            (Whitespace, '\n'),
            ('two', 'two'),
            (Whitespace, '\n'),
            ('three', 'three\xa0'),
        ))

    def test_white_space_keys(self):
        self._test('''\
o\\ e = one
t\fo = two \n\
t\xa0e = three\xa0''', (
            ('o\\ e', 'one'),
            (Whitespace, '\n'),
            ('t\fo', 'two'),
            (Whitespace, '\n'),
            ('t\xa0e', 'three\xa0'),
        ))

    def test_pre_comment(self):
        self._test('''\
# comment
one = string

# standalone

# glued
second = string
''', (
            ('one', 'string', 'comment'),
            (Whitespace, '\n\n'),
            (Comment, 'standalone'),
            (Whitespace, '\n\n'),
            ('second', 'string', 'glued'),
            (Whitespace, '\n'),
        ))


if __name__ == '__main__':
    unittest.main()
