/* -*- Mode: Objective-C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#import <Cocoa/Cocoa.h>
#import "mozAccessible.h"

@interface mozSelectableAccessible : mozAccessible
- (id)selectableChildren;
@end

@interface mozSelectableChildAccessible : mozAccessible
@end

@interface mozTabGroupAccessible : mozSelectableAccessible
@end

@interface mozTabAccessible : mozSelectableChildAccessible
@end
