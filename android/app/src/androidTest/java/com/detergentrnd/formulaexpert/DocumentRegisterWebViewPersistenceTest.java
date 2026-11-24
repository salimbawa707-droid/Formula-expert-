package com.detergentrnd.formulaexpert;

import android.content.Context;
import android.content.Intent;
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

    private static ActivityScenario<MainActivity> launch() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        Intent intent = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return ActivityScenario.launch(intent);
    }

    private static void openDocsRegister(ActivityScenario<MainActivity> scenario) throws Exception {
        long deadline = System.currentTimeMillis() + 45000;
        while (System.currentTimeMillis() < deadline) {
            String state = evaluate(scenario, "document.readyState");
            if (state != null && state.contains("complete")) break;
            Thread.sleep(300);
        }
        evaluate(scenario, "(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.innerText||'').includes('Docs & SDS')||(x.innerText||'').trim()==='Documents');if(b)b.click();return 'NAV_CLICKED'})()");
        deadline = System.currentTimeMillis() + 30000;
        while (System.currentTimeMillis() < deadline) {
            String ready = evaluate(scenario, "document.querySelector('#docs-library-root') ? 'READY' : 'WAIT'");
            if (ready != null && ready.contains("READY")) return;
            Thread.sleep(300);
        }
        throw new AssertionError("Docs & SDS register did not mount in Android WebView");
    }

    @Test
    public void documentBlobPersistsAcrossActivityRestartAndDownloadIsDispatched() throws Exception {
        ActivityScenario<MainActivity> first = launch();
        openDocsRegister(first);

        String write = evaluate(first,
            "new Promise((resolve,reject)=>{const req=indexedDB.open('DetergentFormulaExpertDB');req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains('documents')){db.close();reject(new Error('documents store missing'));return;}const tx=db.transaction('documents','readwrite');const blob=new Blob(['ANDROID-WEBVIEW-PDF-PERSISTENCE'],{type:'application/pdf'});tx.objectStore('documents').put({id:'android-webview-persistence-test',title:'Android WebView persistence test',documentType:'SDS',reviewStatus:'UNREVIEWED',fileName:'android-webview-test.pdf',mimeType:'application/pdf',fileSizeBytes:blob.size,attachment:blob,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});tx.oncomplete=()=>{db.close();resolve('WRITE_OK')};tx.onerror=()=>reject(tx.error)}}).then(x=>x).catch(e=>'ERROR:'+e.message)");
        assertTrue("IndexedDB write must succeed: " + write, write != null && write.contains("WRITE_OK"));
        first.close();

        ActivityScenario<MainActivity> second = launch();
        openDocsRegister(second);
        String read = evaluate(second,
            "new Promise((resolve,reject)=>{const req=indexedDB.open('DetergentFormulaExpertDB');req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result;const tx=db.transaction('documents','readonly');const get=tx.objectStore('documents').get('android-webview-persistence-test');get.onsuccess=async()=>{const row=get.result;if(!row||!(row.attachment instanceof Blob)){db.close();resolve('MISSING_BLOB');return;}const text=await row.attachment.text();db.close();resolve(text==='ANDROID-WEBVIEW-PDF-PERSISTENCE'?'READ_OK':'BAD_BYTES')};get.onerror=()=>reject(get.error)}}).then(x=>x).catch(e=>'ERROR:'+e.message)");
        assertTrue("Stored PDF Blob and bytes must survive activity restart: " + read, read != null && read.contains("READ_OK"));

        CountDownLatch downloadLatch = new CountDownLatch(1);
        AtomicReference<String> downloadedUrl = new AtomicReference<>();
        AtomicReference<WebView> webViewRef = new AtomicReference<>();
        second.onActivity(activity -> {
            WebView webView = findWebView(activity.getWindow().getDecorView());
            webViewRef.set(webView);
            webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
                downloadedUrl.set(url);
                downloadLatch.countDown();
            });
        });
        String click = evaluate(second,
            "(()=>{const blob=new Blob(['DOWNLOAD-CHECK'],{type:'application/pdf'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='android-webview-download-check.pdf';document.body.appendChild(a);a.click();a.remove();return 'ANCHOR_CLICKED'})()");
        assertTrue("Attachment download anchor should be dispatched: " + click, click != null && click.contains("ANCHOR_CLICKED"));
        assertTrue("Android WebView must dispatch blob attachment to DownloadListener", downloadLatch.await(8, TimeUnit.SECONDS));
        assertNotNull(downloadedUrl.get());
        second.close();
    }
}
