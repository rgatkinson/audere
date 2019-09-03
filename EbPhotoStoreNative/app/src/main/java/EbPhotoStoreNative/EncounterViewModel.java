package EbPhotoStoreNative;

import android.util.Log;

import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.Observer;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.MutableLiveData;

import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.EventListener;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.CollectionReference;
import com.google.firebase.firestore.FirebaseFirestoreException;
import com.google.firebase.firestore.QuerySnapshot;

import com.google.gson.Gson;
import com.google.gson.JsonElement;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.lang.InterruptedException;

public class EncounterViewModel extends ViewModel {

  private MutableLiveData<Map<String, PatientEncounter>> encounters;
  private FirebaseFirestore db;
  private final String TAG = "EncounterViewModel";
  private Object waitObject = new Object();

  public EncounterViewModel() {
    this.db = FirebaseFirestore.getInstance();
    this.encounters = new MutableLiveData<Map<String, PatientEncounter>>();
    populateFromFirestoreSnapshot();
  }

  public MutableLiveData<Map<String, PatientEncounter>> getEncounters() {
    if (encounters == null) {
      try {
        waitObject.wait();
      } catch (InterruptedException e) {
        Log.d(TAG, "Timed out", e);
      }
    }
    return this.encounters;
  }

  public void addObserver(LifecycleOwner owner, Observer observer) {
    this.encounters.observe(owner, observer);
  }

  private void setEncounters(Map<String, PatientEncounter> encounters) {
    this.encounters.setValue(encounters);
    synchronized (waitObject) {
      waitObject.notifyAll();
    }
  }

  private void populateFromFirestoreSnapshot() {
    final CollectionReference colRef = db.collection("encounters");

    colRef.addSnapshotListener(new EventListener<QuerySnapshot>() {
      @Override
      public void onEvent(QuerySnapshot snapshot, FirebaseFirestoreException e) {
        if (e != null) {
          Log.w(TAG, "Listen failed.", e);
          return;
        }
        if (snapshot != null) {
          Gson gson = new Gson();
          Map mapEncounters = new TreeMap<String, PatientEncounter>();
          List<DocumentSnapshot> allEncounters = snapshot.getDocuments();
          for (DocumentSnapshot encounterSnap : allEncounters) {
            JsonElement jsonElement = gson.toJsonTree(encounterSnap.getData());
            PatientEncounter encounter = gson.fromJson(jsonElement, PatientEncounter.class);
            mapEncounters.put(encounterSnap.toString(), encounter);
          }
          Log.d(TAG, "Get succeeded");
          setEncounters(mapEncounters);
        } else {
          Log.d(TAG, "get failed with ", new Exception("something weird."));
        }
      }
    });
  }
}
