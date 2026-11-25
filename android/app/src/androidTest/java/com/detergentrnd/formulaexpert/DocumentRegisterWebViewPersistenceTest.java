package com.detergentrnd.formulaexpert;

import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.MediaStore;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

@RunWith(AndroidJUnit4.class)
public class DocumentRegisterWebViewPersistenceTest {
    private static WebView findWebView(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView found = findWebView(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }

    private static String evaluate(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        AtomicReference<WebView> webViewRef = new AtomicReference<>();
        scenario.onActivity(activity -> webViewRef.set(findWebView(activity.getWindow().getDecorView())));
        WebView webView = webViewRef.get();
        assertNotNull("Capacitor WebView must be present", webView);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
            webView.evaluateJavascript(script, value -> {
                result.set(value);
                latch.countDown();
            })
        );
        assertTrue("JavaScript evaluation timed out", latch.await(15, TimeUnit.SECONDS));
        return result.get();
    }

    private static String evaluateAsync(ActivityScenario<MainActivity> scenario, String expression) throws Exception {
        String start = evaluate(scenario,
            "(()=>{window.__nativeDocTestResult=null;Promise.resolve().then(()=>(" + expression + ")).then(v=>window.__nativeDocTestResult=String(v)).catch(e=>window.__nativeDocTestResult='ERROR:'+e.message);return 'STARTED'})()");
        assertTrue("Async JavaScript operation did not start: " + start, start != null && start.contains("STARTED"));
        long deadline = System.currentTimeMillis() + 15000;
        while (System.currentTimeMillis() < deadline) {
            String value = evaluate(scenario, "window.__nativeDocTestResult");
            if (value != null && !value.equals("null")) return value;
            Thread.sleep(200);
        }
        throw new AssertionError("Async JavaScript operation timed out");
    }

    private static ActivityScenario<MainActivity> launch() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        Intent intent = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return ActivityScenario.launch(intent);
    }

    private static void openDocsRegister(ActivityScenario<MainActivity> scenario) throws Exception {
        long deadline = System.currentTimeMillis() + 60000;
        boolean navigationReady = false;
        while (System.currentTimeMillis() < deadline) {
            String state = evaluate(scenario,
                "(()=>{const b=document.querySelector(\"button[data-testid='nav-docs_library']\");return document.readyState+'|'+(b?'NAV_READY':'NAV_WAIT')})()");
            if (state != null && state.contains("NAV_READY")) { navigationReady = true; break; }
            Thread.sleep(300);
        }
        if (!navigationReady) {
            String diagnostic = evaluate(scenario,
                "(()=>JSON.stringify({title:document.title,url:location.href,readyState:document.readyState,bodyText:document.body?.innerText?.slice(0,1200)||'',bodyHtml:document.body?.innerHTML?.slice(0,1800)||'',rootHtml:document.querySelector('#root')?.innerHTML?.slice(0,1800)||'',navButtons:document.querySelectorAll('button[data-testid^=nav-]').length,docsNav:!!document.querySelector(\\"button[data-testid='nav-docs_library']\\"),scripts:[...document.scripts].map(s=>s.src).filter(Boolean),userAgent:navigator.userAgent,localStorageKeys:Object.keys(localStorage)}) )()");
            android.util.Log.e("DocumentWebViewTest", "R&D navigation unavailable; WebView state=" + diagnostic);
            throw new AssertionError("R&D navigation did not become available in Android WebView; state=" + diagnostic);
        }
        String clicked = evaluate(scenario,
            "(()=>{const b=document.querySelector(\"button[data-testid='nav-docs_library']\");if(!b)return 'NAV_MISSING';b.click();return 'NAV_CLICKED'})()");
        assertTrue("Docs & SDS navigation control was not clicked: " + clicked,
            clicked != null && clicked.contains("NAV_CLICKED"));

        deadline = System.currentTimeMillis() + 60000;
        while (System.currentTimeMillis() < deadline) {
            String ready = evaluate(scenario, "document.querySelector('#docs-library-root') ? 'READY' : 'WAIT'");
            if (ready != null && ready.contains("READY")) return;
            Thread.sleep(300);
        }
        String diagnostic = evaluate(scenario,
            "(()=>JSON.stringify({title:document.title,url:location.href,readyState:document.readyState,nav:!!document.querySelector(\"button[data-testid='nav-docs_library']\"),main:document.querySelector('main')?.innerText?.slice(0,500)||'',root:!!document.querySelector('#docs-library-root')}) )()");
        throw new AssertionError("Docs & SDS register did not mount in Android WebView; state=" + diagnostic);
    }

    @Test
    public void documentBlobPersistsAcrossActivityRestartAndDownloadIsDispatched() throws Exception {
        ActivityScenario<MainActivity> first = launch();
        openDocsRegister(first);

        String write = evaluateAsync(first,
            "(async()=>{const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('DetergentFormulaExpertDB');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});if(!db.objectStoreNames.contains('documents'))throw new Error('documents store missing');await new Promise((resolve,reject)=>{const tx=db.transaction('documents','readwrite');const blob=new Blob(['ANDROID-WEBVIEW-PDF-PERSISTENCE'],{type:'application/pdf'});tx.objectStore('documents').put({id:'android-webview-persistence-test',title:'Android WebView persistence test',documentType:'SDS',reviewStatus:'UNREVIEWED',fileName:'formula-expert-webview-persistence-test.pdf',mimeType:'application/pdf',fileSizeBytes:blob.size,attachment:blob,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();return 'WRITE_OK'})()");
        assertTrue("IndexedDB write must succeed: " + write, write != null && write.contains("WRITE_OK"));
        first.close();

        ActivityScenario<MainActivity> second = launch();
        openDocsRegister(second);
        String read = evaluateAsync(second,
            "(async()=>{const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('DetergentFormulaExpertDB');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});const row=await new Promise((resolve,reject)=>{const tx=db.transaction('documents','readonly');const req=tx.objectStore('documents').get('android-webview-persistence-test');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});if(!row||!(row.attachment instanceof Blob)){db.close();return 'MISSING_BLOB'}const text=await row.attachment.text();db.close();return text==='ANDROID-WEBVIEW-PDF-PERSISTENCE'?'READ_OK':'BAD_BYTES'})()");
        assertTrue("Stored PDF Blob and bytes must survive activity restart: " + read, read != null && read.contains("READ_OK"));

        String click = evaluate(second,
            "(()=>{const card=[...document.querySelectorAll('article')].find(x=>(x.innerText||'').includes('Android WebView persistence test'));if(!card)return 'NO_CARD';const button=[...card.querySelectorAll('button')].find(x=>(x.innerText||'').includes('Download'));if(!button)return 'NO_DOWNLOAD_BUTTON';button.click();return 'DOWNLOAD_CLICKED'})()");
        assertTrue("Document card download button should be available: " + click, click != null && click.contains("DOWNLOAD_CLICKED"));

        String saved = evaluateAsync(second,
            "(async()=>{for(let i=0;i<75;i++){const status=document.querySelector('[role=status]');if(status&&(status.innerText||'').includes('Saved to Downloads/Formula Expert'))return status.innerText;await new Promise(r=>setTimeout(r,200));}throw new Error('native download confirmation timeout')})()");
        assertTrue("Native Android download should confirm the saved path: " + saved,
            saved != null && saved.contains("formula-expert-webview-persistence-test.pdf"));

        Uri downloads = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        String[] projection = { MediaStore.Downloads.DISPLAY_NAME, MediaStore.Downloads.RELATIVE_PATH };
        String[] selectionArgs = { "formula-expert-webview-persistence-test.pdf" };
        try (Cursor cursor = InstrumentationRegistry.getInstrumentation().getTargetContext()
                .getContentResolver().query(downloads, projection,
                    MediaStore.Downloads.DISPLAY_NAME + "=?", selectionArgs,
                    MediaStore.Downloads.DATE_ADDED + " DESC")) {
            assertNotNull("MediaStore query must return a cursor", cursor);
            assertTrue("Attachment must exist in public Downloads/Formula Expert", cursor.moveToFirst());
            String relativePath = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Downloads.RELATIVE_PATH));
            assertTrue("Attachment must be saved in the Formula Expert Downloads folder: " + relativePath,
                relativePath != null && relativePath.contains("Download/Formula Expert"));
        }
        second.close();
    }
}
