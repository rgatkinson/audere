package EbPhotoStoreNative.activities;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.Button;
import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.UUID;
import android.widget.EditText;

import org.auderenow.ebphotostorenative.R;

import EbPhotoStoreNative.LocationFinder;

public class AddPatientActivity extends AppCompatActivity {

    private static final String TAG = "CapturePicture";
    static final int REQUEST_PICTURE_CAPTURE = 1;
    private ImageView image;
    private String pictureFilePath;
    private TextView latitude;
    private TextView longitude;
    //private FirebaseStorage firebaseStorage;
    private String deviceIdentifier;
    private LocationFinder finder;
    private static final int PERMISSION_LOCATION_REQUEST_CODE = 1;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_patient);
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        getSupportActionBar().setTitle(R.string.back_patient_list);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        toolbar.setNavigationOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                onBackToPatientListClick(v);
            }
        });


        finder = new LocationFinder(this);
        image = findViewById(R.id.rdt_image);
        latitude = (TextView)findViewById(R.id.latitude);
        longitude = (TextView)findViewById(R.id.longitude);

        Button captureButton = findViewById(R.id.capture_photo_button);
        if(!getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA)){
            captureButton.setEnabled(false);
        }
        getInstallationIdentifier();

    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           String[] permissions, int[] grantResults) {
        switch (requestCode) {
            case PERMISSION_LOCATION_REQUEST_CODE: {
                // If request is cancelled, the result arrays are empty.
                if (grantResults.length > 0
                        && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    setLatLng();
                    sendTakePictureIntent();

                } else {
                    // Permission denied
                }
                return;
            }

        }
    }

    public void setLatLng() {
        Location currentLocation = finder.getLocation();
        // 5 Decimals is ~1.11m in variation in distance
        latitude.setText(String.format("%.5f", currentLocation.getLatitude()));
        longitude.setText(String.format("%.5f", currentLocation.getLongitude()));
    }


    public void onAddPhotoClick(View v) {
        boolean askedPermission = false;
        if(getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA)){
            if(!finder.canGetLocation()) {
                finder.showPermissionsDialog(this);
            } else {
                setLatLng();
                sendTakePictureIntent();
            }
        }
    }

    public void onBackToPatientListClick(View v) {
        startActivity(new Intent(this, ListPatientActivity.class));
    }

    public void onAddPatientClick(View v) {
        // Add to cloud storage here
        String firstName = ((EditText)findViewById(R.id.first_name)).getText().toString();
        String lastName = ((EditText)findViewById(R.id.last_name)).getText().toString();
        String mobileNumber = ((EditText)findViewById(R.id.mobile_number)).getText().toString();
        String contactInfo = ((EditText)findViewById(R.id.contact_info)).getText().toString();
        String chw_notes = ((EditText)findViewById(R.id.chw_notes)).getText().toString();
        String latitude = ((TextView)findViewById(R.id.latitude)).getText().toString();
        String longitude = ((TextView)findViewById(R.id.longitude)).getText().toString();
        // picture file path for the path to the image

        // Store the record to firebase here
    }

//    private View.OnClickListener capture = new View.OnClickListener() {
//        @Override
//        public void onClick(View view) {
//            if(getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA)){
//                sendTakePictureIntent();
//            }
//        }
//    };
    private void sendTakePictureIntent() {


        Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        cameraIntent.putExtra( MediaStore.EXTRA_FINISH_ON_COMPLETION, true);
        if (cameraIntent.resolveActivity(getPackageManager()) != null) {
            startActivityForResult(cameraIntent, REQUEST_PICTURE_CAPTURE);

            File pictureFile = null;
            try {
                pictureFile = getPictureFile();
            } catch (IOException ex) {
                Toast.makeText(this,
                        "Photo file can't be created, please try again",
                        Toast.LENGTH_SHORT).show();
                return;
            }
            if (pictureFile != null) {

                Uri photoURI = FileProvider.getUriForFile(this,
                        "org.auderenow.ebphotostorenative.fileprovider",
                        pictureFile);
                cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                startActivityForResult(cameraIntent, REQUEST_PICTURE_CAPTURE);
            }
        }
    }
    private File getPictureFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
        String pictureFile = "ebphotostorenative_" + timeStamp;
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        File image = File.createTempFile(pictureFile,  ".jpg", storageDir);
        pictureFilePath = image.getAbsolutePath();
        return image;
    }
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_PICTURE_CAPTURE && resultCode == RESULT_OK) {
            File imgFile = new  File(pictureFilePath);
            if(imgFile.exists())            {
                image.setImageURI(Uri.fromFile(imgFile));
            }
        }
    }
    //save captured picture on cloud storage
    private View.OnClickListener saveCloud = new View.OnClickListener() {
        @Override
        public void onClick(View view) {
            //addToCloudStorage();
        }
    };
    //    private void addToCloudStorage() {
//        File f = new File(pictureFilePath);
//        Uri picUri = Uri.fromFile(f);
//        final String cloudFilePath = deviceIdentifier + picUri.getLastPathSegment();
//
//        FirebaseStorage firebaseStorage = FirebaseStorage.getInstance();
//        StorageReference storageRef = firebaseStorage.getReference();
//        StorageReference uploadeRef = storageRef.child(cloudFilePath);
//
//        uploadeRef.putFile(picUri).addOnFailureListener(new OnFailureListener(){
//            public void onFailure(@NonNull Exception exception){
//                Log.e(TAG,"Failed to upload picture to cloud storage");
//            }
//        }).addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>(){
//            @Override
//            public void onSuccess(UploadTask.TaskSnapshot taskSnapshot){
//                Toast.makeText(CapturePictureActivity.this,
//                        "Image has been uploaded to cloud storage",
//                        Toast.LENGTH_SHORT).show();
//            }
//        });
//    }
    protected synchronized String getInstallationIdentifier() {
        if (deviceIdentifier == null) {
            SharedPreferences sharedPrefs = this.getSharedPreferences(
                    "DEVICE_ID", Context.MODE_PRIVATE);
            deviceIdentifier = sharedPrefs.getString("DEVICE_ID", null);
            if (deviceIdentifier == null) {
                deviceIdentifier = UUID.randomUUID().toString();
                SharedPreferences.Editor editor = sharedPrefs.edit();
                editor.putString("DEVICE_ID", deviceIdentifier);
                editor.commit();
            }
        }
        return deviceIdentifier;
    }

}
