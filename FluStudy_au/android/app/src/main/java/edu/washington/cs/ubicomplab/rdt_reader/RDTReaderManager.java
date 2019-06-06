package edu.washington.cs.ubicomplab.rdt_reader;

import android.util.Log;

import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

public class RDTReaderManager extends SimpleViewManager<RDTReader> {
    public static final String REACT_CLASS = "RDTReader";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public RDTReader createViewInstance(ThemedReactContext context) {
        return new RDTReader(context, context.getCurrentActivity());
    }

    @Override
    public Map getExportedCustomBubblingEventTypeConstants() {
        return MapBuilder.builder()
                .put("RDTCameraReady",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onRDTCameraReady")))
                .put("RDTCaptured",
                        MapBuilder.of(
                               "phasedRegistrationNames",
                               MapBuilder.of("bubbled", "onRDTCaptured")))
               .build();
    }

    @ReactProp(name = "enabled")
    public void setEnabled(RDTReader view, boolean enabled) {
        Log.i("RDTReader", "RDTReaderManager enabled: " + Boolean.toString(enabled));
        if (enabled) {
            view.enable();
        } else {
            view.disable();
        }
    }
}
