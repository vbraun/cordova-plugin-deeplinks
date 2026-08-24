//
//  AppDelegate+CULPlugin.m
//
//  Created by Nikolay Demyankov on 15.09.15.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <Cordova/CDVAppDelegate.h>
#import <Cordova/CDVPluginNotifications.h>
#import "CULLaunchBuffer.h"

@interface CDVAppDelegate (CULPlugin)
@end

@implementation CDVAppDelegate (CULPlugin)

/**
 *  Universal links of an app that opted out of the UIScene lifecycle. Apps generated
 *  by cordova-ios 8 use scenes and never reach this method - see CDVSceneDelegate+CULPlugin.m
 *  for that path.
 */
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> *))restorationHandler {
    if (![userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb] || userActivity.webpageURL == nil) {
        return NO;
    }

    [CULLaunchBuffer setPendingUserActivity:userActivity];
    [[NSNotificationCenter defaultCenter] postNotificationName:CDVPluginContinueUserActivityNotification object:userActivity];

    return YES;
}

@end
