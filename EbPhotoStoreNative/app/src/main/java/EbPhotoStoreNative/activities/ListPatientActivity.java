package EbPhotoStoreNative.activities;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.view.MenuItem;

import com.example.ebphotostorenative.R;

public class ListPatientActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_list_patient);
        Toolbar toolbar = findViewById(R.id.toolbar);
    }

    public void onAddPatientClick(View v) {
        startActivity(new Intent(this, AddPatientActivity.class));
    }

    public void onPatientDetailClick(View v) {
        startActivity(new Intent(this, PatientDetailActivity.class));
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if(item.getItemId()== android.R.id.home) {

            finish();
        }
        return super.onOptionsItemSelected(item);
    }
}
