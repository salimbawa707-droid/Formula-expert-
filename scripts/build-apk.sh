#!/bin/bash
set -e

echo "=== STEP 1: Vite Web Production Build ==="
npx vite build

echo "=== STEP 2: Setting up Android Project Directory ==="
BUILD_DIR="/tmp/apk-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src/com/detergentrnd/formulaexpert"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/drawable"
mkdir -p "$BUILD_DIR/res/mipmap-hdpi"
mkdir -p "$BUILD_DIR/res/mipmap-mdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxxhdpi"
mkdir -p "$BUILD_DIR/assets"
mkdir -p "$BUILD_DIR/compiled_res"
mkdir -p "$BUILD_DIR/obj"
mkdir -p "$BUILD_DIR/dist"

# Copy web bundle to Android assets (excluding any apk or sourcemaps)
cp -r dist/* "$BUILD_DIR/assets/"
rm -f "$BUILD_DIR"/assets/*.apk
rm -f "$BUILD_DIR"/assets/assets/*.map

echo "=== STEP 3: Writing strings.xml, styles.xml, and AndroidManifest.xml ==="
cat <<'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Detergent Formula Expert</string>
    <string name="package_name">com.detergentrnd.formulaexpert</string>
</resources>
EOF

cat <<'EOF' > "$BUILD_DIR/res/values/styles.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.DeviceDefault.NoActionBar">
        <item name="android:windowBackground">#0f172a</item>
        <item name="android:statusBarColor">#0f172a</item>
        <item name="android:navigationBarColor">#0f172a</item>
        <item name="android:windowLightStatusBar">false</item>
    </style>
</resources>
EOF

cat <<'EOF' > "$BUILD_DIR/res/values/ic_launcher_background.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0f172a</color>
</resources>
EOF

# Create vector foreground for Android 8.0+ adaptive icons
cat <<'EOF' > "$BUILD_DIR/res/drawable/ic_launcher_foreground.xml"
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0ea5e9"
        android:pathData="M54,18 C40,18 28,30 28,44 C28,64 54,90 54,90 C54,90 80,64 80,44 C80,30 68,18 54,18 Z"/>
    <path
        android:fillColor="#ffffff"
        android:pathData="M54,30 C46,30 40,36 40,44 C40,54 54,72 54,72 C54,72 68,54 68,44 C68,36 62,30 54,30 Z"/>
</vector>
EOF

# Create adaptive icon descriptors for Android API 26+
mkdir -p "$BUILD_DIR/res/mipmap-anydpi-v26"
cat <<'EOF' > "$BUILD_DIR/res/mipmap-anydpi-v26/ic_launcher.xml"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
EOF

cat <<'EOF' > "$BUILD_DIR/res/mipmap-anydpi-v26/ic_launcher_round.xml"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
EOF

# Generate crisp, high-resolution PNG launcher icons across all standard Android densities
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
    android:versionCode="10000"
    android:versionName="1.0.0">

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
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:largeHeap="true"
        android:extractNativeLibs="true">
        
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

echo "=== STEP 4: Writing MainActivity.java ==="
cat <<'EOF' > "$BUILD_DIR/src/com/detergentrnd/formulaexpert/MainActivity.java"
package com.detergentrnd.formulaexpert;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
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

import java.io.IOException;
import java.io.InputStream;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> fileUploadCallback;
    private static final int FILE_CHOOSER_REQUEST_CODE = 1001;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure full screen window styling
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

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if (scheme != null && (scheme.equals("http") || scheme.equals("https"))) {
                    if (uri.getHost() != null && (uri.getHost().contains("localhost") || uri.getHost().contains("appassets.androidplatform.net"))) {
                        return false;
                    }
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                    return true;
                }
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
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

        // Load the local app from assets
        webView.loadUrl("file:///android_asset/index.html");
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

echo "=== STEP 5: Compiling Resources with AAPT2 ==="
AAPT2="/opt/android-sdk/build-tools/34.0.0/aapt2"
D8="/opt/android-sdk/build-tools/34.0.0/d8"
APKSIGNER="/opt/android-sdk/build-tools/34.0.0/apksigner"
ANDROID_JAR="/opt/android-sdk/platforms/android-34/android.jar"

$AAPT2 compile --dir "$BUILD_DIR/res" -o "$BUILD_DIR/compiled_res.zip"

$AAPT2 link -o "$BUILD_DIR/app-unaligned.apk" \
    -I "$ANDROID_JAR" \
    --manifest "$BUILD_DIR/AndroidManifest.xml" \
    -A "$BUILD_DIR/assets" \
    --java "$BUILD_DIR/src" \
    --auto-add-overlay \
    "$BUILD_DIR/compiled_res.zip"

echo "=== STEP 6: Compiling Java Sources ==="
javac -encoding UTF-8 \
    -source 1.8 -target 1.8 \
    -bootclasspath "$ANDROID_JAR" \
    -cp "$ANDROID_JAR" \
    -d "$BUILD_DIR/obj" \
    "$BUILD_DIR/src/com/detergentrnd/formulaexpert/MainActivity.java" \
    "$BUILD_DIR/src/com/detergentrnd/formulaexpert/R.java"

echo "=== STEP 7: Generating DEX with D8 ==="
$D8 --release \
    --min-api 24 \
    --output "$BUILD_DIR" \
    --lib "$ANDROID_JAR" \
    $(find "$BUILD_DIR/obj" -name "*.class")

echo "=== STEP 8: Adding classes.dex to APK ==="
cd "$BUILD_DIR"
zip -u "$BUILD_DIR/app-unaligned.apk" classes.dex

echo "=== STEP 9: Creating Release Signing Keystore ==="
mkdir -p /app/applet/release-artifacts
KEYSTORE="/app/applet/release-artifacts/release.keystore"
if [ ! -f "$KEYSTORE" ]; then
    keytool -genkeypair -v \
        -keystore "$KEYSTORE" \
        -alias "detergent-expert" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "detergent2026" \
        -keypass "detergent2026" \
        -dname "CN=Detergent Formula Expert, OU=R&D Lab, O=Formulation Systems, L=Wilmington, ST=Delaware, C=US"
fi

echo "=== STEP 10: Zipalign & Sign APK ==="
FINAL_APK="/app/applet/release-artifacts/detergent-formula-expert-release.apk"
rm -f "$FINAL_APK"
zipalign -p -f -v 4 "$BUILD_DIR/app-unaligned.apk" "$FINAL_APK"

$APKSIGNER sign \
    --ks "$KEYSTORE" \
    --ks-pass pass:detergent2026 \
    --key-pass pass:detergent2026 \
    --ks-key-alias detergent-expert \
    "$FINAL_APK"

echo "=== STEP 11: Verifying APK Signature ==="
$APKSIGNER verify --verbose "$FINAL_APK"

echo "=== STEP 12: Copying to Public & Web Dist Directories ==="
mkdir -p /app/applet/public
cp -f "$FINAL_APK" /app/applet/public/detergent-formula-expert-release.apk
if [ -d "/app/applet/dist" ]; then
    cp -f "$FINAL_APK" /app/applet/dist/detergent-formula-expert-release.apk
fi

echo "=== STEP 13: Inspecting APK Contents and Details ==="
ls -lh "$FINAL_APK"
$AAPT2 dump badging "$FINAL_APK" | head -n 25
unzip -l "$FINAL_APK" | head -n 35

echo "=== APK BUILD COMPLETE SUCCESSFULLY ==="
