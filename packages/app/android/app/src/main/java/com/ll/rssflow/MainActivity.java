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
        registerPlugin(ServiceWorkerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

