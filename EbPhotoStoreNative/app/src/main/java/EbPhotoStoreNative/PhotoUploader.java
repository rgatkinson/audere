package EbPhotoStoreNative;

import java.util.*;
import java.util.concurrent.Semaphore;

import android.content.Context;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.lang.InterruptedException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;

import android.util.Log;
import android.net.ConnectivityManager;
import android.content.IntentFilter;
import android.os.Bundle;
import android.app.Activity;
import android.os.Looper;
import android.os.Handler;

import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.FirebaseApp;
import com.google.firebase.storage.FirebaseStorage;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;
import com.google.firebase.firestore.FirebaseFirestore;

public class PhotoUploader implements NetworkChangeReceiver.INetworkStatusListener {
  private final Set<String> failedFiles;
  private Timer timer;
  private final FirebaseStorage storage;
  private final StorageReference storageRef;
  private final FirebaseAnalytics firebaseAnalytics;
  private final FirebaseFirestore db;
  private final Context appContext;
  private final NetworkChangeReceiver networkChangeReceiver;
  private final String collection;
  private Handler handler;
  private boolean isLooperUploading;

  private final String TAG = "PhotoUploader";

  private final int second = 1000;
  private final int minute = 60 * second;
  private final int retryDelay = 20 * minute;

  private final String pendingDir;
  private final String pendingDirPrefix;
  private final String uploadedDir;
  private final String uploadedDirPrefix;

  public PhotoUploader(Context context) {
    this.failedFiles = new HashSet<String>();
    this.pendingDir = context.getFilesDir().toString() + "/PhotoUploader/pending";
    this.pendingDirPrefix = pendingDir + "/";
    this.uploadedDir = context.getFilesDir().toString() + "/PhotoUploader/uploaded";
    this.uploadedDirPrefix = uploadedDir + "/";
    this.storage = FirebaseStorage.getInstance();
    this.storageRef = storage.getReference();
    this.collection = "photos";
    this.db = FirebaseFirestore.getInstance();
    this.firebaseAnalytics = FirebaseAnalytics.getInstance(context);
    new File(pendingDir).mkdirs();
    new File(uploadedDir).mkdirs();
    this.handler = LooperThread.create();
    this.isLooperUploading = false;
    this.uploadNext();

    this.appContext = context.getApplicationContext();
    this.networkChangeReceiver = new NetworkChangeReceiver(this);
    this.appContext.registerReceiver(this.networkChangeReceiver,
        new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION));
  }

  public void savePhoto(final String photoId, final String jpegBase64) {
    String argSummary = "savePhoto " + photoId + " length=" + jpegBase64.length();
    if (photoId.length() == 0 || jpegBase64.length() == 0) {
      logException("savePhoto", "args", new RuntimeException("Failed to save photo in " + argSummary));
      return;
    }
    this.fireEvent(new Runnable() {
      @Override
      public void run() {
        looperHandleSave(photoId, jpegBase64);
      }
    });
  }

  @Override
  public void onNetworkStatusChanged(boolean isConnected) {
    if (isConnected) {
      this.uploadNext();
    }
  }

  private void uploadNext() {
    this.fireEvent(new Runnable() {
      @Override
      public void run() {
        looperHandleUploadNext();
      }
    });
  }

  private void fireEvent(final Runnable runnable) {
    this.handler.post(runnable);
  }

  private void logException(String func, String location, Throwable err) {
    String message = err != null ? err.getMessage() : "unknown Error";
    String cause = err != null && err.getCause() != null ? err.getCause().toString() : "unknown cause.";
    String summary = func + ": " + location + " threw Error: '" + message + "' due to: " + cause;
    Bundle bundle = new Bundle();
    bundle.putString("error_message", message);
    bundle.putString("cause", cause);
    bundle.putString("location", location != null ? location : "");
    firebaseAnalytics.logEvent("Error", bundle);
  }

  // Looper thread methods below

  private void looperUploadSuccess(File filePath) {
    this.isLooperUploading = false;
    String photoId = looperPendingIdFromPath(filePath.toString());

      File sourceFile = new File(filePath.getAbsolutePath());
      File destinationFile = new File(uploadedDirPrefix + photoId + ".jpeg");

    if(sourceFile.renameTo(destinationFile)) {
      sourceFile.delete();
    } else {
      logException("looperUploadSuccess", "PhotoUploader", new RuntimeException("Failed to save"));
      failedFiles.add(filePath.toString());
    }



    Bundle info = new Bundle();
    info.putString("photo_id", photoId);
    info.putString("storage_path", filePath.toString());
    firebaseAnalytics.logEvent("photo_uploaded", info);
    this.looperHandleUploadNext();
  }

  private void looperUploadFail(String filePath) {
    this.isLooperUploading = false;
    this.failedFiles.add(filePath);
    this.looperHandleUploadNext();
  }

  private void looperHandleSave(String photoId, String jpegBase64) {
    try {
      FileOutputStream outputStreamWriter = new FileOutputStream(pendingDirPrefix + photoId + ".jpeg");
      outputStreamWriter.write(jpegBase64.getBytes());
      outputStreamWriter.close();
      this.uploadNext();
    } catch (IOException err) {
      logException("looperHandleSave", "PhotoUploader", new RuntimeException("Failed to save"));
    }
  }

  private void looperHandleUploadNext() {
    if (isLooperUploading) {
      return;
    }
    this.isLooperUploading = true;
    if (timer == null) {
      this.looperTimerStart(this);
    }
    if (!networkChangeReceiver.isConnected()) {
      this.isLooperUploading = false;
      return;
    }

    File[] pendingFiles = this.looperPendingFiles();
    if (pendingFiles == null) {
      this.failedFiles.clear();
      this.timer.cancel();
      this.isLooperUploading = false;
      return;
    }
    String filePath = null;

    for (int ii = 0; ii < pendingFiles.length; ii++) {
      if (!failedFiles.contains(pendingFiles[ii].getAbsolutePath())) {
        filePath = pendingFiles[ii].getAbsolutePath();
        break;
      }
    }

    if (filePath == null) {
      // all pending photos failed upload, retry later
      this.failedFiles.clear();
      this.isLooperUploading = false;
      return;
    }
    final File moveOnSuccess = new File(filePath);

    String photoId = looperPendingIdFromPath(filePath);
    String data = "";
    try {
      InputStream inputStream = new FileInputStream(filePath);

      if (inputStream != null) {
        InputStreamReader inputStreamReader = new InputStreamReader(inputStream);
        BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
        String receiveString = "";
        StringBuilder stringBuilder = new StringBuilder();

        while ((receiveString = bufferedReader.readLine()) != null) {
          stringBuilder.append(receiveString);
        }

        inputStream.close();
        data = stringBuilder.toString();
      }
    } catch (IOException err) {
      logException("looperHandleUploadNext", "PhotoUploader", err);
      looperUploadFail(filePath);
    }
    Map<String, Object> photo = new HashMap<>();
    photo.put("jpegBase64", data);
    final String filePathFinal = filePath;
    db.collection("photos").document(photoId).set(photo).addOnSuccessListener(new OnSuccessListener<Void>() {
      @Override
      public void onSuccess(Void aVoid) {
        Log.d(TAG, "DocumentSnapshot successfully written!");
        looperUploadSuccess(moveOnSuccess);
      }
    }).addOnFailureListener(new OnFailureListener() {
      @Override
      public void onFailure(Exception e) {
        Log.w(TAG, "Error writing document", e);
        looperUploadFail(filePathFinal);
      }
    });
  }

  private String looperPendingIdFromPath(String photoPath) {
    if (!photoPath.startsWith(pendingDirPrefix)) {
      throw new Error("Expected path to start with " + pendingDirPrefix + ", got " + photoPath);
    }
    return photoPath.substring(pendingDirPrefix.length(), photoPath.indexOf(".jpeg"));
  }

  private File[] looperPendingFiles() {
    return new File(pendingDir).listFiles();
  }

  private void looperTimerStart(final PhotoUploader ref) {
    this.timer = new Timer();
    this.timer.schedule(new TimerTask() {
      @Override
      public void run() {
        ref.uploadNext();
      }
    }, retryDelay);
  }

  private static class LooperThread extends Thread {
    private Handler handler;
    private Semaphore semaphore = new Semaphore(0);

    public static Handler create() {
      LooperThread thread = new LooperThread();
      thread.start();
      try {
        thread.semaphore.acquire();
      } catch (InterruptedException e) {
        throw new RuntimeException(e);
      }
      return thread.handler;
    }

    @Override
    public void run() {
      Looper.prepare();
      this.handler = new Handler();
      this.semaphore.release();
      Looper.loop();
    }
  }
}
