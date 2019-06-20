// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

package host.exp.exponent;

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

    @ReactProp(name = "showDefaultViewfinder")
    public void setShowDefaultViewFinder(RDTReader view, boolean showDefaultViewFinder) {
        view.setShowViewfinder(showDefaultViewFinder);
    }

    @ReactProp(name = "flashEnabled")
    public void setFlashEnabled(RDTReader view, boolean flashEnabled) {
        view.setFlashEnabled(flashEnabled);
    }
}
