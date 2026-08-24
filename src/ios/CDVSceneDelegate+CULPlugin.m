//
//  CDVSceneDelegate+CULPlugin.m
//
//  Fills the two gaps that the UIScene lifecycle of cordova-ios 8 leaves for
//  universal links.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <objc/runtime.h>
#import <Cordova/CDVSceneDelegate.h>
#import <Cordova/CDVPluginNotifications.h>
#import "CULLaunchBuffer.h"

@interface CDVSceneDelegate (CULPlugin)
@end

@implementation CDVSceneDelegate (CULPlugin)

/**
 *  Two things are missing when an app opens through a link under the scene lifecycle:
 *
 *  - CDVSceneDelegate forwards the URL contexts of the scene connection, but not its
 *    user activities, so a cold start through a universal link is dropped entirely;
 *  - both the URL contexts and the user activities are delivered while the scene is
 *    connecting, before CDVViewController has created any plugin, so the notifications
 *    are posted to an empty notification center.
 *
 *  Patching -scene:willConnectToSession:options: is the only hook a plugin has here:
 *  the scene delegate belongs to the application, and asking every user of the plugin
 *  to edit their SceneDelegate.swift is not an option.
 */
+ (void)load {
    Method original = class_getInstanceMethod(self, @selector(scene:willConnectToSession:options:));
    Method replacement = class_getInstanceMethod(self, @selector(cul_scene:willConnectToSession:options:));
    if (original && replacement) {
        method_exchangeImplementations(original, replacement);
    }
}

- (void)cul_scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)connectionOptions {
    // park the url first: calling through posts the notification for it, and a plugin
    // that is alive to hear it clears the buffer again on its way past
    for (UIOpenURLContext *context in connectionOptions.URLContexts) {
        [CULLaunchBuffer setPendingURL:context.URL];
    }

    // implementations are exchanged, so this calls through to CDVSceneDelegate
    [self cul_scene:scene willConnectToSession:session options:connectionOptions];

    for (NSUserActivity *userActivity in connectionOptions.userActivities) {
        if (![userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb] || userActivity.webpageURL == nil) {
            continue;
        }

        [CULLaunchBuffer setPendingUserActivity:userActivity];

        // plugins that are already alive - none of ours at this point, but other
        // plugins may be listening - get it the regular way
        [[NSNotificationCenter defaultCenter] postNotificationName:CDVPluginContinueUserActivityNotification object:userActivity];
    }
}

@end
