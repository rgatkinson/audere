package EbPhotoStoreNative.activities;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.RecyclerView;
import androidx.recyclerview.widget.LinearLayoutManager;
import android.view.View;
import android.view.MenuItem;
import java.lang.String;

import org.auderenow.ebphotostorenative.R;
import EbPhotoStoreNative.PatientListAdapter;

public class ListPatientActivity extends AppCompatActivity {
    private RecyclerView recyclerView;
    private RecyclerView.LayoutManager layoutManager;
    private RecyclerView.Adapter mAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_list_patient);

        recyclerView = (RecyclerView) findViewById(R.id.recyclerView);
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        getSupportActionBar().setTitle(R.string.app_name);

        // use a linear layout manager
        layoutManager = new LinearLayoutManager(this);
        recyclerView.setLayoutManager(layoutManager);
        recyclerView.setFocusable(false);

        // TODO: real data model
        String[] myDataset = { "Smith", "Jones", "Clark", "Thompson", "Davis", "Peterson", "Ellestree", "Brightman",
                "Altman", "Crenshaw", "Fredricks", "Gregory", "Harrison", "Islander", "Herman", "Stevenson", "Trask",
                "Munins", "Kristoff", "Smith", "Jones", "Clark", "Thompson", "Davis", "Peterson", "Ellestree",
                "Brightman", "Altman", "Crenshaw", "Fredricks", "Gregory", "Harrison", "Islander", "Herman",
                "Stevenson", "Trask", "Munins", "Kristoff" };
        mAdapter = new PatientListAdapter(myDataset);
        recyclerView.setAdapter(mAdapter);

        findViewById(R.id.button);
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
