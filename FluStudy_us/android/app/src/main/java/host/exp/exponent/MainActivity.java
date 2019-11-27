package host.exp.exponent;

import android.os.Bundle;
import android.support.v4.app.ActivityCompat;

import com.facebook.react.ReactPackage;

import java.util.List;

import host.exp.exponent.generated.DetachBuildConstants;
import host.exp.exponent.experience.DetachActivity;

public class MainActivity extends DetachActivity {

  private ActivityCompat.OnRequestPermissionsResultCallback permissionListener;

  @Override
  public String publishedUrl() {
    return "exp://exp.host/@audere/FluAtHomeUS";
  }

  @Override
  public String developmentUrl() {
    return DetachBuildConstants.DEVELOPMENT_URL;
  }

  @Override
  public List<ReactPackage> reactPackages() {
    return ((MainApplication) getApplication()).getPackages();
  }

  @Override
  public List expoPackages() {
    return ((MainApplication) getApplication()).getExpoPackages();
  }

  @Override
  public boolean isDebug() {
    return BuildConfig.DEBUG;
  }

  @Override
  public Bundle initialProps(Bundle expBundle) {
    // Add extra initialProps here
    return expBundle;
  }

  public void addPermissionListener(
          ActivityCompat.OnRequestPermissionsResultCallback permissionListener) {
    this.permissionListener = permissionListener;
  }

  @Override
  public void onRequestPermissionsResult(
          final int requestCode, final String[] permissions, final int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    if (permissionListener != null) {
      permissionListener.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
  }
}
