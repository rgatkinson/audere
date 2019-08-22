package EbPhotoStoreNative.activities;

import android.content.Intent;
import android.os.Bundle;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.snackbar.Snackbar;
import androidx.appcompat.app.AppCompatActivity;
import 	androidx.appcompat.widget.Toolbar;
import android.view.View;

import org.auderenow.ebphotostorenative.R;

public class PatientDetailActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_patient_detail);
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        getSupportActionBar().setTitle(R.string.back_patient_list);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        toolbar.setNavigationOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                onBackPressed(v);
            }
        });

    }

    public void onBackPressed(View v) {
        startActivity(new Intent(this, ListPatientActivity.class));
    }

}
