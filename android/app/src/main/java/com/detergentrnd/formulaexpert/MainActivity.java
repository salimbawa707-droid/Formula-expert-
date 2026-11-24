package com.detergentrnd.formulaexpert;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DocumentDownloadPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
