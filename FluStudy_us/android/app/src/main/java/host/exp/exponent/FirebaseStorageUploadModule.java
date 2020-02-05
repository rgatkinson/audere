package host.exp.exponent;

import android.net.Uri;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;

import org.jetbrains.annotations.NotNull;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class FirebaseStorageUploadModule extends ReactContextBaseJavaModule {

  static final String TAG = "FirebaseStorageUpload";

  private final StorageReference storageRef;
  private final File queueRoot;

  FirebaseStorageUploadModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.queueRoot = new File(reactContext.getFilesDir(), "FirebaseStorageUploadQueues");
    this.storageRef = FirebaseStorage.getInstance().getReference();
  }

  @NotNull
  @Override
  public String getName() {
    return "FirebaseStorageUploadModule";
  }

  // Adds the contents of file {uriString} to the specified {queue} of pending
  // uploads, and associates the contents with the identifier {uid}.  When the
  // contents are eventually uploaded, the data will be named {queue}/{uid}.
  //
  // The {queue} value should be a valid path sequence both in Linux and in
  // Firestore and may include "/" characters.  The {uid} value should be a
  // valid pathname component and must not include "/" characters.
  //
  // This will copy the file on disk.  Results are undefined if the file is
  // modified before the Promise is completed.
  @ReactMethod
  public void add(String queue, String uid, String uriString, boolean removeOriginal, Promise promise) {
//    Log.d(TAG, "add(queue='"+queue+"', uid='"+uid+"', uri='"+uriString+"')");

    Uri uri = Uri.parse(uriString);
    if (!"file".equals(uri.getScheme())) {
      final String message =
          "Got scheme '"+uri.getScheme()+"', but expected scheme 'file' in uri '"+uriString+"'";
      Log.e(TAG, message);
      throw new IllegalArgumentException(message);
    }

    String filepath = uri.getPath();

    try {
      File q = new File(queueRoot, queue);
      if (!q.isDirectory() && !q.mkdirs()) {
        final String message = "Could not create directory " + q.getAbsolutePath();
        Log.e(TAG, message);
        throw new IOException(message);
      }

      File from = new File(filepath);
      File to = new File(q, uid);
      copy(new File(filepath), to);
      Log.d(TAG, "Copied '"+from.getAbsolutePath()+"' to '"+to.getAbsolutePath()+"'");
      if (removeOriginal) {
        from.delete();
        Log.d(TAG, "Delete original: " + filepath);
      }
      promise.resolve(null);
    } catch (Exception e) {
      Log.e(TAG, "add failure", e);
      promise.reject(e);
    }
  }

  @ReactMethod
  public void deleteFile(String uriString, Promise promise) {
    Log.d(TAG, "deleteFile(uri='"+uriString+"')");

    Uri uri = Uri.parse(uriString);

    String filepath = uri.getPath();

    try {
      File file = new File(filepath);
      file.delete();
      Log.d(TAG, "Deleted file: " + filepath);
      promise.resolve(null);
    } catch (Exception e) {
      Log.e(TAG, "delete failure", e);
      promise.reject(e);
    }
  }

  // Returns the list of pending uids in {queue} that have been added but not
  // yet successfully uploaded.
  @ReactMethod
  public void list(String queue, Promise promise) {
    try {
      File q = new File(queueRoot, queue);
      String[] files = q.list();
      WritableArray result = Arguments.fromArray(files == null ? new String[0] : files);
      promise.resolve(result);
    } catch (Exception e) {
      Log.e(TAG, "list failure", e);
      promise.reject(e);
    }
  }

  // Attempts to upload the contents associated with {uid} in {queue}.
  //
  // If the upload is successful, {uid} is removed from the list of pending
  // uploads and its contents are no longer remembered.
  @ReactMethod
  public void upload(String queue, String uid, Promise promise) {
    Log.d(TAG, "upload(queue='"+queue+"', uid='"+uid+"')");
    try {
      final File local = new File(new File(queueRoot, queue), uid);
//      Log.d(TAG, "  upload from '"+local.getAbsolutePath()+"'");
      final StorageReference destination = this.storageRef.child(queue + "/" + uid);
//      Log.d(TAG, "  upload to '"+destination.toString()+"'");
      destination.putFile(Uri.fromFile(local))
        .addOnFailureListener(promise::reject)
        .addOnCompleteListener(snapshot -> cleanupUpload(local, promise));


    } catch (Exception e) {
      Log.e(TAG, "upload failure", e);
      promise.reject(e);
    }
  }

  private void cleanupUpload(File file, Promise promise) {
    boolean result = file.delete();
    Log.d(TAG, "cleanup '"+file.getAbsolutePath()+"' success="+result);
    promise.resolve(null);
  }

  private static void copy(final File source, final File destination) throws IOException {
    try (final InputStream input = new FileInputStream(source)) {
      try (final OutputStream output = new FileOutputStream(destination)) {
        final byte[] buffer = new byte[1024];
        while (true) {
          final int n = input.read(buffer);
          if (n < 0) {
            break;
          }
          output.write(buffer, 0, n);
        }
      }
    }
  }
}
