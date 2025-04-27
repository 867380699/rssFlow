package com.ll.rssflow;

import android.net.Uri;
import android.os.Build;
import android.util.Log;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin
public class ServiceWorkerPlugin extends Plugin {

    @RequiresApi(api = Build.VERSION_CODES.N)
    @Override
    public void load() {
        
        ServiceWorkerController swController = ServiceWorkerController.getInstance();

        swController.setServiceWorkerClient(new ServiceWorkerClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(@NonNull WebResourceRequest request) {
                Uri url = request.getUrl();
                WebResourceResponse shouldIntercept = bridge.getLocalServer().shouldInterceptRequest(request);
                Log.d("TAG", "shouldInterceptRequest: " + url);
                Log.d("TAG", "shouldInterceptRequest: " + shouldIntercept +"!");
                return shouldIntercept;
            }
        });
    }
}