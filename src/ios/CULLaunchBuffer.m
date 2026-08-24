//
//  CULLaunchBuffer.m
//

#import "CULLaunchBuffer.h"

static NSUserActivity *_pendingUserActivity;
static NSURL *_pendingURL;

@implementation CULLaunchBuffer

+ (void)setPendingUserActivity:(NSUserActivity *)userActivity {
    @synchronized (self) {
        _pendingUserActivity = userActivity;
    }
}

+ (NSUserActivity *)takePendingUserActivity {
    @synchronized (self) {
        NSUserActivity *userActivity = _pendingUserActivity;
        _pendingUserActivity = nil;

        return userActivity;
    }
}

+ (void)setPendingURL:(NSURL *)url {
    @synchronized (self) {
        _pendingURL = url;
    }
}

+ (NSURL *)takePendingURL {
    @synchronized (self) {
        NSURL *url = _pendingURL;
        _pendingURL = nil;

        return url;
    }
}

@end
