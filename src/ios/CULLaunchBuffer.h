//
//  CULLaunchBuffer.h
//
//  Holds the link that started the app until the plugin exists to consume it.
//

#import <Foundation/Foundation.h>

/**
 *  Under the UIScene lifecycle the launch link is delivered while the scene is
 *  connecting - roughly a tenth of a second before CDVViewController creates its
 *  plugins. Notifications posted then reach nobody, so the scene delegate parks
 *  the link here and CULPlugin picks it up in pluginInitialize.
 */
@interface CULLaunchBuffer : NSObject

/**
 *  Park the user activity that launched the app.
 *
 *  @param userActivity activity from the scene connection options
 */
+ (void)setPendingUserActivity:(NSUserActivity *)userActivity;

/**
 *  Take the parked user activity, clearing it.
 *
 *  @return parked activity; <code>nil</code> if there is none
 */
+ (NSUserActivity *)takePendingUserActivity;

/**
 *  Park the custom scheme url that launched the app.
 *
 *  @param url url from the scene connection options
 */
+ (void)setPendingURL:(NSURL *)url;

/**
 *  Take the parked url, clearing it.
 *
 *  @return parked url; <code>nil</code> if there is none
 */
+ (NSURL *)takePendingURL;

@end
