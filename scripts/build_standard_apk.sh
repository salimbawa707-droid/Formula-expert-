#!/bin/bash
set -e

echo "=== PRE-FLIGHT: Checking Android Build Tools ==="
if ! command -v javac &> /dev/null || [ ! -d "/opt/android-sdk" ]; then
    echo "ERROR: Android build tools (JDK / /opt/android-sdk) are not available in this environment." >&2
    echo "Security & Release Policy: Refusing to create fake or minimal APKs." >&2
    exit 1
fi

echo "=== STEP 1: Vite Web Production Build ==="
npx vite build

echo "=== STEP 2: Preparing Build Directory ==="
BUILD_DIR="/tmp/standard-apk-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src/com/detergentrnd/formulaexpert"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/drawable"
mkdir -p "$BUILD_DIR/res/mipmap-mdpi"
mkdir -p "$BUILD_DIR/res/mipmap-hdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxxhdpi"
mkdir -p "$BUILD_DIR/assets"
mkdir -p "$BUILD_DIR/obj"
mkdir -p "$BUILD_DIR/dist"

# Copy web bundle to Android assets
cp -r dist/* "$BUILD_DIR/assets/"
rm -f "$BUILD_DIR"/assets/*.apk
rm -f "$BUILD_DIR"/assets/assets/*.map

echo "=== STEP 3: Writing XML Resources & Manifest ==="
cat <<'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Detergent Formula Expert</string>
</resources>
EOF

cat <<'EOF' > "$BUILD_DIR/res/values/styles.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.DeviceDefault.NoActionBar">
        <item name="android:windowBackground">#0f172a</item>
        <item name="android:statusBarColor">#0f172a</item>
        <item name="android:navigationBarColor">#0f172a</item>
    </style>
</resources>
EOF

# Generate crisp launcher icons
python3 -c "
import zlib, struct, math, os

def create_png(width, height, is_round=False):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)
        for x in range(width):
            nx = (x - width / 2) / (width / 2)
            ny = (y - height / 2) / (height / 2)
            dist = math.sqrt(nx * nx + ny * ny)
            
            alpha = 255
            if is_round:
                if dist > 0.96:
                    alpha = max(0, int(255 * (1.0 - (dist - 0.96) / 0.04)))
            else:
                sq_dist = (abs(nx)**4 + abs(ny)**4)**0.25
                if sq_dist > 0.95:
                    alpha = max(0, int(255 * (1.0 - (sq_dist - 0.95) / 0.05)))
            
            if alpha <= 0:
                raw_data.extend([0, 0, 0, 0])
                continue
                
            t = (nx * 0.5 + ny * 0.5 + 1.0) / 2.0
            r = int(15 + (2 - 15) * t)
            g = int(23 + (132 - 23) * t)
            b = int(42 + (199 - 42) * t)
            
            bx = nx * 1.8
            by = ny * 1.8 + 0.1
            
            in_neck = (abs(bx) < 0.22 and -0.7 < by < -0.2)
            in_body = (by >= -0.2 and by < 0.65 and abs(bx) < (0.22 + (by + 0.2) * 0.7))
            in_lip = (abs(bx) < 0.35 and -0.78 < by <= -0.68)
            
            is_flask_edge = False
            if in_neck:
                if abs(bx) > 0.16 or by <= -0.65:
                    is_flask_edge = True
            elif in_body:
                max_w = (0.22 + (by + 0.2) * 0.7)
                if abs(bx) > max_w - 0.1 or by > 0.55:
                    is_flask_edge = True
            elif in_lip:
                is_flask_edge = True
                
            in_liquid = in_body and by > 0.05 and not is_flask_edge
            
            b1 = math.sqrt((nx - 0.0)**2 + (ny - (-0.05))**2) < 0.08
            b2 = math.sqrt((nx - 0.18)**2 + (ny - 0.12)**2) < 0.07
            b3 = math.sqrt((nx - (-0.15))**2 + (ny - 0.18)**2) < 0.09
            b4 = math.sqrt((nx - 0.08)**2 + (ny - 0.22)**2) < 0.06
            
            if is_flask_edge:
                r, g, b = 255, 255, 255
            elif b1 or b2 or b3 or b4:
                r, g, b = 240, 253, 250
            elif in_liquid:
                lt = (by - 0.05) / 0.5
                r = int(6 + (16 - 6) * lt)
                g = int(182 + (185 - 182) * lt)
                b = int(212 + (129 - 212) * lt)
            elif in_neck or in_body:
                r = min(255, r + 40)
                g = min(255, g + 60)
                b = min(255, b + 80)
                
            raw_data.extend([r, g, b, alpha])
            
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
        
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    png.extend(chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)))
    compressed = zlib.compress(bytes(raw_data), 9)
    png.extend(chunk(b'IDAT', compressed))
    png.extend(chunk(b'IEND', b''))
    return bytes(png)

densities = [(48, 'mdpi'), (72, 'hdpi'), (96, 'xhdpi'), (144, 'xxhdpi'), (192, 'xxxhdpi')]
build_dir = '$BUILD_DIR'
for size, name in densities:
    folder = os.path.join(build_dir, 'res', f'mipmap-{name}')
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, 'ic_launcher.png'), 'wb') as f:
        f.write(create_png(size, size, False))
    with open(os.path.join(folder, 'ic_launcher_round.png'), 'wb') as f:
        f.write(create_png(size, size, True))
"

cat <<'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.detergentrnd.formulaexpert"
    android:versionCode="10004"
    android:versionName="1.0.4">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="34" />

    <supports-screens
        android:smallScreens="true"
        android:normalScreens="true"
        android:largeScreens="true"
        android:xlargeScreens="true"
        android:anyDensity="true" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />

    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true"
        android:largeHeap="true">
        
        <activity
            android:name="com.detergentrnd.formulaexpert.MainActivity"
            android:label="@string/app_name"
            android:icon="@mipmap/ic_launcher"
            android:roundIcon="@mipmap/ic_launcher_round"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:windowSoftInputMode="adjustResize"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

echo "=== STEP 4: Writing MainActivity.java with Local Asset Intercept Engine ==="
cat <<'EOF' > "$BUILD_DIR/src/com/detergentrnd/formulaexpert/MainActivity.java"
package com.detergentrnd.formulaexpert;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> fileUploadCallback;
    private static final int FILE_CHOOSER_REQUEST_CODE = 1001;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(0xFF0F172A);
            window.setNavigationBarColor(0xFF0F172A);
        }

        FrameLayout layout = new FrameLayout(this);
        layout.setBackgroundColor(0xFF0F172A);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF0F172A);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
        webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        layout.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(layout);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        settings.setEnableSmoothTransition(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    return handleAssetRequest(request.getUrl());
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                if (url != null) {
                    return handleAssetRequest(Uri.parse(url));
                }
                return super.shouldInterceptRequest(view, url);
            }

            private WebResourceResponse handleAssetRequest(Uri uri) {
                String host = uri.getHost();
                String scheme = uri.getScheme();

                if (("localhost".equalsIgnoreCase(host) || "appassets.androidplatform.net".equalsIgnoreCase(host) || "app.local".equalsIgnoreCase(host))
                        && ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))) {
                    String path = uri.getPath();
                    if (path == null || path.isEmpty() || path.equals("/")) {
                        path = "/index.html";
                    }
                    if (path.startsWith("/")) {
                        path = path.substring(1);
                    }

                    try {
                        AssetManager assets = getAssets();
                        InputStream stream = assets.open(path);
                        String mime = getMimeType(path);
                        Map<String, String> headers = new HashMap<>();
                        headers.put("Access-Control-Allow-Origin", "*");
                        headers.put("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                        headers.put("Access-Control-Allow-Headers", "*");
                        headers.put("Cache-Control", "no-cache");
                        return new WebResourceResponse(mime, "UTF-8", 200, "OK", headers, stream);
                    } catch (Exception e) {
                        if (!path.contains(".")) {
                            try {
                                InputStream stream = getAssets().open("index.html");
                                Map<String, String> headers = new HashMap<>();
                                headers.put("Access-Control-Allow-Origin", "*");
                                return new WebResourceResponse("text/html", "UTF-8", 200, "OK", headers, stream);
                            } catch (Exception ex) {
                                // fallback
                            }
                        }
                    }
                }
                return null;
            }

            private String getMimeType(String path) {
                String lower = path.toLowerCase();
                if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
                if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript";
                if (lower.endsWith(".css")) return "text/css";
                if (lower.endsWith(".json") || lower.endsWith(".map")) return "application/json";
                if (lower.endsWith(".png")) return "image/png";
                if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
                if (lower.endsWith(".svg")) return "image/svg+xml";
                if (lower.endsWith(".webp")) return "image/webp";
                if (lower.endsWith(".ico")) return "image/x-icon";
                if (lower.endsWith(".woff")) return "font/woff";
                if (lower.endsWith(".woff2")) return "font/woff2";
                if (lower.endsWith(".ttf")) return "font/ttf";
                if (lower.endsWith(".wasm")) return "application/wasm";
                return "application/octet-stream";
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    return handleExternalLink(request.getUrl());
                }
                return false;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null) {
                    return handleExternalLink(Uri.parse(url));
                }
                return false;
            }

            private boolean handleExternalLink(Uri uri) {
                String scheme = uri.getScheme();
                String host = uri.getHost();
                if (scheme != null && (scheme.equals("http") || scheme.equals("https"))) {
                    if (host != null && (host.contains("localhost") || host.contains("appassets.androidplatform.net") || host.contains("app.local"))) {
                        return false;
                    }
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                return true;
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                              FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;
                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE);
                } catch (Exception e) {
                    fileUploadCallback = null;
                    return false;
                }
                return true;
            }
        });

        // Load local app via secure origin (enables ES Modules, Dexie IndexedDB & localStorage)
        webView.loadUrl("https://localhost/index.html");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (fileUploadCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    if (data.getData() != null) {
                        results = new Uri[]{data.getData()};
                    } else if (data.getClipData() != null) {
                        int count = data.getClipData().getItemCount();
                        results = new Uri[count];
                        for (int i = 0; i < count; i++) {
                            results[i] = data.getClipData().getItemAt(i).getUri();
                        }
                    }
                }
                fileUploadCallback.onReceiveValue(results);
                fileUploadCallback = null;
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
EOF

echo "=== STEP 5: Packaging Resources with AAPT ==="
ANDROID_JAR="/opt/android-sdk/platforms/android-34/android.jar"
D8_JAR="/opt/android-sdk/build-tools/34.0.0/d8.jar"

aapt package -f -m \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -I "$ANDROID_JAR" \
    -A "$BUILD_DIR/assets" \
    -J "$BUILD_DIR/src" \
    -F "$BUILD_DIR/app-unaligned.apk" \
    --auto-add-overlay \
    --min-sdk-version 21 \
    --target-sdk-version 34 \
    --version-code 10004 \
    --version-name "1.0.4"

echo "=== STEP 6: Compiling Java Sources ==="
javac -encoding UTF-8 \
    -source 8 -target 8 \
    -bootclasspath "$ANDROID_JAR" \
    -cp "$ANDROID_JAR" \
    -d "$BUILD_DIR/obj" \
    "$BUILD_DIR/src/com/detergentrnd/formulaexpert/MainActivity.java" \
    "$BUILD_DIR/src/com/detergentrnd/formulaexpert/R.java"

echo "=== STEP 7: Compiling DEX with D8 ==="
java -cp "$D8_JAR" com.android.tools.r8.D8 \
    --release \
    --min-api 21 \
    --output "$BUILD_DIR" \
    --lib "$ANDROID_JAR" \
    $(find "$BUILD_DIR/obj" -name "*.class")

echo "=== STEP 8: Adding classes.dex to APK ==="
cd "$BUILD_DIR"
aapt add "$BUILD_DIR/app-unaligned.apk" classes.dex

PROJECT_ROOT="/app/applet"
cd "$PROJECT_ROOT"

# Secure environment variable validation for release signing
: "${KEYSTORE_STORE_PASS:?Set KEYSTORE_STORE_PASS before release signing}"
: "${KEYSTORE_KEY_PASS:?Set KEYSTORE_KEY_PASS before release signing}"
KEYSTORE="${KEYSTORE_PATH:?Set KEYSTORE_PATH to the secure release keystore}"

# Validate that keystore exists
if [ ! -f "$KEYSTORE" ]; then
    echo "ERROR: Secure release keystore not found at $KEYSTORE" >&2
    exit 1
fi

echo "=== STEP 10: Zipalign 4-byte ==="
FINAL_APK="$PROJECT_ROOT/release-artifacts/detergent-formula-expert-release.apk"
rm -f "$FINAL_APK"
zipalign -p -f 4 "$BUILD_DIR/app-unaligned.apk" "$FINAL_APK"

echo "=== STEP 11: Signing APK with apksigner ==="
apksigner sign \
    --ks "$KEYSTORE" \
    --ks-pass env:KEYSTORE_STORE_PASS \
    --key-pass env:KEYSTORE_KEY_PASS \
    --ks-key-alias detergent-expert \
    --v1-signing-enabled true \
    --v2-signing-enabled true \
    --v3-signing-enabled true \
    "$FINAL_APK"

echo "=== STEP 12: Verifying APK Signature ==="
apksigner verify --verbose "$FINAL_APK"

echo "=== STEP 13: Copying of APK is disabled for artifact hygiene ==="

echo "=== STEP 14: Verifying APK Badging and Resource Table ==="
aapt dump badging "$FINAL_APK" | head -n 30

echo "=== ANDROID RELEASE APK SUCCESSFULLY BUILT AND READY ==="
