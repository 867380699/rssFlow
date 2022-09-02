package com.ll.rssflow;

import android.os.Build;
import android.os.Bundle;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import androidx.annotation.RequiresApi;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        registerPlugin(com.capacitorjs.plugins.app.AppPlugin.class);
        registerPlugin(com.getcapacitor.plugin.http.Http.class);
        registerPlugin(ServiceWorkerPlugin.class);
    }
}

