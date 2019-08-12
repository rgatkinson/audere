package EbPhotoStoreNative.activities;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.View;
import android.view.Menu;
import android.view.MenuItem;
import android.content.Intent;
import android.content.Context;
import android.content.IntentFilter;
import android.net.ConnectivityManager;

import EbPhotoStoreNative.NetworkChangeReceiver;
import org.auderenow.ebphotostorenative.R;

public class MainActivity extends AppCompatActivity implements NetworkChangeReceiver.INetworkStatusListener{

    private NetworkChangeReceiver mNetworkReceiver;
    private static Context mContext;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        MainActivity.mContext = getApplicationContext();

        mNetworkReceiver = new NetworkChangeReceiver(this);
        MainActivity.mContext.registerReceiver(
            mNetworkReceiver,
            new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION)
        );
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override
    public boolean onPrepareOptionsMenu(Menu menu) {
        MenuItem network = menu.findItem(R.id.action_network);

        network.setVisible(!NetworkChangeReceiver.isConnected());
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        switch (item.getItemId()) {
            case R.id.action_settings:
                return true;
            case R.id.action_network:
                Log.d("Menu Selection", "Cloud offline icon clicked");
                return true;
        }

        return super.onOptionsItemSelected(item);
    }


    @Override
    public void onNetworkStatusChanged(boolean isConnected) {
        invalidateOptionsMenu();
    }

    public void onLoginClick(View v) {
        startActivity(new Intent(this, ListPatientActivity.class));

    }

}
