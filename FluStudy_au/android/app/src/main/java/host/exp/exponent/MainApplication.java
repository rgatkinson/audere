package host.exp.exponent;


import com.facebook.CallbackManager;
import com.facebook.react.ReactPackage;

import java.util.Arrays;
import java.util.List;

import expolib_v1.okhttp3.OkHttpClient;
import com.brentvatne.react.ReactVideoPackage;

// Needed for `react-native link`
// import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.reactnativecommunity.netinfo.NetInfoPackage;
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
import expo.modules.barcodescanner.BarCodeScannerPackage;
import expo.modules.camera.CameraPackage;
import expo.modules.constants.ConstantsPackage;
import expo.modules.filesystem.FileSystemPackage;
import expo.modules.font.FontLoaderPackage;
import expo.modules.localization.LocalizationPackage;
import expo.modules.permissions.PermissionsPackage;
import expo.modules.taskManager.TaskManagerPackage;

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
                return Arrays.<NativeModule>asList(new OpenAppSettingsModule(reactContext));
              }

              @Override
              public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
                return Arrays.<ViewManager>asList(new RDTReaderManager());
              }
            },

            // Needed for `react-native link`
            // new MainReactPackage(),
            new NetInfoPackage(),
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
            new ReactVideoPackage()
    );
  }

  public List getExpoPackages() {
    return Arrays.asList(
            new CameraPackage(),
            new ConstantsPackage(),
            new FileSystemPackage(),
            new PermissionsPackage(),
            new ConstantsPackage(),
            new FontLoaderPackage(),
            new LocalizationPackage(),
            new BarCodeScannerPackage(),
            new TaskManagerPackage()
    );
  }

  @Override
  public String gcmSenderId() {
    return getString(R.string.gcm_defaultSenderId);
  }

  @Override
  public boolean shouldUseInternetKernel() {
    return BuildVariantConstants.USE_INTERNET_KERNEL;
  }

  public static OkHttpClient.Builder okHttpClientBuilder(OkHttpClient.Builder builder) {
    // Customize/override OkHttp client here
    return builder;
  }
}
