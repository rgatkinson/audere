package EbPhotoStoreNative.activities;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.RecyclerView;
import androidx.recyclerview.widget.LinearLayoutManager;
import android.view.View;
import android.view.MenuItem;
import java.lang.String;
import java.util.Map;
import androidx.lifecycle.Observer;

import org.auderenow.ebphotostorenative.R;

import EbPhotoStoreNative.EncounterViewModel;
import EbPhotoStoreNative.PatientEncounter;
import EbPhotoStoreNative.PatientListAdapter;
import EbPhotoStoreNative.EncounterFactory;

public class ListPatientActivity extends AppCompatActivity {
    private RecyclerView recyclerView;
    private RecyclerView.LayoutManager layoutManager;
    private RecyclerView.Adapter mAdapter;
    private EncounterViewModel encounterModel;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_list_patient);

        this.encounterModel = new ViewModelProvider(this, new EncounterFactory()).get(EncounterViewModel.class);

        recyclerView = (RecyclerView) findViewById(R.id.recyclerView);
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        getSupportActionBar().setTitle(R.string.app_name);

        // use a linear layout manager
        layoutManager = new LinearLayoutManager(this);
        recyclerView.setLayoutManager(layoutManager);
        recyclerView.setFocusable(false);

        encounterModel.addObserver(this, new Observer() {
            @Override
            public void onChanged(Object o) {
                Map<String, PatientEncounter> encounterMap = encounterModel.getEncounters().getValue();
                mAdapter = new PatientListAdapter(encounterMap);
                recyclerView.setAdapter(mAdapter);
                findViewById(R.id.button);
            }
        });
    }

    public void onAddPatientClick(View v) {
        startActivity(new Intent(this, AddPatientActivity.class));
    }

    public void onPatientDetailClick(View v) {
        startActivity(new Intent(this, PatientDetailActivity.class));
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            finish();
        }
        return super.onOptionsItemSelected(item);
    }
}
