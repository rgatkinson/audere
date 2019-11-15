package host.exp.exponent;


import com.facebook.CallbackManager;
import com.facebook.react.ReactPackage;

import java.util.Arrays;
import java.util.List;

import com.brentvatne.react.ReactVideoPackage;

// Needed for `react-native link`
// import com.facebook.react.ReactApplication;
import me.listenzz.modal.TranslucentModalReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.facebook.reactnative.androidsdk.FBSDKPackage;

import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.analytics.RNFirebaseAnalyticsPackage;
import io.invertase.firebase.fabric.crashlytics.RNFirebaseCrashlyticsPackage;
import io.invertase.firebase.config.RNFirebaseRemoteConfigPackage;
import io.invertase.firebase.firestore.RNFirebaseFirestorePackage;
import io.invertase.firebase.storage.RNFirebaseStoragePackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;

import org.linusu.RNGetRandomValuesPackage;

// Needed starting Expo v32
import expo.loaders.provider.interfaces.AppLoaderPackagesProviderInterface;
import host.exp.exponent.generated.BasePackageList;
import com.jdc.reactlibrary.RNReferrerPackage;
import com.tectiv3.aes.RCTAesPackage;

public class MainApplication extends ExpoApplication implements AppLoaderPackagesProviderInterface {

  private static CallbackManager mCallbackManager = CallbackManager.Factory.create();

  protected static CallbackManager getCallbackManager() {
    return mCallbackManager;
  }

  @Override
  public boolean isDebug() {
    return BuildConfig.DEBUG;
  }

  // Needed for `react-native link`
  public List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
            // Add your own packages here!
            // TODO: add native modules!
            new ReactPackage() {
              @Override
              public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
                return Arrays.<NativeModule>asList(
                    new OpenAppSettingsModule(reactContext),
                    new FirebaseStorageUploadModule(reactContext)
                );
              }

              @Override
              public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
                return Arrays.<ViewManager>asList(new RDTReaderManager());
              }
            },

            // Needed for `react-native link`
            // new MainReactPackage(),
            new TranslucentModalReactPackage(),
            new ReactNativePushNotificationPackage(),
            new FBSDKPackage(mCallbackManager),
            new RNDeviceInfo(),
            new RNFirebasePackage(),
            new RNFirebaseAnalyticsPackage(),
            new RNFirebaseCrashlyticsPackage(),
            new RNFirebaseRemoteConfigPackage(),
            new RNFirebaseFirestorePackage(),
            new RNFirebaseStoragePackage(),
            new RNGetRandomValuesPackage(),
            new ReactVideoPackage(),
            new RNReferrerPackage(),
            new RCTAesPackage()
    );
  }

  public List getExpoPackages() {
    return new BasePackageList().getPackageList();
  }

  @Override
  public String gcmSenderId() {
    return getString(R.string.gcm_defaultSenderId);
  }
}
